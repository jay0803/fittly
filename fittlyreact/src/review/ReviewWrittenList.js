import React, { useEffect, useState } from "react";
import { http } from "../lib/http";
import "../css/ReviewWrittenList.css";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return (d.getHours() || d.getMinutes())
    ? `${yy}.${mm}.${dd} ${hh}:${mi}`
    : `${yy}.${mm}.${dd}`;
};

const Stars = ({ rating }) => (
  <span className="review-stars">
    {"★".repeat(Math.max(0, Math.min(5, rating)))}{" "}
    {"☆".repeat(Math.max(0, 5 - rating))}
  </span>
);

export default function ReviewWrittenList() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await http.get("/api/reviews/me");
        console.log("📦 작성한 후기 목록:", res);
        setList(res || []);
      } catch (err) {
        console.error("❌ 작성한 후기 불러오기 실패:", err);
        setList([]);
      }
    };
    load();
  }, []);

  if (!list.length)
    return <div className="myreview-empty">작성한 후기가 없습니다.</div>;

  return (
    <div className="review-written-list">
      {list.map((r) => (
        <div key={r.id || r.rid} className="written-review-item">
          <div className="review-rating">
            <div className="rating-row">
              <Stars rating={r.rating} />
              <span className="review-score">{r.rating}</span>
              <span
                className="review-date"
                style={{
                  marginLeft: "8px",
                  color: "#777",
                  fontSize: "14px",
                }}
              >
                {formatDate(r.createdAt)}
              </span>
            </div>
          </div>

          {(r.productBrand || r.productName) && (
            <div className="review-extra">
              <span className="review-option">
                <span className="label">상품정보</span>
                <b>
                  {r.productBrand ? `${r.productBrand}` : ""}
                  {r.productBrand && r.productName ? " / " : ""}
                  {r.productName ? `${r.productName}` : ""}
                </b>
              </span>
            </div>
          )}

          {r.sex && (
            <div className="review-extra">
              <span className="review-option">
                <span className="label">체형정보</span>
                <b>
                  {r.sex === "M" ? "남성" : "여성"}
                  {r.height ? ` · ${r.height}cm` : ""}
                  {r.weight ? ` · ${r.weight}kg` : ""}
                </b>
              </span>
            </div>
          )}

          {(r.colorName || r.color || r.size) && (
            <div className="review-extra">
              <span className="review-option">
                <span className="label">구매옵션</span>
                <b>
                  {r.colorName
                    ? r.colorName
                    : r.color
                    ? r.color.startsWith("#")
                      ? ""
                      : r.color
                    : ""}
                  {r.colorName || r.color
                    ? r.size
                      ? ` / ${r.size}`
                      : ""
                    : r.size || ""}
                </b>
              </span>
            </div>
          )}

          {Array.isArray(r.images) && r.images.length > 0 && (
            <div className="review-image-row" style={{ marginTop: "10px" }}>
              {r.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  aria-hidden="true"
                  style={{
                    maxWidth: "160px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    marginRight: "10px",
                    cursor: "default",
                  }}
                />
              ))}
            </div>
          )}

          <div className="review-comment">{r.content}</div>
        </div>
      ))}
    </div>
  );
}
