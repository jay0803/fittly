import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/admin-hub.css";
import { http } from "../lib/http";
import { getAuth } from "../lib/jwt";

export default function AdminProductHub() {
  const navigate = useNavigate();
  const [role, setRole] = useState("guest");
  const [quickId, setQuickId] = useState("");
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const { role } = getAuth();
    if (role === "ROLE_ADMIN") setRole("admin");
    else if (role === "ROLE_USER") setRole("member");
    else setRole("guest");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await http.get("/admin/products/latest");
        const data = res?.data ?? res ?? [];
        const arr = Array.isArray(data) ? data : (data?.content ?? []);
        const mapped = arr.slice(0, 6).map((p, i) => ({
          id: p.id ?? p.productId ?? p._id ?? i,
          name: p.name ?? "",
          brand: p.brand ?? "",
          price: p.price ?? 0,
          discountPrice: p.discountPrice,
          thumbnailUrl: p.thumbnailUrl ?? "/images/placeholder.png",
        }));
        setLatest(mapped);
      } catch (e) {
        console.error(e);
        setLoadError(e?.message || "최신 상품을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isAdmin = role === "admin";
  const canUse = useMemo(() => isAdmin, [isAdmin]);

  return (
    <main className="admin-hub">
      <header className="admin-hub__header">
        <h1 className="admin-hub__title">상품 관리 허브</h1>
        <p className="admin-hub__subtitle">
          등록 · 수정 · 삭제 작업으로 빠르게 이동하세요.
        </p>
      </header>

      {!canUse && (
        <div className="admin-hub__notice">
          관리자 권한이 필요합니다. (현재 권한: {role})
        </div>
      )}

      <section className="admin-hub__grid" role="navigation" aria-label="상품 관리 작업">
        <article className="admin-hub__card">
          <div className="admin-hub__card-body">
            <h2 className="admin-hub__card-title">상품 등록</h2>
            <p className="admin-hub__card-desc">
              새로운 상품을 등록합니다. 이미지/옵션/할인까지 한 번에.
            </p>

            <Link to="/admin/products" className="admin-hub__btn" aria-disabled={!canUse}>
              등록 페이지로 이동
            </Link>

          </div>
        </article>

        <article className="admin-hub__card">
          <div className="admin-hub__card-body">
            <h2 className="admin-hub__card-title">상품 관리(수정/삭제)</h2>
            <p className="admin-hub__card-desc">
              목록에서 검색/선택하여 수정하거나 삭제합니다.
            </p>
            <Link to="/admin/products/manage" className="admin-hub__btn" aria-disabled={!canUse}>
              관리 페이지로 이동
            </Link>
          </div>
        </article>
        
      </section>

      <section className="admin-hub__latest">
        <div className="admin-hub__latest-head">
          <h3>최근 등록 상품</h3>
          <Link to="/admin/products/manage" className="admin-hub__link">전체 보기 →</Link>
        </div>

        {loading && <div className="admin-hub__muted">로딩 중…</div>}
        {loadError && <div className="admin-hub__error">{loadError}</div>}
        {!loading && !loadError && latest.length === 0 && (
          <div className="admin-hub__muted">최근 등록된 상품이 없습니다.</div>
        )}

        <div className="admin-hub__latest-grid">
          {latest.map((p) => (
            <button
              key={p.id}
              className="admin-hub__latest-card"
              onClick={() => navigate(`/admin/products/${p.id}/edit`)}
              title="클릭하여 수정 페이지로 이동"
            >
              <img src={p.thumbnailUrl} alt={p.name} />
              <div className="admin-hub__latest-info">
                <div className="admin-hub__latest-name">{p.name}</div>
                <div className="admin-hub__latest-brand">{p.brand}</div>
                <div className="admin-hub__latest-price">
                  {p.discountPrice != null && p.discountPrice < (p.price ?? 0) ? (
                    <>
                      <span className="strike">{(p.price ?? 0).toLocaleString()}원</span>
                      <b>{p.discountPrice.toLocaleString()}원</b>
                    </>
                  ) : (
                    <b>{(p.price ?? 0).toLocaleString()}원</b>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
