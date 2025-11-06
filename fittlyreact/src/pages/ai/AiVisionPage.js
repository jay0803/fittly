// src/pages/ai/AiVisionPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyzeImage, chatVision } from "../../api/ai";
import { http } from "../../lib/http";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/auth.css";
import "../../css/ai-stylist.css";

function assetUrl(p) {
  const base =
    (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ||
    "";
  const b = base.endsWith("/") ? base : base + "/";
  return b + String(p || "").replace(/^\/+/, "");
}

const CHAT_CATEGORIES = ["스타일", "계절", "색감", "체형보완", "TPO", "세탁·관리", "가격대"];
const STYLE_CATEGORY_CHIPS = ["스트릿", "캐주얼", "힙합", "빈티지", "어반"];
const SYSTEM_PROMPT_BASE =
  "너는 패션 스타일리스트야. 한국어로 간결하고 실전적으로 답해줘. " +
  "홈페이지 등록상품을 추천할 때는 검색 가능한 해시태그만 사용해(#태그). " +
  "해시태그는 반드시 제공된 허용 목록 안에서만 선택하고, 원문에 적을 때는 #표기를 유지해.";

const FALLBACK_POPULAR_TAGS = ["베이직","여름","상의","아우터","블랙","오피스","캐주얼","스트릿","여성","남성"];
const tagKey = (s) =>
  String(s || "")
    .replace(/^#/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, "")
    .toLowerCase();

const STYLE_EN_TO_KO = {
  STREET: "스트릿",
  CASUAL: "캐주얼",
  HIPHOP: "힙합",
  VINTAGE: "빈티지",
  URBAN: "어반",
};
const STYLE_KO_TO_EN = Object.fromEntries(Object.entries(STYLE_EN_TO_KO).map(([en, ko]) => [ko, en]));
const KEYWORD_TO_TAG = {
  오버사이즈: "오버핏",
  오버핏: "오버핏",
  여성: "여성",
  남성: "남성",
  상의: "상의",
  하의: "하의",
  아우터: "아우터",
  신발: "신발",
  티셔츠: "상의",
  티: "상의",
  후드: "후디",
  후디: "후디",
  카고: "카고",
  조거: "조거",
  그래픽: "그래픽",
};

function renderRichTextAllAllowed(text, allowedSet) {
  if (!text) return null;
  const parts = [];
  const regex = /#([A-Za-z가-힣0-9_]+)|```([\s\S]*?)```|\n/g;
  let lastIndex = 0, m;

  while ((m = regex.exec(text)) !== null) {
    const [match, tag, fenced] = m;
    const idx = m.index;
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));

    if (match === "\n") {
      parts.push(<br key={`br-${idx}`} />);
    } else if (fenced !== undefined) {
      parts.push(<pre className="code" key={`code-${idx}`}>{fenced}</pre>);
    } else if (tag) {
      const idm = /^p?(\d+)$/i.exec(tag);
      if (idm) {
        const pid = idm[1];
        parts.push(
          <Link key={`pid-${idx}`} className="tag tag-prod" to={`/products/${pid}`}>
            #{`P${pid}`}
          </Link>
        );
      } else {
        const maybeKo = STYLE_EN_TO_KO[tag.toUpperCase()] || tag.replace(/_/g, " ");
        const mapped = KEYWORD_TO_TAG[maybeKo] || maybeKo;
        const isAllowed = allowedSet?.has(tagKey(mapped));
        parts.push(
          <Link
            key={`tag-${idx}`}
            className={`tag ${isAllowed ? "tag-link" : "tag-weak"}`}
            to={`/search?q=${encodeURIComponent(mapped)}`}
          >
            #{mapped}
          </Link>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

async function fetchAllTags() {
  try {
    const res = await fetch("/api/products/tags/all");
    if (!res.ok) throw new Error();
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
async function fetchPopularTags(limit = 30) {
  try {
    const res = await fetch(`/api/products/tags/top?limit=${limit}`);
    if (!res.ok) throw new Error();
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch { return FALLBACK_POPULAR_TAGS; }
}
async function fetchTagSuggest(prefix, limit = 20) {
  const qs = `?prefix=${encodeURIComponent(prefix || "")}&limit=${limit}`;
  try {
    const res = await fetch(`/api/products/tags/suggest${qs}`);
    if (!res.ok) throw new Error();
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

const STYLE_HINTS = {
  STREET:  ["스트릿","스케이트","카고","후디","그래픽"],
  HIPHOP:  ["힙합","스트릿","오버사이즈","와이드","조거"],
  URBAN:   ["어반","모던","미니멀","시티","톤온톤"],
  CASUAL:  ["캐주얼","베이직","데일리","셔츠","데님"],
  VINTAGE: ["빈티지","레트로","워싱","루즈핏","플란넬"],
};

function extractRecommendKeywords(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /추천\s*코디\s*키워드/i.test(l));
  if (startIdx === -1) return [];
  const out = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row || row.startsWith("###")) break;
    const m = /^[-•]\s*(.+)$/.exec(row);
    if (m && m[1]) {
      m[1].split(/[,\u3001]/).map(s => s.trim()).filter(Boolean).forEach((w) => out.push(w));
    }
  }
  return Array.from(new Set(out));
}

function TryOn({ baseImageUrl }) {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [overlayUrl, setOverlayUrl] = useState("");
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [scale, setScale] = useState(1);
  const [rot, setRot] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const dropRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const h = Number(height) || 170;
    const w = Number(weight) || 70;
    const sH = h / 170;
    const sW = Math.sqrt((w || 70) / 70);
    setScale(Number((0.9 * sH * 0.9 * sW).toFixed(2)));
  }, [height, weight]);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onPrevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => {
      onPrevent(e);
      const f = e.dataTransfer?.files?.[0];
      if (f) setOverlayUrl(URL.createObjectURL(f));
    };
    ["dragenter","dragover","dragleave","drop"].forEach((ev) => el.addEventListener(ev, onPrevent));
    el.addEventListener("drop", onDrop);
    return () => {
      ["dragenter","dragover","dragleave","drop"].forEach((ev) => el.removeEventListener(ev, onPrevent));
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  const pickFromPC = () => fileRef.current?.click();
  const onOverlayFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setOverlayUrl(URL.createObjectURL(f));
  };

  const overlay = {
    wrap: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    card: { maxWidth: 640, width: "100%", background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
    h: { margin: "0 0 8px 0", fontSize: 18, fontWeight: 700 },
    li: { margin: "8px 0", lineHeight: 1.5 },
    close: { marginTop: 12, display: "inline-block" }
  };
  const iconBtn = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 999,
    width: 28, height: 28,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, background: "#fff", cursor: "pointer", marginLeft: 8
  };

  return (
    <div className="tryon">
      <div className="tryon-head" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0, flex: "0 0 auto" }}>가상 피팅 (Beta)</h3>
        <button
          type="button"
          style={iconBtn}
          title="가상 피팅 사용법"
          aria-label="가상 피팅 사용법"
          onClick={() => setShowHelp(true)}
        >
          ?
        </button>
        <div className="tryon-tip" style={{ marginLeft: "auto" }}>
          상품 이미지 URL을 붙여넣거나, 파일을 이 영역에 드롭하세요.
        </div>
      </div>

      {showHelp && (
        <div style={overlay.wrap} onClick={() => setShowHelp(false)}>
          <div style={overlay.card} onClick={(e) => e.stopPropagation()}>
            <div style={overlay.h}>가상 피팅 사용 가이드</div>
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              <li style={overlay.li}><b>내 사진 선택</b> — 좌측 상단 <em>이미지 선택</em>으로 내 전신/상반신 사진을 올립니다.</li>
              <li style={overlay.li}><b>상품 이미지 추가</b> — <em>상품 이미지 URL</em>을 붙여넣거나, 파일을 이 영역에 드래그&드롭/선택합니다.</li>
              <li style={overlay.li}><b>위치/크기/회전 조절</b> — 슬라이더로 자연스럽게 맞춥니다.</li>
              <li style={overlay.li}><b>더 자연스럽게</b> — 배경이 투명한 <code>PNG</code> 이미지를 사용하면 좋습니다.</li>
              <li style={overlay.li}><b>Tip</b> — 키/체중을 입력하면 옷 크기 스케일을 대략 보정해줘요.</li>
            </ol>
            <button className="btn" style={overlay.close} onClick={() => setShowHelp(false)}>확인</button>
          </div>
        </div>
      )}

      <div className="tryon-grid">
        <div className="tryon-ctrl">
          <label>키(cm)
            <input type="number" value={height} onChange={(e)=>setHeight(e.target.value)} min={130} max={210}/>
          </label>
          <label>체중(kg)
            <input type="number" value={weight} onChange={(e)=>setWeight(e.target.value)} min={35} max={150}/>
          </label>
          <label>상품 이미지 URL
            <input type="url" placeholder="https://...png/jpg" value={overlayUrl} onChange={(e)=>setOverlayUrl(e.target.value)}/>
          </label>
          <div className="sliders">
            <div><span>가로 이동</span><input type="range" min={-300} max={300} value={x} onChange={(e)=>setX(+e.target.value)}/></div>
            <div><span>세로 이동</span><input type="range" min={-300} max={300} value={y} onChange={(e)=>setY(+e.target.value)}/></div>
            <div><span>크기</span><input type="range" min={0.4} max={2} step={0.01} value={scale} onChange={(e)=>setScale(+e.target.value)}/></div>
            <div><span>회전</span><input type="range" min={-30} max={30} step={0.5} value={rot} onChange={(e)=>setRot(+e.target.value)}/></div>
          </div>
          <button className="btn" onClick={pickFromPC}>내 PC에서 상품 이미지 선택</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onOverlayFile} />
          <div className="tryon-minihelp">* PNG(배경제거) 이미지면 더 자연스럽습니다.</div>
        </div>

        <div className="tryon-stage" ref={dropRef}>
          {baseImageUrl ? <img className="tryon-base" src={baseImageUrl} alt="base"/> : <div className="tryon-placeholder">좌측에서 내 사진을 선택하면 여기 표시됩니다.</div>}
          {overlayUrl && (
            <img
              className="tryon-overlay"
              src={overlayUrl}
              alt="overlay"
              style={{ transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiVisionPage() {
  const navigate = useNavigate();
  const { isInitialized, isLoggedIn } = useAuth();

  const LOGO = assetUrl("images/logo.png");
  const BG = assetUrl("images/loginbackground.jpg");
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 880);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 초기화 끝난 뒤에만 로그인 체크 → 비회원이면 로그인 페이지로
  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login/user", { replace: true, state: { redirectTo: "/ai/vision" } });
    }
  }, [isInitialized, isLoggedIn, navigate]);

  const [userCtx, setUserCtx] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "system", text: SYSTEM_PROMPT_BASE }]);
  const [q, setQ] = useState("");
  const [asking, setAsking] = useState(false);
  const [allowedTags, setAllowedTags] = useState([]);
  const allowedSet = useMemo(() => new Set(allowedTags.map(tagKey)), [allowedTags]);
  const [popularTags, setPopularTags] = useState(FALLBACK_POPULAR_TAGS);
  const [suggestTags, setSuggestTags] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [aiTags, setAiTags] = useState([]);
  const [aiKeywords, setAiKeywords] = useState([]);
  const [preferredStyles, setPreferredStyles] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("preferredStyles") || "[]"); } catch { return []; }
  });

  const fileRef = useRef(null);
  const chatBoxRef = useRef(null);
  const promptRef = useRef(null);
  const suggestDebounceRef = useRef(null);

  useEffect(() => {
    const body = document.body;
    const prev = {
      bg: body.style.background,
      bImg: body.style.backgroundImage,
      bPos: body.style.backgroundPosition,
      bSize: body.style.backgroundSize,
      bRepeat: body.style.backgroundRepeat,
      bAtt: body.style.backgroundAttachment,
      minH: body.style.minHeight,
    };
    body.style.backgroundImage = `url(${BG})`;
    body.style.backgroundPosition = "center";
    body.style.backgroundSize = "cover";
    body.style.backgroundRepeat = "no-repeat";
    body.style.backgroundAttachment = "fixed";
    body.style.minHeight = "100vh";
    return () => {
      body.style.background = prev.bg;
      body.style.backgroundImage = prev.bImg;
      body.style.backgroundPosition = prev.bPos;
      body.style.backgroundSize = prev.bSize;
      body.style.backgroundRepeat = prev.bRepeat;
      body.style.backgroundAttachment = prev.bAtt;
      body.style.minHeight = prev.minH;
    };
  }, [BG]);

  // 로그인된 상태에서만 유저 컨텍스트 로딩
  useEffect(() => {
    if (!isInitialized || !isLoggedIn) return;

    async function loadUserCtx() {
      try {
        const res = await http.get("/api/user/ai-context");
        const data = res?.data || {};
        if (data && Object.keys(data).length) {
          setUserCtx(normalizeUserCtx(data));
          return;
        }
      } catch (_) {}

      try {
        const [me, profile, images, prefCats, prefStyles] = await Promise.allSettled([
          http.get("/api/user/me"),
          http.get("/api/user/profile"),
          http.get("/api/user/images"),
          http.get("/api/user/pref-category"),
          http.get("/api/user/fashion-style"),
        ]);

        const ctx = normalizeUserCtx({
          user: me?.value?.data,
          profile: profile?.value?.data,
          images: images?.value?.data,
          prefCats: prefCats?.value?.data,
          prefStyles: prefStyles?.value?.data,
        });
        setUserCtx(ctx);
      } catch (e) {
        console.error("userCtx load error:", e);
      }
    }

    function normalizeUserCtx(raw) {
      const user = raw.user || raw?.data?.user || null;
      const profile = raw.profile || raw?.data?.profile || {};
      const prefCats = toArray(raw.prefCats || raw?.data?.prefCats).map(String);
      const prefStyles = toArray(raw.prefStyles || raw?.data?.prefStyles).map(String);
      const images = toArray(raw.images || raw?.data?.images).map((it) =>
        typeof it === "string" ? it : (it?.url || it?.imageUrl || it?.path || "")
      ).filter(Boolean);

      return {
        user,
        profile: {
          gender: profile.gender || profile.sex || "",
          height: profile.height ?? profile.userHeight ?? null,
          weight: profile.weight ?? profile.userWeight ?? null,
          bodyType: profile.bodyType || profile.shape || "",
        },
        prefCats,
        prefStyles,
        images,
      };
    }
    function toArray(x){ return Array.isArray(x) ? x : x ? [x] : []; }

    loadUserCtx();
  }, [isInitialized, isLoggedIn]);

  useEffect(() => {
    if (!file && !previewUrl && userCtx?.images?.length > 0) {
      setPreviewUrl(userCtx.images[0]);
    }
  }, [userCtx, file, previewUrl]);

  useEffect(() => {
    if (!userCtx?.prefStyles?.length) return;
    const dbKo = userCtx.prefStyles.map((s) => {
      const up = String(s).toUpperCase();
      return STYLE_EN_TO_KO[up] || s;
    });
    const merged = Array.from(new Set([...(preferredStyles||[]), ...dbKo]));
    setPreferredStyles(merged);
    try { sessionStorage.setItem("preferredStyles", JSON.stringify(merged)); } catch {}
  }, [userCtx]); // eslint-disable-line

  useEffect(() => () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const canChat = useMemo(() => msgs.some((m) => m.imageData) || !!file || !!previewUrl, [msgs, file, previewUrl]);

  const handlePick = () => fileRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setAnalysis("");
    setAiTags([]);
    setAiKeywords([]);
  };

  const fileToDataUrl = (f) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("file read error"));
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(f);
    });

  const collectAllowedTags = (text) => {
    const found = new Set();
    const regex = /#([A-Za-z가-힣0-9_]+)/g;
    let m;
    while ((m = regex.exec(text || "")) !== null) {
      const raw = m[1];
      const maybeKo = STYLE_EN_TO_KO[raw.toUpperCase()] || raw;
      const mapped = KEYWORD_TO_TAG[maybeKo] || maybeKo;
      if (allowedSet.has(tagKey(mapped))) found.add(mapped.replace(/_/g, " "));
    }
    return Array.from(found);
  };

  const buildUserCtxPrompt = () => {
    if (!userCtx) return "";
    const p = userCtx.profile || {};
    const g = p.gender ? `성별:${p.gender}` : "";
    const hw = [p.height ? `키:${p.height}cm` : "", p.weight ? `체중:${p.weight}kg` : ""].filter(Boolean).join(", ");
    const bt = p.bodyType ? `체형:${p.bodyType}` : "";
    const prefs = [
      userCtx.prefStyles?.length ? `선호스타일:${userCtx.prefStyles.join("/")}` : "",
      userCtx.prefCats?.length ? `관심카테고리:${userCtx.prefCats.join("/")}` : "",
    ].filter(Boolean).join(" / ");
    const line1 = [g, hw, bt].filter(Boolean).join(" · ");
    const line2 = prefs;
    const info = [line1, line2].filter(Boolean).join(" / ");
    return info ? `\n[사용자정보] ${info}\n` : "";
  };

  const buildStyleHint = () => {
    const styles = preferredStyles?.length ? preferredStyles : [];
    if (!styles.length) return "";
    const words = styles
      .map((ko) => STYLE_KO_TO_EN[ko] || ko)
      .flatMap((s) => STYLE_HINTS[s] || STYLE_HINTS[(STYLE_KO_TO_EN[s] || "").toUpperCase()] || [])
      .slice(0, 12);
    return `\n[선호스타일-힌트] ${styles.join(", ")} / 연관 키워드: ${words.join(", ")}\n`;
  };

  const SYSTEM_PROMPT = SYSTEM_PROMPT_BASE + buildUserCtxPrompt();

  useEffect(() => {
    (async () => {
      const all = await fetchAllTags();
      if (all?.length) setAllowedTags(all);

      const top = await fetchPopularTags(30);
      const asKey = (x) => tagKey(x);
      const allSet = new Set((all || []).map(asKey));
      const filtered = all.length ? top.filter(t => allSet.has(asKey(t))) : top;

      const hints = (preferredStyles || []).flatMap(s => STYLE_HINTS[STYLE_KO_TO_EN[s] || s] || []);
      const score = (t) => {
        let s = 0;
        hints.forEach(h => { if (t.includes(h)) s += 2; });
        if (/봄|여름|가을|겨울|스프링|서머|폴|윈터/.test(t)) s += 1;
        if (/상의|아우터|하의|신발/.test(t)) s += 1;
        return s;
      };
      setPopularTags(filtered.sort((a,b) => score(b)-score(a)));
    })();
  }, [preferredStyles]);

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [msgs]);

  const startChatWithImage = async () => {
    let dataUrl = null;
    if (file) dataUrl = await fileToDataUrl(file);
    else if (previewUrl?.startsWith("blob:") || /^data:/.test(previewUrl)) dataUrl = previewUrl;

    const init = [
      { role: "system", text: SYSTEM_PROMPT + "\n[허용 태그 예시] " + allowedTags.slice(0,50).join(", ") + buildStyleHint() },
      ...(dataUrl
        ? [{ role: "user", text: "이 이미지를 분석해줘. 허용 태그만 #태그로 사용해줘.", imageData: dataUrl }]
        : [{ role: "user", text: "내 프로필과 선호 정보를 반영해서, 착장/색감/체형보완 관점에서 추천해줘. 허용 태그만 #태그로 사용." }]
      ),
    ];
    setAsking(true);
    try {
      const res = await chatVision({ messages: init, allowedTags, userContext: userCtx });
      const text = res?.text || "";
      setAnalysis(text);
      setMsgs([...init, { role: "assistant", text }]);
      setAiTags(collectAllowedTags(text));
      setAiKeywords(extractRecommendKeywords(text));
    } catch (e) {
      console.error(e);
      setMsgs((m) => [...m, { role: "assistant", text: "요청 중 오류가 발생했습니다." }]);
    } finally {
      setAsking(false);
    }
  };

  const doAnalyze = async () => {
    if (!file && !previewUrl) return alert("이미지를 선택하거나 프로필 이미지를 등록해 주세요.");
    setAnalyzing(true);
    try {
      const payload = {
        question:
          "이미지 핵심요소(착장/실루엣/색감/포인트)와 개선 팁, " +
          "추천 코디 키워드를 간결하게 알려줘. " +
          "추천 태그는 '허용 태그 목록'에서만 고르고 #태그로 표기해. " +
          "[허용 태그 목록]은 서버에서 제공된 전체 태그 리스트야." +
          buildUserCtxPrompt() + buildStyleHint(),
        allowedTags,
        userContext: userCtx,
      };

      let res;
      if (file) res = await analyzeImage({ file, ...payload });
      else res = await analyzeImage({ imageUrl: previewUrl, ...payload });

      const text = res?.text || "(응답이 없습니다)";
      setAnalysis(text);
      setMsgs((m) => [
        ...m,
        { role: "user", text: "업로드/프로필 이미지 기반 1차 분석 결과를 알려줘." },
        { role: "assistant", text },
      ]);
      setAiTags(collectAllowedTags(text));
      setAiKeywords(extractRecommendKeywords(text));
    } catch (e) {
      console.error(e);
      setAnalysis("분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const detectHashtagPrefix = (inputEl) => {
    if (!inputEl) return { prefix: "", range: null };
    const value = inputEl.value;
    const pos = inputEl.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const m = /(^|\s)#([A-Za-z가-힣0-9_]*)$/.exec(before);
    if (!m) return { prefix: "", range: null };
    const start = pos - (m[2] ? m[2].length : 0);
    return { prefix: m[2] || "", range: [start, pos] };
  };

  const onPromptChange = async (e) => {
    const val = e.target.value;
    setQ(val);
    const { prefix } = detectHashtagPrefix(e.target);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(async () => {
      if (prefix == null) { setShowSuggest(false); return; }
      if (prefix.length === 0) {
        setSuggestTags(popularTags.slice(0, 10));
        setShowSuggest(true);
        return;
      }
      const list = await fetchTagSuggest(prefix);
      setSuggestTags(list);
      setShowSuggest(true);
    }, 160);
  };

  const applySuggestTag = (tagToken) => {
    const el = promptRef.current;
    if (!el) return;
    const { range } = detectHashtagPrefix(el);
    const token = tagToken.replace(/\s+/g, "_");
    if (!range) {
      setQ((prev) => (prev.endsWith(" ") || prev.length === 0 ? prev + "#" + token + " " : prev + " #" + token + " "));
      setShowSuggest(false);
      return;
    }
    const [start, end] = range;
    const beforeHash = el.value.slice(0, start);
    const hashPos = beforeHash.lastIndexOf("#");
    const left = el.value.slice(0, hashPos);
    const right = el.value.slice(end);
    const next = left + "#" + token + right + (right.startsWith(" ") ? "" : " ");
    setQ(next);
    setShowSuggest(false);
    requestAnimationFrame(() => {
      const pos = (left + "#" + token + " ").length;
      el.selectionStart = el.selectionEnd = pos;
      el.focus();
    });
  };

  const ask = async (text) => {
    const content = (text ?? q).trim();
    if (!content) return;
    const systemBoost = {
      role: "system",
      text: SYSTEM_PROMPT + "\n[허용 태그] " + allowedTags.join(", ") + buildStyleHint()
    };
    const ctxHint = buildUserCtxPrompt();
    const userMsg = ctxHint ? `${content}\n${ctxHint}` : content;

    const next = [...msgs, systemBoost, { role: "user", text: userMsg }];
    setMsgs(next);
    setQ("");
    setShowSuggest(false);
    setAsking(true);
    try {
      const res = await chatVision({ messages: next, allowedTags, userContext: userCtx });
      let answer = res?.text || "(응답이 없습니다)";
      if (/(내\s?정보|개인.?정보|회원|카테고리|맞춤|개인화|나에게\s?맞|내\s?(체형|사이즈)|내\s?사진.*어울리|내게.*추천)/i.test(content)) {
        answer += "\n\n— 더 **맞춤형 코디/상품 추천**을 위해 회원정보(체형/선호/카테고리)를 반영했어요.";
      }
      setMsgs((m) => [...m, { role: "assistant", text: answer }]);
      setAiTags(collectAllowedTags(answer));
      setAiKeywords(extractRecommendKeywords(answer));
    } catch (e) {
      console.error(e);
      setMsgs((m) => [...m, { role: "assistant", text: "요청 중 오류가 발생했습니다." }]);
    } finally {
      setAsking(false);
    }
  };

  const onCategoryClick = async (c) => {
    await ask(`${c} 관점에서 이 이미지/프로필에 어울리는 스타일/조합을 추천해줘. #추천_태그도_같이 (허용 태그만 사용)`);
  };

  const goSearch = (word) => {
    if (!word) return;
    const mapped = KEYWORD_TO_TAG[word] || KEYWORD_TO_TAG[word?.replace(/\s+/g,"")] || word;
    const finalWord = STYLE_EN_TO_KO[mapped?.toUpperCase?.()] || mapped;
    navigate(`/search?q=${encodeURIComponent(finalWord)}`);
  };

  const headRowStyle = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };
  const iconStyle = { marginRight: 6, fontSize: 14, lineHeight: 1 };
  const longBtnStyle = { minWidth: 0, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const UserCtxPills = () => {
    if (!userCtx) return null;
    const pills = [];
    const p = userCtx.profile || {};
    if (p.gender) pills.push(<span className="pill" key="g">{p.gender}</span>);
    if (p.height) pills.push(<span className="pill" key="h">{p.height}cm</span>);
    if (p.weight) pills.push(<span className="pill" key="w">{p.weight}kg</span>);
    if (p.bodyType) pills.push(<span className="pill" key="b">{p.bodyType}</span>);
    if (userCtx.prefStyles?.length) pills.push(<span className="pill" key="s">선호: {userCtx.prefStyles.join("/")}</span>);
    if (userCtx.prefCats?.length) pills.push(<span className="pill" key="c">카테고리: {userCtx.prefCats.join("/")}</span>);
    return pills.length ? <div className="user-ctx-hint">{pills}</div> : null;
  };

  // 초기화 중간에 "폼이 안 뜨는" 느낌 방지: 살짝 로딩만 표시(선택)
  if (!isInitialized) {
    return (
      <div className="ai-wrap" style={{ padding: 24, textAlign: "center" }}>
        <div className="spinner" style={{ fontSize: 14, color: "#666" }}>초기화 중…</div>
      </div>
    );
  }

  return (
    <div className="ai-wrap">
      <h2 className="ai-title">AI 이미지 스타일리스트</h2>

      <UserCtxPills />

      <div className="ai-grid">
        <div className="ai-left ai-card">
          <div className="uploader-head" style={headRowStyle}>
            <button className="btn" onClick={handlePick} title="내 사진 선택">
              <span style={iconStyle}>📷</span>이미지 선택
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} hidden />
            <button className="btn btn-outline" onClick={doAnalyze} disabled={(!file && !previewUrl) || analyzing} title="이미지 1차 분석">
              {analyzing ? "분석 중..." : (<><span style={iconStyle}>🔎</span>1차 분석</>)}
            </button>
            <button
              className="btn btn-outline"
              style={longBtnStyle}
              onClick={startChatWithImage}
              disabled={asking || !canChat}
              title="이미지/프로필을 반영해 대화형으로 추천 받기"
              aria-label="대화형 시작"
            >
              <span style={iconStyle}>💬</span>
              {compact ? "대화형 시작" : "대화형 시작 (이미지·프로필 반영)"}
            </button>
          </div>

          <div className="img-preview">
            {previewUrl ? <img src={previewUrl} alt="preview" /> : <span>이미지를 첨부하거나, 프로필 이미지를 등록해 주세요.</span>}
          </div>

          <div className="analysis">
            <h3>AI 답변</h3>
            <div className="ai-answer">
              {renderRichTextAllAllowed(analysis, allowedSet) || "아직 분석 결과가 없습니다."}
            </div>
            {aiKeywords.length > 0 && (
              <div className="tag-bar soft mt8">
                <div className="tag-bar-title">추천 코디 키워드</div>
                <div className="tag-bar-list">
                  {aiKeywords.map((w) => {
                    const mapped = KEYWORD_TO_TAG[w] || w;
                    return (
                      <button
                        key={w}
                        className="tag-link tag-btn"
                        onClick={() => goSearch(mapped)}
                        aria-label={`${mapped} 검색`}
                      >
                        #{mapped}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <TryOn baseImageUrl={previewUrl} />
        </div>

        <div className="ai-right ai-card chat">
          <div className="chip-row">
            {CHAT_CATEGORIES.map((c) => (
              <button key={c} className="chip" onClick={() => onCategoryClick(c)}>{c}</button>
            ))}
          </div>

          <div className="tag-bar ghost">
            <div className="tag-bar-title">스타일 카테고리</div>
            <div className="tag-bar-list">
              {STYLE_CATEGORY_CHIPS.map((name) => (
                <button key={name} className="tag-link tag-btn" onClick={() => goSearch(name)}>#{name}</button>
              ))}
            </div>
          </div>

          <div className="tag-bar">
            <div className="tag-bar-title">인기 태그</div>
            <div className="tag-bar-list">
              {(popularTags || []).slice(0, 20).map((t) => (
                <Link key={t} className="tag-link" to={`/search?q=${encodeURIComponent(t)}`}>#{t}</Link>
              ))}
            </div>
          </div>

          {aiTags.length > 0 && (
            <div className="tag-bar soft">
              <div className="tag-bar-title">이 이미지 추천 태그</div>
              <div className="tag-bar-list">
                {aiTags.map((t) => (
                  <Link key={t} className="tag-link strong" to={`/search?q=${encodeURIComponent(t)}`}>#{t}</Link>
                ))}
              </div>
            </div>
          )}

          <div className="chat-output" ref={chatBoxRef} id="chat">
            {msgs.filter((m) => m.role !== "system").map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="role">{m.role === "assistant" ? "AI" : "나"}</div>
                <div className="bubble">
                  {m.role === "assistant" ? renderRichTextAllAllowed(m.text, allowedSet) : m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="prompt-row">
            <div className="prompt-col">
              <input
                ref={promptRef}
                placeholder="질문 입력 — #을 입력하면 해시태그 제안이 떠요 (Enter 전송)"
                value={q}
                onChange={onPromptChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") ask();
                  if (e.key === "Escape") setShowSuggest(false);
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                disabled={asking}
              />
              {showSuggest && suggestTags.length > 0 && (
                <div className="tag-suggest">
                  {suggestTags.map((t) => (
                    <div
                      key={t}
                      className="tag-suggest-item"
                      onMouseDown={(e) => { e.preventDefault(); applySuggestTag(t); }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn ask-btn" onClick={() => ask()} disabled={asking || !canChat}>
              {asking ? "질문중..." : "질문"}
            </button>
          </div>

          <div className="tip-login">
            개인화 추천은 회원정보(체형/선호/카테고리/이미지)를 반영해 답변합니다.
          </div>
        </div>
      </div>
    </div>
  );
}
