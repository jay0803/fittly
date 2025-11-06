import React from "react";

const norm = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const fmtKRW = (n) => {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  try {
    return new Intl.NumberFormat("ko-KR").format(num) + "원";
  } catch {
    return num.toLocaleString() + "원";
  }
};

const toBool = (v) => v === true || v === "true";
const num = (v) => (v == null ? NaN : Number(v));
const pickStock = (item) => {
  const candidates = [
    item?.stock,
    item?.variantStock,
    item?.sizeStock,
    item?.inventory,
  ].map(num).filter((v) => Number.isFinite(v));
  return candidates.length ? candidates[0] : undefined;
};

export default function WishlistItemRow({
  item,
  checked,
  onToggle,
  onRemove,
  onAddToCart,
}) {
  const colorName = norm(item?.colorName);
  const colorCode = norm(item?.color);
  const size = norm(item?.size);
  const hasColor = !!(colorName || colorCode);
  const hasSize = !!size;
  const colorText =
    colorName && colorCode ? `${colorName} (${colorCode})` : (colorName || colorCode || "");

  const price = item?.price ?? 0;
  const stockVal = pickStock(item);
  const soldOut = (Number.isFinite(stockVal) && stockVal <= 0) || toBool(item?.isSoldOut);

  return (
    <div className="cart-item">
      <div className="cart-item-check">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          aria-label="위시 선택"
        />
      </div>

      <img
        src={norm(item?.thumbnailUrl) || "/images/no-image.png"}
        alt={norm(item?.productName) || "상품 이미지"}
        className="cart-item-image"
        onError={(e) => {
          e.currentTarget.src = "/images/no-image.png";
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="cart-item-details">
        <div className="cart-item-name">
          {norm(item?.productName) || "이름 없는 상품"}
        </div>

        {(hasColor || hasSize) && (
          <div
            className="option-line"
            style={{ marginTop: 6, fontSize: 13, color: "#666" }}
          >
            {hasColor && (
              <span className="opt-pill" title={`색상: ${colorText}`}>
                색상: {colorText}
              </span>
            )}
            {hasSize && (
              <span className="opt-pill" title={`사이즈: ${size}`}>
                사이즈: {size}
              </span>
            )}
          </div>
        )}

        <div
          className="cart-item-price"
          style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}
        >
          <span>{fmtKRW(price)}</span>
          {soldOut && (
            <span
              style={{
                color: "#d33",
                fontSize: 12,
                fontWeight: 700,
                border: "1px solid #f0c",
                padding: "2px 6px",
                borderRadius: 10,
              }}
              title="현재 옵션 조합은 품절입니다"
            >
              품절
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <button
          type="button"
          className="btn-ghost"
          onClick={onAddToCart}
          title="장바구니 담기"
          aria-label="장바구니 담기"
          disabled={soldOut}
        >
          장바<br />구니
        </button>
        <button
          type="button"
          className="cart-item-remove"
          onClick={onRemove}
          title="삭제"
          aria-label="삭제"
        >
          ×
        </button>
      </div>
    </div>
  );
}
