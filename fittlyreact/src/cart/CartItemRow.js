import React from "react";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const norm = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const resolveColorName = (it) =>
  norm(
    it?.colorName ??
    it?.optColorName ??
    it?.variantColorName ??
    it?.productColorName ??
    it?.product?.colorName
  );

const resolveColorCode = (it) =>
  norm(
    it?.color ??
    it?.optColor ??
    it?.variantColor ??
    it?.productColor ??
    it?.product?.color
  );

export default function CartItemRow({
  item,
  checked,
  onToggle,
  onQuantityChange,
  onRemove,
}) {

  const stock =
    Number.isFinite(Number(item?._stock))
      ? Number(item._stock)
      : Number.isFinite(Number(item?.availableStock))
        ? Number(item.availableStock)
        : Number.isFinite(Number(item?.stock))
          ? Number(item.stock)
          : undefined;

  const qty = Number(item?.quantity ?? 1);
  const soldOut =
    (Number.isFinite(stock) && stock <= 0) ||
    item?.isSoldOut === true ||
    item?.isSoldOut === "true";

  const colorName = resolveColorName(item);
  const colorCode = resolveColorCode(item);
  const colorText =
    colorName && colorCode ? `${colorName} (${colorCode})` : (colorName || colorCode || "");

  const dec = () => {
    if (soldOut) return;
    onQuantityChange(item.cartItemId, Math.max(1, qty - 1));
  };
  const inc = () => {
    if (soldOut) return;
    const next = qty + 1;
    const capped = Number.isFinite(stock) ? Math.min(next, Math.max(1, stock)) : next;
    onQuantityChange(item.cartItemId, capped);
  };
  const set = (v) => {
    if (soldOut) return;
    onQuantityChange(item.cartItemId, v);
  };

  return (
    <div className={`cart-item ${soldOut ? "soldout" : ""}`}>
      <div className="cart-item-check">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          disabled={soldOut}
          title={soldOut ? "품절 상품은 선택할 수 없습니다." : "선택"}
        />
      </div>

      <img
        src={item.thumbnailUrl || "/images/no-image.png"}
        alt={item.productName}
        className="cart-item-image"
        onError={(e) => (e.currentTarget.src = "/images/no-image.png")}
      />

      <div className="cart-item-details">
        <div className="cart-item-name">{item.productName}</div>

        {(colorText || item.size) && (
          <div className="option-line" style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
            {colorText && <span className="opt-pill">색상: {colorText}</span>}
            {item.size && <span className="opt-pill">사이즈: {item.size}</span>}
          </div>
        )}

        <div className="cart-item-price" style={{ marginTop: 6 }}>
          {fmtKRW(item.price)}
        </div>

        {soldOut && (
          <div className="soldout-badge" style={{ marginTop: 6, color: "#c00", fontWeight: 600 }}>
            품절
          </div>
        )}
      </div>

      <div className="cart-item-quantity">
        <button onClick={dec} disabled={soldOut || qty <= 1} aria-label="수량 감소">-</button>
        <input
          type="number"
          min={1}
          max={Number.isFinite(stock) ? Math.max(1, stock) : undefined}
          value={qty}
          onChange={(e) => set(e.target.value)}
          disabled={soldOut}
        />
        <button
          onClick={inc}
          disabled={soldOut || (Number.isFinite(stock) && qty >= stock)}
          aria-label="수량 증가"
        >
          +
        </button>
      </div>

      <div className="cart-item-total">{fmtKRW((item.price || 0) * qty)}</div>
      <button className="cart-item-remove" onClick={onRemove} title="삭제" aria-label="삭제">
        ×
      </button>
    </div>
  );
}
