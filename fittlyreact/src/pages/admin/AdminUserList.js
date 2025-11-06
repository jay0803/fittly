import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/AdminUserList.css";
import { http } from "../../lib/http";

export default function AdminUserList() {
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("createdAt");
  const [dir, setDir] = useState("DESC");
  const [field, setField] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const size = 10;
  const isAllowedField = field === "name" || field === "phone";
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size, sort, dir };

      if (isAllowedField && keyword.trim() !== "") {
        params.field = field;
        params.keyword = field === "phone" ? keyword.replace(/\D/g, "") : keyword.trim();
      }

      const res = await http.get("/admin/users", { params });
      setData(res);
    } catch (e) {
      if (e.response?.status === 401) {
        alert("세션이 만료되었거나 인증이 필요합니다. 다시 로그인해주세요.");
        nav("/login/admin", { replace: true });
        return;
      }
      console.error(e);
      alert("회원목록 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [page, size, sort, dir, field, keyword, isAllowedField, nav]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchList();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch(e);
    }
  };

  return (
    <div className="adminlist-wrap">
      <div className="list-header">
        <h2>회원 목록</h2>
      </div>

      <form onSubmit={onSearch} className="search-bar">
        <select
          value={field}
          onChange={(e) => {
            setField(e.target.value);
            setPage(0);
          }}
        >
          <option value="name">이름</option>
          <option value="phone">전화번호</option>
        </select>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={field === "name" ? "이름 입력" : "전화번호 입력"}
        />

        <label className="sort-label">
          <span>정렬</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
          >
            <option value="createdAt">가입일</option>
            <option value="name">이름</option>
            <option value="loginId">아이디</option>
            <option value="email">이메일</option>
          </select>
        </label>
        <select
          value={dir}
          onChange={(e) => {
            setDir(e.target.value);
            setPage(0);
          }}
        >
          <option value="DESC">내림차순</option>
          <option value="ASC">오름차순</option>
        </select>

        <button type="submit">검색</button>
      </form>

      {loading ? (
        <div>로딩중…</div>
      ) : (
        <>
          <table className="user-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>아이디</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((u, idx) => (
                <tr key={u.id}>
                  <td className="num">{page * size + idx + 1}</td>
                  <td className="name">{u.name}</td>
                  <td>{u.loginId}</td>
                  <td className="email">{u.email}</td>
                  <td className="phone">{u.phone}</td>
                  <td className="date">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
              {data.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-data">데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pager">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              이전
            </button>
            <span>{data.number + 1} / {data.totalPages || 1}</span>
            <button
              onClick={() => setPage((p) => (p + 1 < data.totalPages ? p + 1 : p))}
              disabled={data.number + 1 >= data.totalPages}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
