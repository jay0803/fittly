import React, { useMemo } from "react";
import { useCart } from "./CartContext";
import CartItemRow from "./CartItemRow";
import "../css/CartPage.css";
import { useNavigate } from "react-router-dom";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const toNum = (v) => (v == null ? NaN : Number(v));
const firstFinite = (...vals) => {
  for (const v of vals) {
    const n = toNum(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const resolveUnitPrice = (x) =>
  firstFinite(
    x?.finalPrice,
    x?.unitPrice,
    x?.discountPrice,
    x?.productDiscountPrice,
    x?.product?.discountPrice,
    x?.price,
    x?.product?.price
  ) ?? 0;

const resolveStock = (x) =>
  firstFinite(
    x?.availableStock,
    x?.stock,
    x?.variantStock,
    x?.sizeStock,
    x?.inventory,
    x?.productStock,
    x?.remainingQuantity,
    x?.maxQuantity
  );

const isSoldOut = (x) => {
  const s = resolveStock(x);
  const flag = x?.isSoldOut === true || x?.isSoldOut === "true";
  return (Number.isFinite(s) && s <= 0) || flag;
};

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    selectedIds,
    toggleSelectItem,
    clearSelection,
    updateItemQuantity,
    removeItemFromCart,
    removeSelectedItems,
  } = useCart();

  const items = useMemo(
    () =>
      Array.isArray(cartItems)
        ? cartItems
          .map((x) => ({
            ...x,
            cartItemId: x.cartItemId,
            productId: Number(x?.productId ?? x?.id ?? NaN),
            productName: x?.productName ?? x?.name ?? "",
            thumbnailUrl: x?.thumbnailUrl ?? x?.image ?? null,
            color: x?.color ?? null,
            colorName: x?.colorName ?? null,
            size: x?.size ?? null,
            price: resolveUnitPrice(x),
            quantity: Number(x?.quantity ?? 1),
            _stock: resolveStock(x),
            _soldOut: isSoldOut(x),
          }))
          .filter((it) => Number.isFinite(it.productId))
        : [],
    [cartItems]
  );

  const allCheckableIds = useMemo(
    () => items.filter((it) => !it._soldOut).map((it) => it.cartItemId),
    [items]
  );
  const allChecked =
    allCheckableIds.length > 0 &&
    allCheckableIds.every((id) => selectedIds.has(id));

  const handleMasterToggle = (checked) => {
    if (checked) {
      clearSelection();
      allCheckableIds.forEach((id) => toggleSelectItem(id));
    } else {
      clearSelection();
    }
  };

  const totalSelected = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (it._soldOut || !selectedIds.has(it.cartItemId)) return sum;
        return sum + (Number(it.price) || 0) * (Number(it.quantity) || 1);
      }, 0),
    [items, selectedIds]
  );

  const totalAll = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (it._soldOut) return sum;
        return sum + (Number(it.price) || 0) * (Number(it.quantity) || 1);
      }, 0),
    [items]
  );

  const clampQty = (q, stock) => {
    const base = Math.max(1, Number(q) || 1);
    if (Number.isFinite(stock)) return Math.min(base, Math.max(1, stock));
    return base;
  };

  const onQuantityChange = (cartItemId, next, stock) => {
    updateItemQuantity(cartItemId, clampQty(next, stock));
  };

  const onRemove = async (cartItemId) => {
    try {
      await removeItemFromCart(cartItemId);
    } catch (e) {
      console.error("removeItemFromCart 실패:", e);
      alert("상품 삭제 중 오류가 발생했습니다.");
    }
  };

  const onRemoveSelected = async () => {
    const selectable = [...selectedIds].filter((id) =>
      allCheckableIds.includes(id)
    );
    if (selectable.length === 0) return;
    if (!window.confirm("선택한 상품을 삭제할까요?")) return;
    try {
      await removeSelectedItems();
    } catch (e) {
      console.error("선택 삭제 실패:", e);
      alert("선택 삭제 중 오류가 발생했습니다.");
    }
  };

  const onCheckout = () => {
    const orderItems = items
      .filter((it) => !it._soldOut && selectedIds.has(it.cartItemId))
      .map((it) => ({
        cartItemId: it.cartItemId,
        productId: it.productId,
        productName: it.productName,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        color: it.color ?? null,
        colorName: it.colorName ?? null,
        size: it.size ?? null,
        thumbnailUrl: it.thumbnailUrl ?? null,
      }));

    if (orderItems.length === 0) {
      alert("선택한 상품이 없거나 모두 품절입니다.");
      return;
    }

    const totalAmount = orderItems.reduce(
      (sum, oi) => sum + (oi.price || 0) * (oi.quantity || 1),
      0
    );

    navigate("/payment", { state: { orderItems, totalAmount } });
  };

  if (loading) {
    return (
      <div className="container">
        <h2>장바구니 로딩 중...</h2>
      </div>
    );
  }

  return (
    <div className="container cart-container">
      <h2>장바구니</h2>

      {items.length === 0 ? (
        <div className="cart-empty">장바구니가 비었습니다.</div>
      ) : (
        <>
          <div
            className="cart-toolbar"
            style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => handleMasterToggle(e.target.checked)}
                title="품절 상품은 자동 제외됩니다"
              />
              전체선택 ({[...selectedIds].filter((id) => allCheckableIds.includes(id)).length}/{allCheckableIds.length})
            </label>
            <button
              className="btn-ghost"
              onClick={onRemoveSelected}
              disabled={[...selectedIds].filter((id) => allCheckableIds.includes(id)).length === 0}
            >
              선택삭제
            </button>
          </div>

          <div className="cart-items-list">
            {items.map((it) => (
              <CartItemRow
                key={it.cartItemId}
                item={it}
                checked={selectedIds.has(it.cartItemId) && !it._soldOut}
                onToggle={() => !it._soldOut && toggleSelectItem(it.cartItemId)}
                onQuantityChange={(id, q) => onQuantityChange(it.cartItemId, q, it._stock)}
                onRemove={() => onRemove(it.cartItemId)}
              />
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <div className="summary-text">선택 금액</div>
              <div className="summary-price">{fmtKRW(totalSelected)}</div>
            </div>
            <div className="summary-row">
              <div className="summary-text">총 금액(품절 제외)</div>
              <div className="summary-price">{fmtKRW(totalAll)}</div>
            </div>
            <button
              className="checkout-button"
              onClick={onCheckout}
              disabled={[...selectedIds].filter((id) => allCheckableIds.includes(id)).length === 0}
              title="품절 상품은 자동 제외됩니다"
            >
              선택 주문하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
