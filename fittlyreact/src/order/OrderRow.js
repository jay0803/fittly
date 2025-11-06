import React from "react";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";

export default function OrderRow({ order, onViewDetail, onWriteReview }) {
  const id = order.orderId ?? order.id;
  const orderUid = order.orderUid ?? order.uid;

  const items =
    order.items || order.orderItems || order.products || [];
  const main = items[0] || {};
  const title =
    order.__displayTitle ||
    main.name ||
    main.productName ||
    main.product?.name ||
    "주문 상품";

  const img =
    main.thumbnailUrl ||
    main.imageUrl ||
    main.product?.thumbnailUrl ||
    main.product?.imageUrl ||
    null;

  const colorName =
    main.colorName ||
    main.variantColorName ||
    main.productVariant?.colorName ||
    main.product?.colorName ||
    null;

  const color =
    main.color ||
    main.variantColor ||
    main.productVariant?.color ||
    main.product?.color ||
    null;

  const size =
    main.size ||
    main.variantSize ||
    main.productVariant?.size ||
    main.product?.size ||
    null;

  const amount = order.__displayAmount ?? 0;
  const itemCount = Array.isArray(items) ? items.length : 1;

  return (
    <div
      className="order-row"
      data-id={id}
      style={{
        background: "#fff",
        border: "1px solid #e6e9f0",
        borderRadius: 14,
        boxShadow: "0 6px 18px rgba(17,24,39,.06)",
        padding: "14px 12px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 12,
        }}
      >
        {img && (
          <img
            src={img}
            alt={title}
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              objectFit: "cover",
              background: "#f8f8f8",
            }}
          />
        )}

        <div>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>{title}</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            주문번호: {orderUid ?? `FITTLy-${id}`}
          </div>
          {size && (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              상품 사이즈: {size}
            </div>
          )}
          {(colorName || color) && (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              색상: {colorName || color}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900 }}>{fmtKRW(amount)}</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            총 {itemCount}개 품목
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 6,
            }}
          >
            <div className="order-actions">
              <button type="button" className="ord-btn" onClick={onViewDetail}>
                상세보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
