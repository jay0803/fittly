import React, { useEffect, useState } from "react";
import { http } from "../lib/http";
import "../css/MyReviewPage.css";

export default function ReviewWriteableList({ onWriteReview }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await http.get("/api/reviews/available");
        setList(res || []);
      } catch (err) {
        console.error("❌ 작성 가능한 후기 불러오기 실패:", err);
        setList([]);
      }
    };
    load();
  }, []);

  if (!list.length)
    return <div className="myreview-empty">작성 가능한 리뷰가 없습니다.</div>;

  return (
    <div className="review-writeable-list">
      {list.map((item) => (
        <div key={item.orderItemId} className="review-card">

          <img
            src={item.thumbnailUrl || "/images/no-image.png"}
            alt={item.productName || "상품 이미지"}
            className="review-thumb"
          />

          <div className="review-info">
            <div className="review-name">{item.productName}</div>
            <div className="review-meta">브랜드: {item.brand || "-"}</div>
            <div className="review-size">사이즈: {item.size || "-"}</div>
            <div className="review-color">색상: {item.color || "-"}</div>
            <div className="review-date">주문일: {item.orderDate}</div>
          </div>

          <button
            className="write-btn"
            onClick={() => onWriteReview?.(item)}
          >
            리뷰 작성
          </button>
        </div>
      ))}
    </div>
  );
}
