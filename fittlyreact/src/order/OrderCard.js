import React from "react";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const norm = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

export default function OrderCard({ order, onViewDetail, onEditAddress, onContactAdmin }) {
  const id         = order.orderId ?? order.id;
  const orderUid   = order.orderUid ?? order.uid;
  const createdAt  = order.createdAt ?? order.orderDate;
  const status     = order.status;
  const amount     = Number(order.amount ?? order.totalAmount ?? 0);
  const items      = Array.isArray(order.items) ? order.items : [];
  const first = items[0] || {};
  const firstName  = first.productName ?? "-";
  const firstThumb = first.thumbnailUrl ?? first.productThumbnail ?? "/images/no-image.png";
  const colorName  = norm(first.colorName);
  const colorCode  = norm(first.color);
  const size       = norm(first.size);

  const colorText =
    colorName && colorCode ? `${colorName} (${colorCode})`
    : (colorName || colorCode || null);

  const itemCountText = `총 ${items.length}개 품목`;

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="left">
          <div className="order-id">주문번호: {orderUid || id}</div>
          <div className="order-date">
            {createdAt ? new Date(createdAt).toLocaleString() : "-"}
          </div>
        </div>
        <div className="right">
          <span className={`status-badge status-${String(status).toLowerCase()}`}>{status}</span>
        </div>
      </div>

      <div className="order-card-body">
        <img
          className="order-thumb"
          src={firstThumb}
          onError={(e) => (e.currentTarget.src = "/images/no-image.png")}
          alt="thumb"
        />
        <div className="order-summary">
          <div className="name">{firstName}</div>

          {(colorText || size) && (
            <div className="option-line" style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
              {colorText && <span className="opt-pill">색상: {colorText}</span>}
              {size && <span className="opt-pill" style={{ marginLeft: 6 }}>사이즈: {size}</span>}
            </div>
          )}

          <div className="count" style={{ marginTop: 6 }}>{itemCountText}</div>
          <div className="amount" style={{ marginTop: 4 }}>{fmtKRW(amount)}</div>
        </div>
      </div>

      <div className="order-card-actions">
        <button className="btn-ghost" onClick={() => onViewDetail?.(order)}>상세보기</button>
        <button className="btn-ghost" onClick={() => onEditAddress?.(order)}>배송지 수정</button>
        <button className="btn-ghost" onClick={() => onContactAdmin?.(order)}>문의</button>
      </div>
    </div>
  );
}
