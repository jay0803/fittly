import { useEffect, useRef, useState } from "react";
import { recommend } from "../lib/ai";

export default function RecommendPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await recommend({
          bodyType: "MUSCULAR",
          preferredStyles: ["TECHWEAR", "ATHLEISURE"],
          categories: ["TOP", "BOTTOM", "OUTER", "SHOES"],
          maxItemsPerCategory: 8,
        });
        if (!ac.signal.aborted) setOutfits(res?.outfits ?? []);
      } catch (e) {
        if (!ac.signal.aborted) {
          console.error(e);
          const msg =
            e?.response?.data?.message ||
            e?.message ||
            "추천 로딩 실패";
          setErr(msg);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <div className="sub">추천 생성 중...</div>;
  if (err) return <div className="sub" style={{ color: "#d33" }}>{err}</div>;

  return (
    <div className="container ai-commend">
      <h2 className="title">AI 추천 코디</h2>

      {!outfits.length ? (
        <div className="sub">추천 결과가 비어있어요. 다른 스타일/카테고리로 다시 시도해 보세요.</div>
      ) : (
        outfits.map((o, idx) => (
          <section key={idx} className="card" style={{ marginTop: 12 }}>
            <h3 className="q-title">{o.category}</h3>

            <div className="row">
              {(o.items ?? []).map((it) => (
                <article key={it.id} className="pd-card">
                  {it.thumbnailUrl ? (
                    <img src={it.thumbnailUrl} alt={it.name} />
                  ) : null}
                  <div className="pd-meta">
                    <b>{it.name}</b>
                    {it.brand && <div>{it.brand}</div>}
                    <div>
                      {typeof it.price === "number" ? it.price.toLocaleString() : "0"}원
                      {typeof it.discountPrice === "number"
                        ? ` → ${it.discountPrice.toLocaleString()}원`
                        : ""}
                    </div>
                    <a className="btn-primary" href={`/products/${it.id}`}>보러가기</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
