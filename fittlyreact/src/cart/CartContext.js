import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef, useMemo
} from "react";
import {
  getCartApi,
  addToCartApi,
  updateCartItemQuantityApi,
  removeCartItemApi
} from "./CartApi";
import { getAuth } from "../lib/jwt";

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider 하위에서만 useCart를 사용하세요.");
  return ctx;
};

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
  }
  return [];
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const qtyTimersRef = useRef({});
  const isLoggedIn = useCallback(() => !!(getAuth()?.token), []);
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setCartItems([]);
      setSelectedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await getCartApi();
      const list = unwrapList(res);
      setCartItems(list);
      setSelectedIds((prev) => {
        const next = new Set();
        const current = new Set(list.map((i) => i.cartItemId));
        for (const id of prev) if (current.has(id)) next.add(id);
        return next;
      });
    } catch (e) {
      console.error("장바구니 로딩 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const addItemToCart = useCallback(
    async (itemData) => {
      if (!isLoggedIn()) {
        alert("로그인이 필요합니다.");
        return;
      }
      try {
        await addToCartApi(itemData);
        await fetchCart();
      } catch (e) {
        console.error("장바구니 추가 실패:", e);
        alert(e?.response?.data?.message || "상품 추가에 실패했습니다.");
      }
    },
    [fetchCart, isLoggedIn]
  );

  const getMaxQtyFor = useCallback(
    (cartItemId) => {
      const it = cartItems.find((x) => x.cartItemId === cartItemId);
      const stock = Number(
        it?.availableStock ?? it?.stock ?? it?.maxQty ?? 99
      );
      return Number.isFinite(stock) && stock > 0 ? stock : 1;
    },
    [cartItems]
  );

  const clamp = (v, lo, hi) => Math.min(Math.max(Number(v) || 1, lo), hi);
  const updateItemQuantity = useCallback(
    (cartItemId, quantity) => {
      if (!isLoggedIn()) return;

      const max = getMaxQtyFor(cartItemId);
      const q = clamp(quantity, 1, max);

      setCartItems((prev) =>
        prev.map((it) =>
          it.cartItemId === cartItemId ? { ...it, quantity: q } : it
        )
      );

      if (qtyTimersRef.current[cartItemId])
        clearTimeout(qtyTimersRef.current[cartItemId]);

      qtyTimersRef.current[cartItemId] = setTimeout(async () => {
        try {
          await updateCartItemQuantityApi(cartItemId, q);
        } catch (e) {
          console.error("수량 변경 실패:", e);
          fetchCart();
        }
      }, 400);
    },
    [fetchCart, getMaxQtyFor, isLoggedIn]
  );

  const removeItemFromCart = useCallback(
    async (cartItemId) => {
      if (!isLoggedIn()) return;
      const snapshot = cartItems;
      setCartItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(cartItemId);
        return n;
      });
      try {
        await removeCartItemApi(cartItemId);
      } catch (e) {
        console.error("상품 삭제 실패:", e);
        setCartItems(snapshot);
        await fetchCart();
      }
    },
    [cartItems, fetchCart, isLoggedIn]
  );

  const removeSelectedItems = useCallback(
    async () => {
      if (selectedIds.size === 0) return;
      const ids = [...selectedIds];
      const snapshot = cartItems;

      setCartItems((prev) => prev.filter((i) => !selectedIds.has(i.cartItemId)));
      setSelectedIds(new Set());

      try {
        await Promise.all(ids.map((id) => removeCartItemApi(id)));
      } catch (e) {
        console.error("선택 삭제 실패:", e);
        setCartItems(snapshot);
        await fetchCart();
      }
    },
    [cartItems, selectedIds, fetchCart]
  );

  const removeItemsAfterOrder = useCallback((orderedProductIds) => {
    if (!Array.isArray(orderedProductIds) || orderedProductIds.length === 0) return;
    const removeSet = new Set(orderedProductIds.map(Number));
    setCartItems((prev) => {
      const toRemove = new Set(
        prev
          .filter((ci) => removeSet.has(Number(ci.productId ?? ci.id)))
          .map((ci) => ci.cartItemId)
      );
      if (toRemove.size) {
        setSelectedIds((sel) => {
          const n = new Set(sel);
          toRemove.forEach((id) => n.delete(id));
          return n;
        });
      }
      return prev.filter((ci) => !toRemove.has(ci.cartItemId));
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn()) fetchCart();
  }, [isLoggedIn, fetchCart]);

  useEffect(() => {
    const onAuthChange = () => {
      if (getAuth()?.token) fetchCart();
      else {
        setCartItems([]);
        setSelectedIds(new Set());
      }
    };
    window.addEventListener("authChange", onAuthChange);
    return () => window.removeEventListener("authChange", onAuthChange);
  }, [fetchCart]);

  useEffect(
    () => () => {
      Object.values(qtyTimersRef.current || {}).forEach(clearTimeout);
    },
    []
  );

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      fetchCart,
      addItemToCart,
      updateItemQuantity,
      removeItemFromCart,
      selectedIds,
      removeSelectedItems,
      toggleSelectItem: (id) =>
        setSelectedIds((prev) => {
          const n = new Set(prev);
          n.has(id) ? n.delete(id) : n.add(id);
          return n;
        }),
      selectAllItems: () =>
        setSelectedIds(new Set(cartItems.map((i) => i.cartItemId))),
      clearSelection: () => setSelectedIds(new Set()),
      removeItemsAfterOrder,
    }),
    [
      cartItems,
      loading,
      fetchCart,
      addItemToCart,
      updateItemQuantity,
      removeItemFromCart,
      selectedIds,
      removeSelectedItems,
      removeItemsAfterOrder,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
