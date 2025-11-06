// signupComplete.js
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../../lib/http";
import { getAuth } from "../../lib/jwt";
import "../../css/auth.css";
import "../../css/signcomplete.css";
import HashtagText from "../../components/HashtagText";

function assetUrl(p) {
  const base =
    (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ||
    "";
  const b = base.endsWith("/") ? base : base + "/";
  return b + String(p || "").replace(/^\/+/, "");
}

function fmtWon(n) {
  const num = Number(n ?? 0);
  return Number.isFinite(num) ? num.toLocaleString("ko-KR") + "원" : "";
}
function pickThumb(p) {
  return p?.thumbnailUrl ?? p?.thumbnail_url ?? p?.imageUrl ?? p?.image_url ?? p?.thumbnail ?? p?.image ?? "";
}
function pickPrice(p) {
  const d = p?.discountPrice ?? p?.discount_price;
  const n = p?.price;
  return d != null ? d : n != null ? n : null;
}
function readAnyToken() {
  const store = getAuth?.() || {};
  return (
    store.token ||
    store.accessToken ||
    localStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}
async function waitForToken({ tries = 8, intervalMs = 400 } = {}) {
  for (let i = 0; i < tries; i++) {
    const t = readAnyToken();
    if (t) return t;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
async function apiPostJSON(url, body, { auth = true } = {}) {
  const full = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = readAnyToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(full, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : res.text();
}

async function uploadUserPhotos(files) {
  if (!files?.length) return null;
  const token = readAnyToken();
  const fd = new FormData();
  files.forEach((f, i) => fd.append("photos", f, f.name || `photo_${i}.jpg`));
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch("/api/user/photos", { method: "POST", credentials: "include", headers, body: fd });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return { ok:true }; }
}

async function callVisionAnalyze(files) {
  if (!files?.length) return null;
  const first = files[0];
  const tries = [
    "/api/ai/public/vision/analyze",
    "/api/ai/vision/analyze",
  ];
  for (const url of tries) {
    try {
      const fd = new FormData();
      fd.append("file", first);
      fd.append("question", "이미지 핵심요소와 추천 코디 키워드를 간결하게 요약해줘. 해시태그는 서비스의 검색 가능 태그 중에서만 사용.");
      const r = await fetch(url, { method: "POST", credentials: "include", body: fd });
      if (!r.ok) continue;
      return await r.json();
    } catch {}
  }
  return null;
}

async function callAiRecommendSmart(payload) {
  const token = readAnyToken();
  const protos = ["/api/ai/recommend"];
  const publics = ["/api/ai/public/recommend"];

  if (token) {
    for (const p of protos) {
      try {
        const data = await apiPostJSON(p, payload, { auth: true });
        if (data) return data;
      } catch {}
    }
  }
  for (const p of publics) {
    try {
      const data = await apiPostJSON(p, payload, { auth: false });
      if (data) return data;
    } catch {}
  }
  return null;
}

function ProductChip({ item }) {
  const id = item?.id;
  const brand = item?.brand || "";
  const name = item?.name || item?.title || "";
  const thumb = pickThumb(item);
  const price = pickPrice(item);

  const content = (
    <div className="sc-prod">
      <div className="sc-prod-thumb">
        {thumb ? <img src={thumb} alt={name || "item"} /> : <div className="sc-noimg">NO IMAGE</div>}
      </div>
      <div className="sc-prod-info">
        <div className="sc-prod-name">
          {brand ? `[${brand}] ` : ""}
          {name}
        </div>
        {price != null && <div className="sc-prod-price">{fmtWon(price)}</div>}
      </div>
    </div>
  );

  return id ? (
    <Link to={`/products/${id}`} className="sc-prod-link">
      {content}
    </Link>
  ) : (
    content
  );
}

function OutfitPreview({ recommend }) {
  if (!recommend || !Array.isArray(recommend.outfits) || recommend.outfits.length === 0) {
    return (
      <div className="sc-box">
        <div className="sc-box-title">추천 코디</div>
        <p className="sc-box-empty">추천 결과가 아직 없어요.</p>
      </div>
    );
  }
  return (
    <div className="sc-box">
      <div className="sc-box-title">추천 코디</div>
      <div className="sc-outfits">
        {recommend.outfits.slice(0, 2).map((o, idx) => (
          <div key={idx} className="sc-outfit-card">
            <div className="sc-outfit-head">코디 #{idx + 1}</div>
            <div className="sc-outfit-grid">
              {Array.isArray(o.items)
                ? o.items.map((it, i) => (
                    <div key={i} className="sc-slot">
                      <ProductChip item={it} />
                    </div>
                  ))
                : Object.entries(o.items || {}).map(([slot, it]) => (
                    <div key={slot} className="sc-slot">
                      <div className="sc-slot-name">{slot}</div>
                      <ProductChip item={it} />
                    </div>
                  ))}
            </div>
            {o?.totalPrice != null && <div className="sc-outfit-price">총합: {fmtWon(o.totalPrice)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SignupComplete() {
  const LOGO_SRC = assetUrl("images/logo.png");
  const BG = assetUrl("images/loginbackground.jpg");
  const location = useLocation();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [recommend, setRecommend] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const displayName = location.state?.name || "";
  const email = location.state?.email || sp.get("email") || "";
  const signupFiles = location.state?.files || location.state?.photos || null;
  const photosUploaded = !!location.state?.photosUploaded;

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

  useEffect(() => {
    const until = Date.now() + 12000;
    sessionStorage.setItem("__suppress_logout_redirect_until__", String(until));
    return () => sessionStorage.removeItem("__suppress_logout_redirect_until__");
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ai_signup_result");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.analysis) setAnalysis(parsed.analysis);
        if (parsed?.recommend) setRecommend(parsed.recommend);
      }
    } catch {}
  }, []);

  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    if (recommend) return;
    runningRef.current = true;

    (async () => {
      setLoading(true);
      const token = await waitForToken();
      const tokenExists = !!token;
      setNoSession(!tokenExists);

      try {

        if (!photosUploaded && signupFiles?.length && tokenExists) {
          await uploadUserPhotos(signupFiles);
        }

        let analysisRes = null;
        if (signupFiles?.length) {
          analysisRes = await callVisionAnalyze(signupFiles);
          if (analysisRes) setAnalysis(analysisRes);
        }

        const preferredStyles =
          (location.state?.preferredStyles && location.state.preferredStyles.length)
            ? location.state.preferredStyles
            : JSON.parse(sessionStorage.getItem("preferredStyles") || "[]");

        const preferredCategories =
          (location.state?.preferredCategories && location.state.preferredCategories.length)
            ? location.state.preferredCategories
            : JSON.parse(sessionStorage.getItem("preferredCategories") || "[]");

        const bodyType =
          analysisRes?.bodyType ||
          location.state?.bodyType ||
          null;

        const recPayload = {
          bodyType,
          preferredStyles: preferredStyles?.length ? preferredStyles : ["CASUAL","STREET","URBAN","HIPHOP","VINTAGE"],
          preferredCategories: preferredCategories?.length ? preferredCategories : ["TOP","BOTTOM","OUTER","SHOES"],
          outfitCount: 2,
          origin: "signup_complete"
        };

        const recRes = await callAiRecommendSmart(recPayload);
        if (recRes) {
          setRecommend(recRes);
          try {
            sessionStorage.setItem("ai_signup_result", JSON.stringify({
              analysis: analysisRes || analysis,
              recommend: recRes,
            }));
          } catch {}
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        runningRef.current = false;
      }
    })();

  }, [analysis, recommend, signupFiles, photosUploaded, location.state]);

  return (
    <div className="sign-complete-wrap">
      <div className="sign-complete-card">
        <div className="sign-complete-head">
          <a href="/"><img src={LOGO_SRC} alt="Fittly" className="sign-complete-logo" /></a>
        </div>

        <div className="sign-complete-icon" aria-hidden="true">✔</div>
        <h2 className="sign-complete-title">회원가입이 완료되었어요</h2>
        {email ? (
          <p className="sign-complete-sub"><b>{email}</b> 로 안내 메일을 전송했습니다.</p>
        ) : (
          <p className="sign-complete-sub">{displayName ? `${displayName}님, ` : ""}Fittly에 오신 것을 환영합니다!</p>
        )}

        {noSession && (
          <div className="sc-box sc-alert">
            <div className="sc-box-title">알림</div>
            <p className="sc-alert-text">로그인 세션이 없어도 기본 추천을 보여드려요.</p>
          </div>
        )}

        {analysis?.summary && (
          <div className="sc-box">
            <div className="sc-box-title">이미지 분석 요약</div>
            <HashtagText
              className="sc-pre"
              text={analysis.summary}
              to="/search"
              param="tag"
            />
          </div>
        )}

        {loading && (
          <div className="sc-box">
            <div className="sc-box-title">AI 추천 준비중…</div>
            <p className="sc-box-empty">사진 업로드/분석/추천을 진행하고 있어요.</p>
          </div>
        )}

        <OutfitPreview recommend={recommend} />

        <div className="sign-complete-body">
          <p className="sc-cta">
            더 자세한 <b>AI 추천 코디</b>를 받아보시겠어요?{" "}
            <Link to="/ai/vision" className="sc-link sc-link-cta">AI추천 상세 페이지로 이동</Link>
          </p>
          <p style={{ marginTop: 8 }}>
            이제 로그인하시면 더 많은 서비스를 이용하실 수 있어요. 이메일 인증을 요청하셨다면, 메일함에서 인증을 완료해 주세요.
          </p>
        </div>

        <div className="sign-complete-actions">
          <Link to="/login/user" className="sc-btn sc-btn-primary">로그인하기</Link>
          <Link to="/" className="sc-btn sc-btn-outline">메인 홈으로</Link>
        </div>
      </div>
    </div>
  );
}
