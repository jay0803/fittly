import React, { useEffect, useState } from "react";
import { http } from "../../lib/http";
import "../../css/Qna.css";

export default function AdminReviewList() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const data = await http.get("/api/admin/reviews");
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("리뷰 목록 불러오기 실패:", e);
      setReviews([]);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 이 리뷰를 삭제하시겠습니까?")) return;
    try {
      await http.delete(`/api/admin/reviews/${id}`);
      alert("리뷰가 삭제되었습니다.");
      fetchReviews();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  }

  return (
    <div className="admin-qna-container">
      <div className="qna-wrapper">
        <h2 className="qna-title">리뷰 관리</h2>

        {reviews.length === 0 ? (
          <div className="qna-empty">등록된 리뷰가 없습니다.</div>
        ) : (
          <ul className="qna-list">
            {reviews.map((r) => (
              <li key={r.id} className="qna-item">
                <div className="qna-head">
                  <div className="qna-head-left">
                    <span className="qna-icon">R</span>
                    <span className="qna-status done">⭐ {r.rating}점</span>
                  </div>
                  <div className="qna-actions">
                    <button
                      className="danger"
                      onClick={() => handleDelete(r.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="qna-body">
                  <div className="order">
                    <strong>작성자:</strong> {r.userName} ({r.userId})
                  </div>
                  <div className="order">
                    <strong>브랜드:</strong> {r.brand || "-"}
                  </div>
                  <div className="order">
                    <strong>상품명:</strong> {r.productName}
                  </div>
                  {r.imageUrls?.length > 0 && (
                    <div className="review-image-row">
                      {r.imageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`리뷰이미지-${idx}`}
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="content">{r.content || "내용 없음"}</div>
                  <div className="qna-date">
                    {new Date(r.createdAt).toLocaleString()}
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
