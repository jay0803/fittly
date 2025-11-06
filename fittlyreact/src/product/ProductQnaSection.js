import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../lib/http";
import { getAuth } from "../lib/jwt";
import "../css/Qna.css";

export default function ProductQnaSection({ productId }) {
  const navigate = useNavigate();
  const [qnaList, setQnaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { loginId, role } = getAuth();
  const isAdmin = role === "ROLE_ADMIN" || role === "ADMIN";

  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    http
      .get(`/api/products/${productId}/qna`)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.content || [];
        setQnaList(list);
      })
      .catch((e) => {
        console.error("상품 문의 조회 실패:", e);
        setError("상품 문의를 불러올 수 없습니다.");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="qna-empty">불러오는 중...</div>;
  if (error) return <div className="qna-empty">{error}</div>;

  if (!qnaList.length)
    return (
      <div className="qna-empty">
        아직 문의가 없습니다.{" "}
        <button
          className="btn small"
          onClick={() => navigate(`/qna/write`)}
        >
          상품 문의하기
        </button>
      </div>
    );

  return (
    <div className="qna-wrapper" style={{ marginTop: 20 }}>
      <div className="qna-head-row">
        <h3>상품 Q&amp;A</h3>
        <button
          className="btn small"
          onClick={() => navigate(`/qna/write`)}
        >
          문의하기
        </button>
      </div>

      <ul className="qna-list">
        {qnaList.map((q) => {
          const isOwner = q.userLoginId === loginId;
          const canView = !q.secret || isOwner || isAdmin;

          return (
            <li key={q.id} className="qna-item qna-flex">
              <div className="qna-main">
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
                    {q.secret && <span className="qna-lock">🔒</span>}
                  </div>
                </div>

                <div className="qna-body">
                  <div className="qna-title">{q.title}</div>
                  {canView ? (
                    <div className="content">{q.content}</div>
                  ) : (
                    <div className="content secret-msg">🔒 비밀글입니다.</div>
                  )}
                  <div className="qna-date">
                    {new Date(q.createdAt).toLocaleString()}
                  </div>
                </div>

                {q.answer && canView && (
                  <div className="qna-answer">
                    <span className="label">관리자 답변</span>
                    {q.answer}
                  </div>
                )}
              </div>

              {q.imageUrl && (
                <div className="qna-thumbnail">
                  <img
                    src={q.imageUrl}
                    alt="첨부 이미지"
                    className="qna-thumb-img"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
