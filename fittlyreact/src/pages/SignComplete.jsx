import { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "../lib/jwt";
import { recommend } from "../lib/ai";

export default function SignComplete() {
  const [reco, setReco] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const ranRef = useRef(false);
  const token =
    getAuth()?.token ||
    getAuth()?.accessToken ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const data = await recommend({
          bodyType: "MUSCULAR",
          preferredStyles: ["ATHLEISURE", "TECHWEAR"],
          categories: ["TOP", "BOTTOM", "OUTER", "SHOES"],
          outfitCount: 2,
        });
        if (!ac.signal.aborted) setReco(data);
      } catch (e) {
        if (!ac.signal.aborted) setErr(e);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const hasOutfits = useMemo(
    () => !!(reco && Array.isArray(reco.outfits) && reco.outfits.length > 0),
    [reco]
  );

  const showSessionWarn = useMemo(() => {
    if (hasOutfits) return false;
    if (err && (err?.response?.status === 401 || err?.status === 401)) return true;
    return !token;
  }, [token, hasOutfits, err]);

  return (
    <div className="sign-complete-wrap">
      <div className="sign-complete-card">
        <h2>회원가입 완료</h2>

        {showSessionWarn && (
          <div className="sc-box">
            <div className="sc-box-title">알림</div>
            <div className="sc-box-empty">로그인 세션이 없어 추천을 불러올 수 없습니다.</div>
          </div>
        )}

        <div className="sc-box sc-reco">
          <div className="sc-box-title">추천 코디</div>

          {loading && <div className="sc-box-empty">추천 불러오는 중…</div>}

          {!loading && !hasOutfits && !err && (
            <div className="sc-box-empty">추천 결과가 아직 없어요.</div>
          )}

          {!loading && err && !hasOutfits && (
            <div className="sc-box-empty">추천 호출 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.</div>
          )}

          {!loading && hasOutfits && (
            <div className="sc-outfits">
              {(reco?.outfits ?? []).map((o, i) => {
                const computedTotal =
                  (o && typeof o.totalPrice === "number")
                    ? o.totalPrice
                    : (o?.items ?? []).reduce((sum, it) => {
                        const base = typeof it?.discountPrice === "number" ? it.discountPrice : (it?.price || 0);
                        return sum + base;
                      }, 0);

                return (
                  <div className="sc-outfit-card" key={i}>
                    <div className="sc-outfit-head">
                      <span className="sc-badge">LOOK {i + 1}</span>
                      <span className="sc-category">{o.category}</span>
                    </div>

                    <div className="sc-grid">
                      {(o?.items ?? []).map((it) => (
                        <div className="sc-item" key={it.id}>
                          {it.thumbnailUrl && (
                            <img className="sc-thumb" src={it.thumbnailUrl} alt={it.name} />
                          )}
                          <div className="sc-meta">
                            {it.brand && <div className="sc-brand">{it.brand}</div>}
                            <div className="sc-name">{it.name}</div>
                            <div className="sc-price">
                              {typeof it.price === "number" ? it.price.toLocaleString() : "0"}원
                              {typeof it.discountPrice === "number"
                                ? ` → ${it.discountPrice.toLocaleString()}원`
                                : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="sc-outfit-price">
                      예상 총액: {computedTotal.toLocaleString()}원
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sc-cta-banner">
          <div className="sc-cta-left">
            더 자세한 <b>AI 추천 코디</b>를 받아보시겠어요?
          </div>
          <a href="/ai/recommend" className="sc-cta-link">
            AI추천 상세 페이지로 이동 <span className="sc-cta-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
