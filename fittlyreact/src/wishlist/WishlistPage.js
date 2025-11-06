import React, { useMemo, useState, useEffect } from "react";
import { useWishlist } from "./WishlistContext";
import { useCart } from "../cart/CartContext";
import { getAuth } from "../lib/jwt";
import "../css/CartPage.css";

const getPid = (it) => Number(it?.productId ?? it?.id ?? NaN);
const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const optKey = (pid, color, size) =>
  `${pid}::${String(color || "").toUpperCase()}::${String(size || "").toUpperCase()}`;
const toNum = (v) => (v == null ? NaN : Number(v));
const isSoldOut = (item) => {
  const stockCandidates = [item?.stock, item?.variantStock, item?.sizeStock, item?.inventory]
    .map(toNum)
    .filter((v) => Number.isFinite(v));
  const stock = stockCandidates.length ? stockCandidates[0] : undefined;
  const soldOutFlag = item?.isSoldOut === true || item?.isSoldOut === "true";
  return (Number.isFinite(stock) && stock <= 0) || soldOutFlag;
};

export default function WishlistPage() {
  const { wishlistItems, loading, removeItemFromWishlist } = useWishlist();
  const { addItemToCart, loading: cartLoading } = useCart();
  const isLoggedIn = !!(getAuth()?.token);

  const items = useMemo(
    () =>
      Array.isArray(wishlistItems)
        ? wishlistItems
            .map((x) => {
              const pid = getPid(x);
              const color = x.color ?? null;
              const colorName = x.colorName ?? null;
              const size = x.size ?? null;
              return {
                ...x,
                _key: optKey(pid, color, size),
                productId: pid,
                productName: x.productName ?? x.name ?? "",
                thumbnailUrl: x.thumbnailUrl ?? x.image ?? "/images/no-image.png",
                price: Number(x.discountPrice ?? x.price ?? 0),
                color,
                colorName,
                size,
              };
            })
            .filter((x) => !Number.isNaN(getPid(x)))
        : [],
    [wishlistItems]
  );

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const allChecked = items.length > 0 && items.every((it) => selectedKeys.has(it._key));

  useEffect(() => setSelectedKeys(new Set()), [items.length]);

  const toggleSelectItem = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleMasterCheck = (e) =>
    e.target.checked
      ? setSelectedKeys(new Set(items.map((it) => it._key)))
      : setSelectedKeys(new Set());

  const removeSelectedItems = async () => {
    if (selectedKeys.size === 0) return;
    if (!window.confirm("선택한 상품을 찜목록에서 삭제할까요?")) return;
    for (const it of items) {
      if (!selectedKeys.has(it._key)) continue;
      await removeItemFromWishlist({
        productId: it.productId,
        color: it.color,
        size: it.size,
      }).catch((e) => console.error(e));
    }
    setSelectedKeys(new Set());
  };

  const addSelectedToCart = async () => {
    if (selectedKeys.size === 0) return;
    let ok = 0, skipped = 0;
    for (const it of items) {
      if (!selectedKeys.has(it._key)) continue;
      if (isSoldOut(it)) { skipped++; continue; }
      try {
        await addItemToCart({
          productId: it.productId,
          quantity: 1,
          color: it.color,
          size: it.size,
        });
        ok++;
      } catch {}
    }
    if (ok === 0 && skipped > 0) alert("선택한 상품이 모두 품절입니다.");
    else if (skipped > 0) alert(`${ok}개 담았어요. (품절 ${skipped}개 제외)`);
    else alert(`${ok}개를 장바구니에 담았어요.`);
  };

  const totalSelected = useMemo(
    () =>
      items.reduce(
        (sum, it) => (selectedKeys.has(it._key) ? sum + (Number(it.price) || 0) : sum),
        0
      ),
    [items, selectedKeys]
  );
  const totalAll = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.price) || 0), 0),
    [items]
  );

  if (loading) return <div className="container"><h2>찜 목록 로딩 중...</h2></div>;
  if (!isLoggedIn)
    return (
      <div className="container cart-container">
        <h2>찜 목록</h2>
        <div className="cart-empty">로그인 후 이용해주세요.</div>
      </div>
    );

  return (
    <div className="container cart-container" style={{ marginTop: "80px" }}>
      <h2 style={{ fontWeight: "700", fontSize: "1.6rem" }}>찜 목록</h2>

      {items.length === 0 ? (
        <div className="cart-empty">찜한 상품이 없습니다.</div>
      ) : (
        <>
          <div
            className="cart-toolbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "12px 0 18px",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={allChecked} onChange={handleMasterCheck} />
              전체선택 ({selectedKeys.size}/{items.length})
            </label>
            <button className="btn-ghost" onClick={removeSelectedItems} disabled={selectedKeys.size === 0}>
              선택삭제
            </button>
          </div>

          <div className="cart-items-list">
            {items.map((item) => (
              <div
                key={item._key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 4px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(item._key)}
                    onChange={() => toggleSelectItem(item._key)}
                  />
                  <img
                    src={item.thumbnailUrl}
                    alt={item.productName}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 10,
                      objectFit: "cover",
                      boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      {item.color && (
                        <span
                          style={{
                            fontSize: "0.85rem",
                            border: "1px solid #ddd",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "#fafafa",
                          }}
                        >
                          색상: {item.colorName || item.color}
                        </span>
                      )}
                      {item.size && (
                        <span
                          style={{
                            fontSize: "0.85rem",
                            border: "1px solid #ddd",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "#fafafa",
                          }}
                        >
                          사이즈: {item.size}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#333", marginTop: 6 }}>
                      {fmtKRW(item.price)}
                    </div>
                  </div>
                </div>

                <button
            className="wishlist-cart-btn"
            title="장바구니 담기"
            onClick={async () => {
              try {
                const res = await addItemToCart({
                  productId: item.productId,
                  quantity: 1,
                  color: item.color ?? null,
                  size: item.size ?? null,
                });

                if (res?.success || res?.data?.success) {
                  alert("장바구니에 담았습니다.");
                } else {
                  alert("장바구니에 담았습니다!");
                }
              } catch (err) {
                console.error("장바구니 담기 실패:", err);
                alert("장바구니 담기 중 오류가 발생했습니다.");
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <path d="M6 6h15l-1.5 9h-12L6 6zM9 21a1 1 0 110-2 1 1 0 010 2zm9 0a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
              </div>
            ))}
          </div>

          <div
            className="cart-summary"
            style={{
              marginTop: 40,
              padding: "24px 28px",
              borderRadius: 14,
              background: "#fff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div>
              <div className="summary-text">선택 상품 금액</div>
              <div className="summary-price">{fmtKRW(totalSelected)}</div>
            </div>
            <div>
              <div className="summary-text">총 금액</div>
              <div className="summary-price">{fmtKRW(totalAll)}</div>
            </div>
            <button
              className="checkout-button"
              onClick={addSelectedToCart}
              disabled={selectedKeys.size === 0 || cartLoading}
              title="품절 상품은 자동 제외됩니다"
            >
              {selectedKeys.size > 0
                ? `선택 ${selectedKeys.size}개 장바구니 담기`
                : "전체 장바구니 담기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
