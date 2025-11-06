const JSON_HEADERS = { Accept: "application/json", "Content-Type": "application/json" };

async function parseApi(res) {
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = body?.message || body?.error || (typeof body === "string" ? body : "요청이 실패했습니다.");
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return body?.data ?? body;
}

async function getFirstOk(urls) {
  let lastErr;
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: "GET", headers: JSON_HEADERS, credentials: "include" });
      return await parseApi(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("요청 실패");
}

export async function getMyOrdersApi() {
  return getFirstOk([
    "/api/user/orders",
    "/api/orders",
  ]);
}

export async function getOrderByIdApi(orderId) {
  return getFirstOk([
    `/api/user/orders/${orderId}`,
    `/api/orders/${orderId}`,
  ]);
}

export async function getOrderByUidApi(orderUid) {
  const uid = encodeURIComponent(String(orderUid));
  return getFirstOk([
    `/api/user/orders/uid/${uid}`,
    `/api/user/orders/by-uid/${uid}`,
    `/api/user/orders?orderUid=${uid}`,
    `/api/orders/uid/${uid}`,
    `/api/orders/by-uid/${uid}`,
    `/api/orders?orderUid=${uid}`,
  ]);
}

export async function getProductByIdApi(productId) {
  const id = encodeURIComponent(String(productId));
  return getFirstOk([
    `/api/products/${id}`,
    `/api/product/${id}`,
    `/products/${id}`,
  ]);
}
