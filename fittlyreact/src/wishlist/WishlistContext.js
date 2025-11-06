import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { getWishlistApi, addToWishlistApi, removeFromWishlistApi } from "./WishlistApi";
import { getAuth } from "../lib/jwt";

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

const getPid = (item) => Number(item?.productId ?? item?.id ?? NaN);
const norm = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const up = (v) => (norm(v) || "").toUpperCase();
const optKey = (pid, color, size) =>
  `${Number(pid)}::${up(color)}::${up(size)}`;
const dedupeByOption = (arr) => {
  const map = new Map();
  for (const it of arr || []) {
    const pid = getPid(it);
    if (Number.isNaN(pid)) continue;
    const key = optKey(pid, it?.color, it?.size);
    map.set(key, it);
  }
  return Array.from(map.values());
};

const normalizeToggleArgs = (arg1, arg2, arg3) => {
  if (arg1 && typeof arg1 === "object") return arg1;
  return { productId: arg1, next: arg2, productOptional: arg3 };
};

const normalizeRemoveArgs = (arg) => {
  if (typeof arg === "number")
    return { productId: arg, color: null, colorName: null, size: null };
  if (arg && typeof arg === "object") {
    return {
      productId: arg.productId,
      color: norm(arg.color ?? arg.productOptional?.color ?? null),
      colorName: norm(arg.colorName ?? arg.productOptional?.colorName ?? null),
      size: norm(arg.size ?? arg.productOptional?.size ?? null),
    };
  }
  return { productId: null, color: null, colorName: null, size: null };
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const inFlightRequests = useRef(new Set());
  const mountedRef = useRef(true);
  const didInitRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isLoggedIn = () => !!(getAuth()?.token);
  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn()) {
      if (mountedRef.current) setWishlistItems([]);
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const list = await getWishlistApi();
      if (!mountedRef.current) return;
      setWishlistItems(Array.isArray(list) ? dedupeByOption(list) : []);
    } catch (err) {
      console.error("찜 목록 로딩 실패:", err);
      if (!mountedRef.current) return;
      setWishlistItems([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loading]);

  const toggleWishlistItem = useCallback(
    async (arg1, arg2, arg3) => {
      const normalized = normalizeToggleArgs(arg1, arg2, arg3);
      const { productId, next, productOptional } = normalized;
      const pid = Number(productId);
      if (!pid || Number.isNaN(pid)) return false;

      if (!isLoggedIn()) {
        alert("로그인이 필요합니다.");
        return false;
      }

      const color = norm(normalized.color ?? productOptional?.color ?? null);
      const colorName = norm(
        normalized.colorName ?? productOptional?.colorName ?? null
      );
      const size = norm(normalized.size ?? productOptional?.size ?? null);

      const key = optKey(pid, color, size);
      if (inFlightRequests.current.has(key)) return false;
      inFlightRequests.current.add(key);

      const existed = wishlistItems.some(
        (x) =>
          getPid(x) === pid &&
          up(x?.color) === up(color) &&
          up(x?.size) === up(size)
      );

      const desiredAdd = typeof next === "boolean" ? next : !existed;
      const snapshot = [...wishlistItems];

      try {
        if (desiredAdd) {
          if (!existed && productOptional) {
            const optimistic = {
              ...productOptional,
              productId: getPid(productOptional) || pid,
              color,
              colorName,
              size,
              _optimistic: true,
            };
            if (mountedRef.current) {
              setWishlistItems((prev) => dedupeByOption([optimistic, ...prev]));
            }
          }
          await addToWishlistApi({ productId: pid, color, colorName, size });
          await fetchWishlist();
          return true;
        } else {
          if (existed && mountedRef.current) {
            setWishlistItems((prev) =>
              prev.filter(
                (x) =>
                  !(
                    getPid(x) === pid &&
                    up(x?.color) === up(color) &&
                    up(x?.size) === up(size)
                  )
              )
            );
          }
          await removeFromWishlistApi({ productId: pid, color, colorName, size });
          await fetchWishlist();
          return true;
        }
      } catch (err) {
        console.error("찜 토글 실패:", err?.response?.data || err);
        if (mountedRef.current) setWishlistItems(snapshot);
        throw err;
       } finally {
         inFlightRequests.current.delete(key);
       }
     },
     [wishlistItems, fetchWishlist]
   );

  const removeItemFromWishlist = useCallback(
    async (arg) => {
      const { productId, color, colorName, size } = normalizeRemoveArgs(arg);
      const pid = Number(productId);
      if (!pid || Number.isNaN(pid)) return false;

      const key = optKey(pid, color, size);
      if (inFlightRequests.current.has(key)) return false;

      const snapshot = [...wishlistItems];
      inFlightRequests.current.add(key);

      try {
        if (mountedRef.current) {
          setWishlistItems((prev) =>
            prev.filter(
              (x) =>
                !(
                  getPid(x) === pid &&
                  up(x?.color) === up(color) &&
                  up(x?.size) === up(size)
                )
            )
          );
        }

        await removeFromWishlistApi({ productId: pid, color, colorName, size });
        await fetchWishlist();
        return true;
      } catch (err) {
        console.error("찜 해제 실패:", err?.response?.data || err);
        if (mountedRef.current) setWishlistItems(snapshot);
        throw err;
       } finally {
         setTimeout(() => inFlightRequests.current.delete(key), 200);
       }
     },
     [wishlistItems, fetchWishlist]
   );

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    const onAuthChange = () => fetchWishlist();
    window.addEventListener("authChange", onAuthChange);
    return () => window.removeEventListener("authChange", onAuthChange);
  }, [fetchWishlist]);

  const value = {
    wishlistItems,
    loading,
    fetchWishlist,
    toggleWishlistItem,
    removeItemFromWishlist,
    inFlightRequests,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
