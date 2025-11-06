import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../lib/http";
import "../../css/Qna.css";

export default function AdminQnaList() {
  const [qnaList, setQnaList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchQnaList(); }, []);

  async function fetchQnaList() {
    try {
      const data = await http.get("/api/admin/qna");
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.content) ? data.content : [];
      setQnaList(rows);
    } catch (e) {
      console.error("관리자 QnA 목록 불러오기 실패:", e);
      setQnaList([]);
    }
  }

  return (
  <div className="admin-qna-container">
    <div className="qna-wrapper">
      <h2 className="qna-title">1:1 문의 관리</h2>
      {qnaList.length === 0 ? (
        <div className="qna-empty">등록된 문의가 없습니다.</div>
      ) : (
        <ul className="qna-list">
          {qnaList.map((q) => (
            <li key={q.id} className="qna-item">
              <div className="qna-head">
                <div className="qna-head-left">
                  <span className="qna-icon">Q</span>
                  <span className={`qna-status ${q.answer ? "done" : "wait"}`}>
                    {q.answer ? "답변 완료" : "답변 대기"}
                  </span>
                </div>
                <div className="qna-actions">
                  <button onClick={() => navigate(`/admin/qna/${q.id}`)}>
                    상세/답변
                  </button>
                </div>
              </div>
              <div className="qna-body">
                <div className="order">No. {q.orderUid || "주문번호 없음"}</div>
                <div className="content">{q.content}</div>
                <div className="qna-date">
                  {new Date(q.createdAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
}
