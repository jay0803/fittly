// src/pages/MainPage.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import "../css/MainPage.css";
import { http } from "../lib/http";
import { useAuth } from "../contexts/AuthContext";

export default function MainPage() {
  const navigate = useNavigate();
  const { isInitialized, isLoggedIn } = useAuth();

  const banners = ["", "/images/banner1.png", "/images/banner2.png", "/images/banner3.png"];
  const [current, setCurrent] = useState(0);
  const nextBanner = () => setCurrent((p) => (p + 1) % banners.length);
  const prevBanner = () => setCurrent((p) => (p - 1 + banners.length) % banners.length);

  const goVision = React.useCallback(() => {
    if (!isInitialized) return; // 초기화 전엔 동작하지 않음(가짜 비로그인 방지)
    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login/user", { replace: true, state: { from: "/ai/vision?src=banner1", redirectTo: "/ai/vision?src=banner1" } });
      return;
    }
    navigate("/ai/vision?src=banner1");
  }, [isInitialized, isLoggedIn, navigate]);

  const CATS = [
    { label: "전체", key: "all" },
    { label: "상의", key: "top" },
    { label: "하의", key: "bottom" },
    { label: "아우터", key: "outer" },
    { label: "신발", key: "shoes" },
  ];
  const [selectedCat, setSelectedCat] = useState("all");
  const PAGE_SIZE = 12;
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const mapToCard = useCallback((data) => {
    const arr = Array.isArray(data) ? data : [];
    return arr.map((p, i) => {
      const id = p.id ?? p.productId ?? p._id ?? null;
      return {
        id,
        brand: p.brand || "",
        name: p.name || "",
        price: p.price ?? 0,
        salePrice: p.discountPrice ?? undefined,
        discountPrice: p.discountPrice ?? undefined,
        image: p.thumbnailUrl || "/images/placeholder.png",
        badge: p.discountPrice != null && p.discountPrice < (p.price ?? 0) ? "세일" : undefined,
        _key: id ?? `row-${i}-${Math.random().toString(36).slice(2)}`
      };
    });
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoadError("");
  }, [selectedCat]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const limit = page * PAGE_SIZE;
        const url =
          selectedCat === "all"
            ? `/products/latest?limit=${limit}`
            : `/products/category/${selectedCat}?limit=${limit}`;

        const res = await http.get(url);
        const raw = res?.data ?? res ?? [];
        const mappedAll = mapToCard(raw);

        setItems((prev) => {
          const sliceStart = prev.length;
          const newly = mappedAll.slice(sliceStart);
          const prevIds = new Set(prev.map((x) => x.id).filter(Boolean));
          const deduped = newly.filter((x) => !x.id || !prevIds.has(x.id));
          if (deduped.length < PAGE_SIZE) setHasMore(false);
          return [...prev, ...deduped];
        });
      } catch (e) {
        console.error(e);
        let msg = "상품을 불러오는 중 문제가 발생했어요.";
        if (e?.message) msg = e.message;
        if (e?.response?.status) msg += ` (Status: ${e.response.status})`;
        if (!cancelled) setLoadError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [page, selectedCat, mapToCard]);

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && hasMore && !loadError) {
          setPage((p) => p + 1);
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.unobserve(el);
  }, [loading, hasMore, loadError]);

  const currentLabel = CATS.find((c) => c.key === selectedCat)?.label ?? "전체";

  return (
    <div className="main-page">
      <section className="hero">
        <div className="container">
          <div
            className="hero-inner"
            style={
              banners[current]
                ? {
                    backgroundImage: `url(${banners[current]})`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : undefined
            }
          >
            {current === 0 && (
              <div className="hero-text">
                <h3>AI가 추천하는 오늘의 코디</h3>
                <button className="cta" onClick={goVision} disabled={!isInitialized}>
                  AI 추천 상세받기
                </button>
              </div>
            )}

            <button className="arrow left" onClick={prevBanner} aria-label="이전 배너">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button className="arrow right" onClick={nextBanner} aria-label="다음 배너">
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>
      <div className="chips-inner">
        {CATS.map((c) => (
          <button
            key={c.key}
            className={`chip ${selectedCat === c.key ? "active" : ""}`}
            onClick={() => setSelectedCat(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <section className="recommend">
        <div className="container rec-head">
          <h4>{selectedCat === "all" ? "전체 상품" : `카테고리: ${currentLabel}`}</h4>
        </div>

        <div className="container rec-grid" style={{ position: "relative", zIndex: 1 }}>
          {loadError && <div className="error">{loadError}</div>}
          {!loadError && items.length === 0 && !loading && <div>상품이 없습니다.</div>}

          {items.map((it) =>
            it.id ? (
              <Link key={it._key} to={`/products/${it.id}`} className="product-link">
                <ProductCard item={it} />
              </Link>
            ) : (
              <div key={it._key} title="상품 ID가 없어 상세 이동 불가">
                <ProductCard item={it} />
              </div>
            )
          )}

          <div ref={sentinelRef} style={{ height: 1 }} />
          {loading && <div className="loading">로딩 중…</div>}
          {!hasMore && items.length > 0 && (
            <div className="end-hint" style={{ textAlign: "center", padding: "16px 0", color: "#888" }}>
              더 이상 상품이 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
