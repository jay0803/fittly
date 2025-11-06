import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../../lib/http";
import "../../css/Qna.css";

export default function AdminQnaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qna, setQna] = useState(null);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    async function fetchQna() {
      try {
        const res = await http.get(`/api/qna/${id}`);
        setQna(res);
        setAnswer(res.answer || "");
      } catch (e) {
        console.error("문의 불러오기 실패:", e);
        alert("문의 내용을 불러올 수 없습니다.");
      }
    }
    fetchQna();
  }, [id]);

  async function handleSubmit() {
    if (!answer.trim()) {
      alert("답변 내용을 입력하세요.");
      return;
    }
    try {
      await http.put(`/api/admin/qna/${id}/answer`, { answer });
      alert("답변이 등록되었습니다.");
      navigate("/admin/qna");
    } catch (e) {
      alert("답변 등록 실패: " + e.message);
    }
  }

  if (!qna) return <div className="qna-wrapper">불러오는 중...</div>;

  const product = qna.product || {};
  const createdAt = qna.createdAt
    ? new Date(qna.createdAt).toLocaleString("ko-KR")
    : "";

  return (
    <div className="qna-write-wrapper admin-qna-detail">
      <h2 className="qna-title">1:1 문의 상세 (관리자)</h2>

      {product && (
        <div className="qna-product-box">
          <img
            src={product.thumbnailUrl || "/images/no-image.png"}
            alt={product.productName || "상품 이미지"}
            className="qna-product-thumb"
          />
          <div className="qna-product-info">
            <div className="product-name">{product.productName}</div>
            <div className="muted">카테고리: {product.categoryName || "없음"}</div>
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

      <div className="qna-body">
        <div className="order">주문번호: {qna.orderUid || "없음"}</div>
        <div className="qna-meta">
          <span>{qna.category} / {qna.subcategory}</span>
          <span> | {createdAt}</span>
        </div>
        <div className="qna-content-box">
          <div className="content">{qna.content}</div>
        </div>
      </div>

      <div className="qna-field">
        <label>답변</label>
        <textarea
          rows={6}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="관리자 답변을 입력하세요."
        />
      </div>

      <div className="qna-actions">
        <button className="btn cancel" onClick={() => navigate("/admin/qna")}>
          목록으로
        </button>
        <button className="btn apply" onClick={handleSubmit}>
          답변 등록
        </button>
      </div>
    </div>
  );
}
