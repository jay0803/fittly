import { http } from "../lib/http";

const baseHasApi = (() => {
  const b = (http?.defaults?.baseURL || "").replace(/\/+$/, "");
  return /(^|\/)api$/.test(b);
})();
const apiPath = (suffix) => (baseHasApi ? `/user/${suffix}` : `/api/user/${suffix}`);
const cfg = (extra = {}) => ({
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  ...extra,
});

function unwrapList(res) {
  if (res == null) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (res && typeof res === "object" && "data" in res) {
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.content)) return d.content;
    return [];
  }
  return [];
}

function unwrapValue(res, fallback = false) {
  if (res == null) return fallback;
  if (typeof res === "boolean" || typeof res === "number" || typeof res === "string") return res;
  if (res && typeof res === "object" && "data" in res) {
    const d = res.data;
    if (typeof d === "boolean" || typeof d === "number" || typeof d === "string") return d;
    return d ?? fallback;
  }
  return fallback;
}

function unwrapSuccess(res) {
  if (res && typeof res === "object" && "success" in res) return !!res.success;
  return true;
}

function normOpt(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function cleanParams(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") out[k] = v;
  });
  return out;
}

function rethrow(name, err) {
  const status = err?.response?.status;
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    `${name} 실패`;
  console.error(`${name}:`, {
    status,
    url: err?.config?.url,
    method: err?.config?.method,
    params: err?.config?.params,
    requestBody: err?.config?.data,
    response: err?.response?.data,
  });
  const e = new Error(msg);
  e.status = status;
  throw e;
}

export async function getWishlistApi() {
  try {
    const res = await http.get(apiPath("wishlist"), cfg());
    return unwrapList(res);
  } catch (err) {
    if (err?.response?.status === 401) return [];
    rethrow("getWishlistApi", err);
  }
}

export async function addToWishlistApi(arg) {
  try {
    let productId, color = null, colorName = null, size = null;

    if (typeof arg === "number") {
      productId = arg;
    } else if (arg && typeof arg === "object") {
      productId = arg.productId;
      color = normOpt(arg.color);
      colorName = normOpt(arg.colorName);
      size = normOpt(arg.size);
    }
    if (!productId) throw new Error("productId가 필요합니다.");

    const body = { productId: Number(productId), color, colorName, size };
    const res = await http.post(apiPath("wishlist"), body, cfg());
    return { success: unwrapSuccess(res), data: res ?? null };
  } catch (err) {
    rethrow("addToWishlistApi", err);
  }
}

export async function removeFromWishlistApi(arg) {
  try {
    let productId, color = null, colorName = null, size = null;

    if (typeof arg === "number") {
      productId = arg;
    } else if (arg && typeof arg === "object") {
      productId = arg.productId;
      color = normOpt(arg.color);
      colorName = normOpt(arg.colorName);
      size = normOpt(arg.size);
    }
    if (!productId) throw new Error("productId가 필요합니다.");

    const params = cleanParams({ productId: Number(productId), color, colorName, size });
    const res = await http.delete(apiPath("wishlist"), { ...cfg(), params });
    return { success: unwrapSuccess(res), data: res ?? null };
  } catch (err) {
    rethrow("removeFromWishlistApi", err);
  }
}

export async function existsInWishlistApi(arg) {
  try {
    let productId, color = null, colorName = null, size = null;

    if (typeof arg === "number") {
      productId = arg;
    } else if (arg && typeof arg === "object") {
      productId = arg.productId;
      color = normOpt(arg.color);
      colorName = normOpt(arg.colorName);
      size = normOpt(arg.size);
    }
    if (!productId) return false;

    const params = cleanParams({ productId: Number(productId), color, colorName, size });
    const res = await http.get(apiPath("wishlist/exists"), { ...cfg(), params });
    return !!unwrapValue(res, false);
  } catch (err) {
    if (err?.response?.status === 401) return false;
    rethrow("existsInWishlistApi", err);
  }
}

export const addItemToWishlist = addToWishlistApi;
export const removeItemFromWishlist = removeFromWishlistApi;
export const existsInWishlist = existsInWishlistApi;
