import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ProductCard.css";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export default function ProductCard({ item }) {
  const navigate = useNavigate();
  const goDetail = () => {
    if (item?.id) navigate(`/products/${item.id}`);
  };
  const price = Number(item?.price) || 0;
  const discountPrice = Number(item?.discountPrice ?? item?.salePrice ?? price);
  const hasDiscount = discountPrice < price;
  const discountPercent = hasDiscount
    ? clamp(Math.round((1 - discountPrice / price) * 100), 0, 100)
    : null;

  return (
    <div className="pcard" onClick={goDetail} role="button" tabIndex={0}>
      <div className="pcard-thumb">
        <img
          src={item.thumbnailUrl || item.image || "/images/placeholder.png"}
          alt={item.name}
        />
      </div>
      <div className="pcard-body">
        <div className="pcard-brand">{item.brand}</div>
        <div className="pcard-name">{item.name}</div>
        <div className="pcard-price-row">
          {hasDiscount && (
            <span className="pcard-discount">{discountPercent}%</span>
          )}
          <span className="pcard-price">{fmtKRW(discountPrice)}</span>
          {hasDiscount && <span className="pcard-origin">{fmtKRW(price)}</span>}
        </div>
      </div>
    </div>
  );
}
