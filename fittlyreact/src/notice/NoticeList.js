import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/notice.css";
import { getAuth } from "../lib/jwt";
import { http } from "../lib/http";

export default function NoticeList() {
  const [pinned, setPinned] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("TITLE");

  const { role } = getAuth();

  useEffect(() => {
    http.get("/notices/pinned").then(setPinned).catch((err) => {
      console.error(err);
      alert("고정 공지 불러오기 실패");
    });
  }, []);

  useEffect(() => {
    http.get(
      `/notices?type=${type}&q=${encodeURIComponent(q)}&page=${page}&size=10`
    ).then((p) => {
      setItems(Array.isArray(p.content) ? p.content : []);
      setTotalPages(p.totalPages ?? 0);
    }).catch((err) => {
      console.error(err);
      alert("공지 목록 불러오기 실패");
    });
  }, [type, q, page]);

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/NoticeBanner.png" alt="공지사항 배너" />
      </div>
      <div className="notice-search-bar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="TITLE">제목</option>
          <option value="TITLE_CONTENT">제목+내용</option>
        </select>
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={q}
          onChange={(e) => {
            setPage(0);
            setQ(e.target.value);
          }}
        />
        <button onClick={() => setPage(0)}>검색</button>
        {role === "ROLE_ADMIN" && (
          <Link to="/notice/write" className="notice-write-btn">
            공지 등록
          </Link>
        )}
      </div>
      <table className="notice-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>등록일</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          {pinned.map((n) => (
            <tr key={`p-${n.id}`} className="pinned">
              <td>공지</td>
              <td>
                <Link to={`/notice/${n.id}`}>{n.title}</Link>
              </td>
              <td>{new Date(n.createdAt).toLocaleDateString()}</td>
              <td>{n.views}</td>
            </tr>
          ))}
          {items.map((n, idx) => (
            <tr key={n.id}>
              <td>{idx + 1 + page * 10}</td>
              <td>
                <Link to={`/notice/${n.id}`}>{n.title}</Link>
              </td>
              <td>{new Date(n.createdAt).toLocaleDateString()}</td>
              <td>{n.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="notice-pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          이전
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={page === i ? "active" : ""}
            onClick={() => setPage(i)}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
