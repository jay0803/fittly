import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { http } from "../lib/http";
import ProductCard from "../components/ProductCard";
import "../css/MainPage.css";

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(Number(params.get("page") || 0));
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      if (!q.trim()) {
        setItems([]); setTotalPages(0); return;
      }
      try {
        setLoading(true);
        setErr("");
        const data = await http.get("/products/search", {
            params: { q, page, size, sort: "createdAt,DESC" },
        });
        const content = Array.isArray(data) ? data : (data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);

        const mapped = content.map((p, i) => ({
          id: p.id ?? p.productId ?? i,
          brand: p.brand || "",
          name: p.name || "",
          price: p.price ?? 0,
          salePrice: p.discountPrice ?? undefined,
          image: p.thumbnailUrl || "/images/placeholder.png",
          _key: `${p.id ?? i}`,
        }));
        setItems(mapped);
      } catch (e) {
        console.error(e);
        setErr(e?.message || "검색 중 오류가 발생했어요.");
      } finally {
        setLoading(false);
      }
    })();
  }, [q, page, size]);

  return (
    <main className="main-page">
      <section className="recommend">
        <div className="container rec-head">
          <h4>검색 결과: “{q}”</h4>
        </div>

        <div className="container rec-grid" style={{ position: "relative", zIndex: 1 }}>
          {loading && <div>로딩 중…</div>}
          {err && <div>{err}</div>}
          {!loading && !err && items.length === 0 && <div>검색 결과가 없어요.</div>}

          {!loading && !err && items.map((it) =>
            it.id ? (
              <Link key={it._key} to={`/products/${it.id}`} className="product-link">
                <ProductCard item={it} />
              </Link>
            ) : (
              <div key={it._key}>
                <ProductCard item={it} />
              </div>
            )
          )}
        </div>

        {totalPages > 1 && (
          <div className="container" style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              이전
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              다음
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
