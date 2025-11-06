import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getOrderByIdApi, getOrderByUidApi, getProductByIdApi } from "./OrderApi";
import { http } from "../lib/http";
import "../css/OrderDetailPage.css";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const isNumericId = (v) => /^\d+$/.test(String(v || ""));
const firstFinite = (...vals) => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
};

async function tryGet(url) {
  try {
    const r = await http.get(url);
    if (r?.data && typeof r.data === "object" && "data" in r.data) {
      return r.data.data;
    }
    return r?.data ?? r;
  } catch {
    return undefined;
  }
}

const ME_CANDIDATES = [
  "/api/user/me",
  "/api/me",
  "/user/me",
  "/me",
  "/account/me",
  "/profile",
  "/members/me",
  "/member/me",
  "/users/me",
];

function pickItems(order) {
  return (
    (Array.isArray(order?.items) && order.items) ||
    (Array.isArray(order?.orderItems) && order.orderItems) ||
    (Array.isArray(order?.products) && order.products) ||
    []
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const uidFromStateOrQuery = location.state?.orderUid || query.get("uid");
  const amountFromStateOrQuery = firstFinite(location.state?.amount, query.get("amount"));
  const seed = location.state?.seed;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        let data = null;

        if (isNumericId(orderId)) {
          try {
            data = await getOrderByIdApi(orderId);
          } catch {}
        } else {
          try {
            data = await getOrderByUidApi(orderId);
          } catch {}
        }

        if (!data && uidFromStateOrQuery) {
          try {
            data = await getOrderByUidApi(uidFromStateOrQuery);
          } catch {}
        }
        if (!data && seed) {
          data = { ...seed };
        }
        if (!data) throw new Error("해당 주문을 찾을 수 없습니다.");

        const needsPurchaser = !data?.purchaser && !data?.buyer && !data?.user;
        const needsShipping = !data?.shipping && !data?.receiver && !data?.address;
        if (needsPurchaser || needsShipping) {
          let me;
          for (const url of ME_CANDIDATES) {
            me = await tryGet(url);
            if (me) break;
          }
          const addresses = await tryGet("/api/addresses");
          const def = Array.isArray(addresses)
            ? addresses.find((a) => a.isDefault) || addresses[0]
            : undefined;
          data = {
            ...data,
            purchaser:
              data?.purchaser ||
              data?.buyer ||
              data?.user ||
              (me ? { name: me.name, email: me.email, phone: me.phone } : undefined),
            shipping:
              data?.shipping ||
              data?.receiver ||
              data?.address ||
              (def
                ? {
                    name: def.name,
                    phone: def.phone,
                    zipcode: def.zipcode,
                    address1: def.address1,
                    address2: def.address2,
                  }
                : undefined),
          };
        }

        const items = pickItems(data);
        const main = items[0] || {};
        let productTitle =
          data.title ||
          data.productName ||
          main.name ||
          main.productName ||
          (items.map((it) => it?.name || it?.title || it?.productName).filter(Boolean).join(", ")) ||
          seed?.__displayTitle ||
          seed?.title ||
          seed?.productName;

        if (!productTitle) {
          const pid =
            data.productId ||
            main.productId ||
            items.find((it) => it?.productId || it?.id)?.productId ||
            items.find((it) => it?.productId || it?.id)?.id;
          if (pid) {
            try {
              const p = await getProductByIdApi(pid);
              productTitle = p?.name || p?.title;
            } catch {}
          }
        }

        const productImg =
          main.thumbnailUrl ||
          main.imageUrl ||
          main.product?.thumbnailUrl ||
          main.product?.imageUrl ||
          null;

        const colorName =
          main.colorName ||
          main.productVariant?.colorName ||
          main.product?.colorName ||
          null;

        const size =
          main.size ||
          main.productVariant?.size ||
          main.product?.size ||
          null;

        data.__displayTitle = productTitle || "주문 상품";
        data.__displayImg = productImg;
        data.__displayColor = colorName;
        data.__displaySize = size;

        const summedItems = items.reduce((sum, it) => {
          const qty = firstFinite(it.quantity, it.qty, 1) || 1;
          const line =
            firstFinite(it.totalPrice, it.lineTotal, it.amount, (Number(it.price) || 0) * qty) || 0;
          return sum + line;
        }, 0);

        data.__displayAmount =
          firstFinite(
            amountFromStateOrQuery,
            data.amount,
            data.totalPrice,
            data.totalAmount,
            data.payment?.amount,
            data.payAmount,
            data.finalAmount,
            data.price,
            seed?.amount,
            seed?.totalPrice,
            seed?.totalAmount,
            seed?.price
          ) ?? summedItems;

        if (!alive) return;
        setOrder(data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "주문 정보를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId, uidFromStateOrQuery, seed, amountFromStateOrQuery]);

  if (loading)
    return (
      <div className="order-detail container">
        <div className="od-card">불러오는 중…</div>
      </div>
    );
  if (err && !order) {
    return (
      <div className="order-detail container">
        <div className="od-card">
          <h2 className="title">주문 상세</h2>
          <p className="subtitle" style={{ color: "#e11d48" }}>
            {err}
          </p>
          <div className="actions">
            <button className="ord-btn" onClick={() => navigate("/orders")}>
              목록으로
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!order) return null;

  const id = order.orderId ?? order.id;
  const orderUid = order.orderUid ?? order.uid ?? uidFromStateOrQuery ?? `FITTLy-${id}`;
  const createdAt = order.createdAt ?? order.orderedAt ?? order.orderDate;
  const u = order.purchaser || order.buyer || order.user || {};
  const s = order.shipping || order.receiver || order.address || {};

  return (
    <div className="order-detail container">
      <div className="order-top">
        {order.__displayImg && (
          <img
            src={order.__displayImg}
            alt={order.__displayTitle}
            className="order-thumb"
          />
        )}
        <div className="order-top-info">
          <h3 className="product-title">{order.__displayTitle}</h3>
          <p className="order-id">주문번호: {orderUid}</p>
          {order.__displaySize && (
            <p className="order-opt">상품 사이즈: {order.__displaySize}</p>
          )}
          {order.__displayColor && (
            <p className="order-opt">색상: {order.__displayColor}</p>
          )}
        </div>
        <div className="order-top-price">
          <strong>{fmtKRW(order.__displayAmount)}</strong>
          <div className="muted">총 1개 품목</div>
        </div>
      </div>
      <div className="od-card">
        <h2 className="title">주문 상세</h2>
        <p className="subtitle">
          <span style={{ marginRight: 12 }}>주문번호 {orderUid}</span>
          {createdAt ? <span>· {createdAt}</span> : null}
        </p>

        <hr className="divider" />

        <section className="grid">
          <article className="panel">
            <h3>주문자 정보</h3>
            <dl className="rows">
              <div className="row"><dt>이름</dt><dd>{u?.name || "-"}</dd></div>
              <div className="row"><dt>이메일</dt><dd>{u?.email || "-"}</dd></div>
              <div className="row"><dt>연락처</dt><dd>{u?.phone || "-"}</dd></div>
            </dl>
          </article>

          <article className="panel">
            <h3>배송지 정보</h3>
            <dl className="rows">
              <div className="row"><dt>받는사람</dt><dd>{s?.name || "-"}</dd></div>
              <div className="row"><dt>연락처</dt><dd>{s?.phone || "-"}</dd></div>
              <div className="row">
                <dt>주소</dt>
                <dd>{s?.zipcode ? `(${s.zipcode}) ` : ""}{[s?.address1, s?.address2].filter(Boolean).join(" ") || "-"}</dd>
              </div>
            </dl>
          </article>
        </section>

        <div className="actions">
          <button className="ord-btn" onClick={() => navigate("/")}>홈으로</button>
        </div>
      </div>
    </div>
  );
}
