import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../css/ManageProductsPage.css";
import { http } from "../lib/http";

export default function ManageProductsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [status, setStatus] = useState(params.get("status") || "ACTIVE_ALL");
  const [sort, setSort] = useState(params.get("sort") || "createdAt,DESC");
  const [page, setPage] = useState(Number(params.get("page") || 0));
  const [size, setSize] = useState(Number(params.get("size") || 12));
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (sort) next.set("sort", sort);
    next.set("page", String(page));
    next.set("size", String(size));
    setParams(next, { replace: true });
  }, [query, status, sort, page, size, setParams]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await http.get("/admin/products", {
          params: { query, status, page, size, sort },
        });

        const data = res?.data ?? res ?? [];
        const content = Array.isArray(data) ? data : data?.content ?? [];
        const mapped = content.map((p, i) => ({
          id: p.id ?? p.productId ?? p._id ?? i,
          name: p.name ?? "",
          brand: p.brand ?? "",
          price: p.price ?? 0,
          discountPrice: p.discountPrice,
          status: p.status ?? "ACTIVE",
          thumbnailUrl: p.thumbnailUrl ?? "/images/placeholder.png",
          createdAt: p.createdAt ?? p.createdDate ?? null,
        }));

        setRows(mapped);
        setTotal(Array.isArray(data) ? mapped.length : data?.totalElements ?? mapped.length);
        setTotalPages(Array.isArray(data) ? 1 : data?.totalPages ?? 1);
      } catch (e) {
        console.error(e);
        setLoadError(e?.message || "목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [query, status, page, size, sort]);

  const pageNums = useMemo(() => {
    const list = [];
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) list.push(i);
    return list;
  }, [page, totalPages]);

  const doDelete = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`${ids.length}개 상품을 삭제하시겠습니까?`)) return;
    let succeed = 0;
    for (const id of ids) {
      try {
        await http.delete(`/admin/products/${id}`);
        succeed++;
      } catch (e) {
        console.error("삭제 실패:", id, e);
      }
    }
    alert(`${succeed}개 삭제 완료${succeed !== ids.length ? " (일부 실패)" : ""}`);
    setSelected(new Set());
    const res = await http.get("/admin/products", { params: { query, status, page, size, sort } });
    const data = res?.data ?? res ?? [];
    const content = Array.isArray(data) ? data : data?.content ?? [];
    const mapped = content.map((p, i) => ({
      id: p.id ?? p.productId ?? p._id ?? i,
      name: p.name ?? "",
      brand: p.brand ?? "",
      price: p.price ?? 0,
      discountPrice: p.discountPrice,
      status: p.status ?? "ACTIVE",
      thumbnailUrl: p.thumbnailUrl ?? "/images/placeholder.png",
      createdAt: p.createdAt ?? p.createdDate ?? null,
    }));
    setRows(mapped);
    setTotal(Array.isArray(data) ? mapped.length : data?.totalElements ?? mapped.length);
    setTotalPages(Array.isArray(data) ? 1 : data?.totalPages ?? 1);
  };

  return (
    <main className="admin-manage">
      <div className="admin-manage__head">
        <h1>상품 관리</h1>
        <div className="admin-manage__head-actions">
          <Link to="/admin/products" className="btn primary">상품 등록</Link>
          {selected.size > 0 && (
            <button className="btn danger" onClick={() => doDelete([...selected])}>
              선택 {selected.size}건 삭제
            </button>
          )}
        </div>
      </div>

      <section className="admin-manage__filters">
        <div className="row">
          <div className="field">
            <label>검색어</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명/브랜드/태그"
            />
          </div>
          <div className="field">
            <label>상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE_ALL">판매중(기본)</option>
              <option value="HIDDEN">숨김</option>
              <option value="DELETED">삭제됨</option>
              <option value="ALL">전체</option>
            </select>
          </div>
          <div className="field">
            <label>정렬</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="createdAt,DESC">최신등록 순</option>
              <option value="createdAt,ASC">오래된 순</option>
              <option value="price,ASC">가격 낮은 순</option>
              <option value="price,DESC">가격 높은 순</option>
              <option value="name,ASC">이름 오름차순</option>
              <option value="name,DESC">이름 내림차순</option>
            </select>
          </div>
          <div className="field">
            <label>페이지 크기</label>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
          <div className="field field--actions">
            <button className="btn" onClick={() => setPage(0)}>적용</button>
            <button
              className="btn ghost"
              onClick={() => { setQuery(""); setStatus("ACTIVE_ALL"); setSort("createdAt,DESC"); setPage(0); }}
            >
              초기화
            </button>
          </div>
        </div>
      </section>

      <section className="admin-manage__list">
        {loading && <div className="muted">로딩 중…</div>}
        {loadError && <div className="error">{loadError}</div>}

        {!loading && !loadError && rows.length === 0 && (
          <div className="muted">검색 결과가 없습니다.</div>
        )}

        {!loading && !loadError && rows.length > 0 && (
          <>
            <table className="grid">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <th>ID</th>
                  <th>썸네일</th>
                  <th>상품명</th>
                  <th>브랜드</th>
                  <th>가격</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th style={{ width: 160 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`${r.id} 선택`}
                      />
                    </td>
                    <td>{r.id}</td>
                    <td><img src={r.thumbnailUrl} alt={r.name} className="thumb" /></td>
                    <td className="cell-name"><div className="name">{r.name}</div></td>
                    <td>{r.brand}</td>
                    <td>
                      {r.discountPrice != null && r.discountPrice < (r.price ?? 0) ? (
                        <>
                          <span className="strike">{(r.price ?? 0).toLocaleString()}원</span>{" "}
                          <b>{r.discountPrice.toLocaleString()}원</b>
                        </>
                      ) : (
                        <b>{(r.price ?? 0).toLocaleString()}원</b>
                      )}
                    </td>
                    <td>{r.status}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => navigate(`/admin/products/${r.id}/edit`)}>
                          수정
                        </button>
                        <button className="btn small danger" onClick={() => doDelete([r.id])}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            <div className="pager">
              <button className="btn ghost" disabled={page <= 0} onClick={() => setPage(0)}>« 처음</button>
              <button className="btn ghost" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹ 이전</button>

              <div className="pages">
                {pageNums.map((n) => (
                  <button key={n} className={`page ${n === page ? "active" : ""}`} onClick={() => setPage(n)}>
                    {n + 1}
                  </button>
                ))}
              </div>

              <button className="btn ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>다음 ›</button>
              <button className="btn ghost" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>마지막 »</button>
            </div>

            <div className="total">총 {total.toLocaleString()}건</div>
          </>
        )}
      </section>
    </main>
  );
}
