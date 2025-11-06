import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../../css/auth.css";
import "../../css/login.css";
import { http } from "../../lib/http";

const FASHION_STYLE_OPTIONS = [
  "미니멀","스트리트","캐주얼","애슬레저","아메카지",
  "클래식/포멀","테크웨어","빈티지","모던","프레피","고프코어","Y2K"
];
const PRODUCT_CATEGORY_OPTIONS = ["상의","하의","아우터","신발"];

export default function AiStylist() {
  const [files, setFiles] = useState([]);
  const [styles, setStyles] = useState([]);
  const [cats, setCats] = useState([...PRODUCT_CATEGORY_OPTIONS]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [reco, setReco] = useState(null);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const styleCount = styles.length;
  const toggleStyle = (s) => {
    setStyles((prev) => {
      const set = new Set(prev);
      if (set.has(s)) set.delete(s);
      else {
        if (set.size >= 5) return prev;
        set.add(s);
      }
      return Array.from(set);
    });
  };
  const toggleCat = (c) => {
    setCats((prev) => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  };

  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);

  const mapKrStyleToCode = (arr) => {
    const map = {
      "미니멀":"MINIMAL","스트리트":"STREET","캐주얼":"CASUAL","애슬레저":"ATHLEISURE",
      "아메카지":"AMEKAZI","클래식/포멀":"CLASSIC","테크웨어":"TECHWEAR","빈티지":"VINTAGE",
      "모던":"MODERN","프레피":"PREPPY","고프코어":"GORPCORE","Y2K":"Y2K"
    };
    return (arr || []).map(k => map[k] || k);
  };
  const mapKrCatToCode = (arr) => {
    const map = { "상의":"TOP","하의":"BOTTOM","아우터":"OUTER","신발":"SHOES" };
    return (arr || []).map(k => map[k] || k);
  };

  const run = async () => {
    setErr(""); setReco(null); setAnalysis(null);
    if (files.length === 0) {
      setErr("사진을 최소 1장 업로드해 주세요.");
      fileRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const a = await http.post("/ai/analyze", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnalysis(a);

      const r = await http.post("/ai/recommend", {
        bodyType: a.bodyType,
        preferredStyles: mapKrStyleToCode(styles.length ? styles : a.detectedStyles),
        categories: mapKrCatToCode(cats),
        outfitCount: 2
      });
      setReco(r);
    } catch (e) {
      setErr(e.message || "오류가 발생했습니다.");
      alert(e.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-login-wrap">
      <div>
        <Link to="/"><img src="/images/logo.png" alt="Fittly Logo" className="login-logo" /></Link>
        <div className="auth-login-card" style={{ maxWidth: 960 }}>
          <h2>AI 스타일 분석 & 추천</h2>

          <div className="row" style={{ marginTop: 8 }}>
            <label className="label">분석할 사진 업로드 (최대 3장)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const arr = Array.from(e.target.files || []).slice(0, 3);
                setFiles(arr);
              }}
            />
            {previews.length > 0 && (
              <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                {previews.map((src, idx) => (
                  <img key={idx} src={src} alt={`preview${idx}`} style={{ width:120, height:120, objectFit:"cover", borderRadius:8, border:"1px solid #eee" }} />
                ))}
              </div>
            )}
          </div>

          <h3 className="section-title" style={{ marginTop: 16 }}>
            선호 패션 스타일 <small>(선택 · 최대 5개)</small>
          </h3>
          <div className="chips-grid">
            {FASHION_STYLE_OPTIONS.map((s) => {
              const on = styles.includes(s);
              const disabled = !on && styles.length >= 5;
              return (
                <label key={s} className={`chip ${on ? "chip-on" : ""} ${disabled ? "chip-disabled" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleStyle(s)} disabled={disabled}/>
                  <span>{s}</span>
                </label>
              );
            })}
          </div>

          <h3 className="section-title" style={{ marginTop: 16 }}>추천받을 카테고리</h3>
          <div className="chips-grid">
            {PRODUCT_CATEGORY_OPTIONS.map((c) => {
              const on = cats.includes(c);
              return (
                <label key={c} className={`chip ${on ? "chip-on" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleCat(c)} />
                  <span>{c}</span>
                </label>
              );
            })}
          </div>

          <button className="btn-primary" onClick={run} disabled={loading} style={{ marginTop: 14 }}>
            {loading ? "분석 및 추천 중..." : "분석 시작"}
          </button>

          {err && <div className="error" role="alert" style={{ marginTop: 10 }}>{err}</div>}

          {analysis && (
            <div style={{ marginTop: 24, padding:16, border:"1px solid #eee", borderRadius:12 }}>
              <h3>AI 분석 결과</h3>
              <p>추정 체형: <b>{analysis.bodyTypeKor || analysis.bodyType}</b></p>
              {analysis.detectedStyles?.length > 0 && (
                <p>탐지 스타일: {analysis.detectedStyles.join(", ")}</p>
              )}
            </div>
          )}

          {reco?.outfits?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>추천 코디</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
                {reco.outfits.map((o, idx) => {
                  const items = o.items || {};
                  const sum = o.totalPrice;
                  return (
                    <div key={idx} style={{ border:"1px solid #eee", borderRadius:12, padding:12 }}>
                      <h4 style={{ marginBottom:8 }}>코디 #{idx+1}</h4>
                      {["TOP","BOTTOM","OUTER","SHOES"].map((cat) => {
                        const it = items[cat];
                        if (!it) return null;
                        return (
                          <Link key={cat} to={`/product/${it.id}`} className="btn-link" style={{ display:"flex", gap:8, alignItems:"center", textDecoration:"none", marginBottom:8 }}>
                            <img src={it.imageUrl} alt={it.name} style={{ width:64, height:64, objectFit:"cover", borderRadius:8, border:"1px solid #eee" }}/>
                            <div style={{ color:"#111" }}>
                              <div style={{ fontWeight:600 }}>{it.name}</div>
                              <div>{it.categoryLabel} · {it.price?.toLocaleString()}원</div>
                            </div>
                          </Link>
                        );
                      })}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                        <div><b>합계</b> {sum?.toLocaleString()}원</div>
                        <button className="btn-primary btn-compact" onClick={() => alert("세트 담기(예시). 단품은 각 상품 상세에서 구매하세요!")}>세트 담기</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
