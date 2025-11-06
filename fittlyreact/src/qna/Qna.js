import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../lib/http";
import { getAuth } from "../lib/jwt";
import "../css/Qna.css";

const UI2API = {
  "전체 시기": "all",
  "1주일": "1w",
  "1개월": "1m",
  "3개월": "3m",
};

export default function QnA() {
  const [qnaList, setQnaList] = useState([]);
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);
  const [period, setPeriod] = useState("전체 시기");
  const [tempPeriod, setTempPeriod] = useState("전체 시기");
  const navigate = useNavigate();

  const auth = getAuth();
  const currentLoginId = auth?.loginId;
  const isAdmin = auth?.role === "ROLE_ADMIN" || auth?.role === "ADMIN";

  useEffect(() => { fetchQna(); }, [period]);

  async function fetchQna() {
    try {
      const data = await http.get("/api/qna/my", { params: { period: UI2API[period] } });
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];
      setQnaList(rows);
    } catch (e) {
      console.error("QnA 불러오기 실패:", e);
      setQnaList([]);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await http.delete(`/api/qna/${id}`);
      setQnaList((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  }

  function handleEdit(id) {
    navigate(`/qna/write/${id}`);
  }

  function handleDetail(id) {
    navigate(`/qna/${id}`);
  }

  return (
    <div className="qna-wrapper">
      <h2 className="qna-title">1:1 문의내역</h2>

      <div className="qna-filters">
        <button
          className={showPeriodFilter ? "active" : ""}
          onClick={() => setShowPeriodFilter(true)}
        >
          전체 보기
        </button>
      </div>

      {showPeriodFilter && (
        <div className="period-filter">
          <div className="period-options">
            {["전체 시기", "1주일", "1개월", "3개월"].map((opt) => (
              <button
                key={opt}
                className={`period-btn ${tempPeriod === opt ? "active" : ""}`}
                onClick={() => setTempPeriod(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="period-actions">
            <button
              className="cancel"
              onClick={() => {
                setTempPeriod(period);
                setShowPeriodFilter(false);
              }}
            >
              취소
            </button>
            <button
              className="apply"
              onClick={() => {
                setPeriod(tempPeriod);
                setShowPeriodFilter(false);
              }}
            >
              적용하기
            </button>
          </div>
        </div>
      )}

      {qnaList.length === 0 ? (
        <div className="qna-empty">문의하신 내역이 없습니다.</div>
      ) : (
        <ul className="qna-list">
          {qnaList.map((q) => (
            <li
              key={q.id}
              className="qna-item"
              onClick={() => handleDetail(q.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="qna-head">
                <div className="qna-head-left">
                  <span className="qna-icon">Q</span>
                  <span
                    className={`qna-status ${
                      q.status === "ANSWERED" ? "done" : "wait"
                    }`}
                  >
                    {q.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                  </span>
                  {q.secret && <span className="qna-lock" title="비밀글">🔒</span>}
                </div>
                <div className="qna-actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEdit(q.id)}>수정</button>
                  <button className="danger" onClick={() => handleDelete(q.id)}>
                    삭제
                  </button>
                </div>
              </div>

              <div className="qna-body">
                <div className="order">No. {q.orderUid || "주문번호 없음"}</div>
                {q.secret && !(isAdmin || q.userLoginId === currentLoginId) ? (
                  <div className="content secret-msg">🔒 비밀글입니다.</div>
                ) : (
                  <div className="content">{q.content}</div>
                )}

                <div className="qna-date">
                  {new Date(q.createdAt).toLocaleString()}
                </div>
              </div>

              {q.answer &&
                (!q.secret || isAdmin || q.userLoginId === currentLoginId) && (
                  <div className="qna-answer">
                    <span className="label">관리자 답변</span>
                    {q.answer}
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}

      <div className="qna-footer">
        <button className="qna-btn" onClick={() => navigate("/qna/write")}>
          1:1문의하기
        </button>
      </div>
    </div>
  );
}
