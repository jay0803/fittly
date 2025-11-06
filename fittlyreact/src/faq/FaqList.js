import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/notice.css";
import { getAuth } from "../lib/jwt";
import { http } from "../lib/http";

export default function FaqList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const { role } = getAuth();

  useEffect(() => {
    http.get(`/faqs?category=${category}&q=${encodeURIComponent(q)}&page=${page}&size=10`)
      .then((p) => {
        setItems(Array.isArray(p.content) ? p.content : []);
        setTotalPages(p.totalPages ?? 0);
      })
      .catch((err) => {
        console.error(err);
        alert("FAQ 목록을 불러오지 못했습니다.");
      });
  }, [category, q, page]);

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/FAQBanner.png" alt="FAQ 배너"
             onError={(e)=>{ e.currentTarget.src="/images/no-image.png"; }} />
      </div>

      <div className="notice-search-bar">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">전체</option>
          <option value="MEMBER">회원</option>
          <option value="ORDER">주문/배송</option>
          <option value="PAYMENT">결제</option>
          <option value="PRODUCT">상품</option>
          <option value="ETC">기타</option>
        </select>
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={q}
          onChange={(e) => { setPage(0); setQ(e.target.value); }}
        />
        <button onClick={() => setPage(0)}>검색</button>

        {role === "ROLE_ADMIN" && (
          <Link to="/faq/write" className="notice-write-btn">FAQ 등록</Link>
        )}
      </div>

      <table className="faq-table">
        <thead>
          <tr><th>번호</th><th>카테고리</th><th>제목</th><th>등록일</th></tr>
        </thead>
        <tbody>
          {(items || []).map((f, idx) => (
            <tr key={f.id}>
              <td>{idx + 1 + page * 10}</td>
              <td>{f.category}</td>
              <td><Link to={`/faq/${f.id}`}>{f.title}</Link></td>
              <td>{new Date(f.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="notice-pagination">
        <button disabled={page===0} onClick={() => setPage((p) => p - 1)}>이전</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={page===i ? "active" : ""} onClick={() => setPage(i)}>{i+1}</button>
        ))}
        <button disabled={page+1>=totalPages} onClick={() => setPage((p) => p + 1)}>다음</button>
      </div>
    </div>
  );
}
