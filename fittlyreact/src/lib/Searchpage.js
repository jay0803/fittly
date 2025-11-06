import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../lib/http";
import "./search.css";

export default function SearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const q = params.get("q") || "";
  const singleTag = params.get("tag") || "";
  const rawTags = params.get("tags") || "";
  const tags = useMemo(() => {
    const list = [];
    if (singleTag) list.push(singleTag);
    if (rawTags) rawTags.split(",").forEach(t => t && list.push(t));
    return Array.from(new Set(list));
  }, [singleTag, rawTags]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        let res;
        if (tags.length) {
          res = await http.get("/api/products/by-tags", {
            params: { tags: tags.join(","), limit: 48 },
          });
        } else if (q) {
          res = await http.get("/api/products/search", {
            params: { q, size: 48 },
          });
        } else {
          res = await http.get("/api/products", { params: { size: 48 } });
        }

        const data =
          (res && (res.data?.items || res.data?.content || res.data)) ||
          res?.items ||
          res?.content ||
          [];
        if (!aborted) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!aborted) {
          setItems([]);
          setErr("상품을 불러오지 못했어요.");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [q, singleTag, rawTags, tags.length]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const value = e.target.elements.q.value.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const makeThumb = (u) => (u ? u : "/images/noimage.png");

  return (
    <div className="search-wrap container">
      <h2 className="title">상품 검색</h2>

      <form className="search-box" onSubmit={handleSearchSubmit}>
        <input name="q" defaultValue={q} placeholder="검색어를 입력하세요" />
        <button type="submit">검색</button>
      </form>

      <div className="active-filters">
        {q && <span className="chip">키워드: {q}</span>}
        {tags.map((t) => (
          <span key={t} className="chip">#{t}</span>
        ))}
        {!q && tags.length === 0 && <span className="muted">전체 상품</span>}
      </div>

      {loading && <div className="muted">불러오는 중…</div>}
      {err && <div className="error">{err}</div>}

      <div className="grid">
        {items.map((p) => (
          <Link key={p.id} className="card" to={`/products/${p.id}`}>
            <div className="thumb">
              <img src={makeThumb(p.thumbnailUrl)} alt={p.name} />
              {p.discountRate ? (
                <span className="badge">-{p.discountRate}%</span>
              ) : null}
            </div>
            <div className="info">
              <div className="name">{p.name}</div>
              <div className="price">
                {typeof p.price === "number"
                  ? p.price.toLocaleString()
                  : p.price}
                원
              </div>
              {p.tags && (
                <div className="tags">
                  {String(p.tags)
                    .split(",")
                    .slice(0, 3)
                    .map((t) => (
                      <Link
                        key={t}
                        className="tag"
                        to={`/search?tags=${encodeURIComponent(t)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{t}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="muted">검색 결과가 없어요.</div>
      )}
    </div>
  );
}
