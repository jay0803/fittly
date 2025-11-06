import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../lib/http";
import "../css/Qna.css";

export default function QnaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qna, setQna] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get(`/api/qna/${id}`)
      .then(setQna)
      .catch((err) => {
        console.error("문의 조회 실패:", err);
        setError("문의글을 불러올 수 없습니다.");
      });
  }, [id]);

  if (error) return <div className="qna-empty">{error}</div>;
  if (!qna) return <div className="qna-empty">불러오는 중...</div>;

  const fmtDate = (d) =>
    new Date(d).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const product = qna.product || {};

  return (
    <div className="qna-detail-wrapper">
      <h2 className="qna-title">1:1 문의 상세</h2>

      {product?.thumbnailUrl && (
        <div className="qna-product-box">
          <img
            src={product.thumbnailUrl}
            alt={product?.productName || "상품 이미지"}
            className="qna-product-thumb"
          />
          <div className="qna-product-info">
            <div className="product-name">
              {product?.productName || "상품 정보 없음"}
            </div>
            <div className="muted">
              카테고리: {product?.categoryName || "없음"}
            </div>
          </div>
        </div>
      )}

      {qna.imageUrl && (
        <div className="qna-user-image">
          <img
            src={qna.imageUrl}
            alt="작성자 첨부 이미지"
            className="qna-user-upload"
          />
        </div>
      )}

      <div className="qna-head">
        <div>
          <span
            className={`qna-status ${
              qna.status === "ANSWERED" ? "done" : "wait"
            }`}
          >
            {qna.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
          </span>
          {qna.secret && <span className="qna-lock">🔒</span>}
        </div>
        <div className="qna-date">{fmtDate(qna.createdAt)}</div>
      </div>

      <div className="qna-body">
        <div className="qna-field">
          <strong>주문번호:</strong> {qna.orderUid || "없음"}
        </div>

        <div className="qna-field">
          <strong>제목:</strong> {qna.title}
        </div>

        <div className="qna-field">
          <strong>내용:</strong>
          {qna.secret && !qna.owner && !qna.admin ? (
            <div className="secret-msg">🔒 비밀글입니다.</div>
          ) : (
            <div>{qna.content}</div>
          )}
        </div>

        {qna.answer && (
          <div className="qna-answer">
            <span className="label">관리자 답변</span>
            {qna.answer}
          </div>
        )}
      </div>

      <div className="qna-actions">
        <button className="btn cancel" onClick={() => navigate("/my")}>
          목록으로
        </button>
      </div>
    </div>
  );
}
