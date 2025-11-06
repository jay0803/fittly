import { http } from "../lib/http";

function unwrapList(res) {
  if (res && typeof res === "object" && "data" in res) {
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.content)) return d.content;
    return [];
  }
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  return [];
}

function unwrapSuccess(res) {
  if (res && typeof res === "object" && "success" in res) {
    return !!res.success;
  }
  return true;
}

export async function getCartApi() {
  try {
    const res = await http.get("/user/cart");
    return unwrapList(res);
  } catch (err) {
    if (err?.response?.status === 401) return [];
    console.error("getCartApi 실패:", err);
    return [];
  }
}

export async function addToCartApi({ productId, quantity = 1, color = null, size = null }) {
  const body = { productId, quantity, color, size };
  const res = await http.post("/user/cart", body);
  return unwrapSuccess(res);
}

export async function updateCartItemQuantityApi(cartItemId, quantity) {
  const res = await http.patch(`/user/cart/${cartItemId}`, { quantity });
  return unwrapSuccess(res);
}

export async function removeCartItemApi(cartItemId) {
  const res = await http.delete(`/user/cart/${cartItemId}`);
  return unwrapSuccess(res);
}

const _norm = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

export async function removeAfterOrderByOptionsApi(optionItems) {
  const list = Array.isArray(optionItems) ? optionItems : [];
  const body = list
    .filter(Boolean)
    .map((x) => ({
      productId: Number(x.productId),
      color: _norm(x.color),
      size: _norm(x.size),
    }))
    .filter((x) => Number.isFinite(x.productId));

  if (body.length === 0) return true;

  const res = await http.post("/user/cart/remove-after-order-options", body);
  return unwrapSuccess(res);
}
