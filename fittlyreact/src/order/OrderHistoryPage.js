import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrdersApi, getProductByIdApi } from "./OrderApi";
import OrderRow from "./OrderRow";
import "../css/OrderList.css";

const firstFinite = (...vals) => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
};

function pickItems(order) {
  return (
    (Array.isArray(order?.items) && order.items) ||
    (Array.isArray(order?.orderItems) && order.orderItems) ||
    (Array.isArray(order?.products) && order.products) ||
    []
  );
}

async function ensureTitle(order) {
  const items = pickItems(order);
  const inline =
    order.title ||
    order.productName ||
    items.map((it) => it?.name || it?.title || it?.productName).filter(Boolean).join(", ");

  if (inline) return inline;

  const pid =
    order.productId ||
    items.find((it) => it?.productId || it?.id)?.productId ||
    items.find((it) => it?.productId || it?.id)?.id;

  if (!pid) return "주문 상품";
  try {
    const p = await getProductByIdApi(pid);
    return p?.name || p?.title || "주문 상품";
  } catch {
    return "주문 상품";
  }
}

export default function OrderHistoryPage() {
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const raw = await getMyOrdersApi();
        if (!alive) return;

        const enriched = await Promise.all(
          (Array.isArray(raw) ? raw : []).map(async (o) => {
            const items = pickItems(o);
            const amount =
              firstFinite(
                o.amount, o.totalPrice, o.totalAmount, o.payment?.amount, o.payAmount, o.finalAmount, o.price
              ) ?? items.reduce((sum, it) => {
                const qty = firstFinite(it.quantity, it.qty, 1) || 1;
                const line = firstFinite(it.totalPrice, it.lineTotal, it.amount, (Number(it.price) || 0) * qty) || 0;
                return sum + line;
              }, 0);

            const title = await ensureTitle(o);

            return { ...o, __displayAmount: amount, __displayTitle: title };
          })
        );

        setOrders(enriched);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "주문 내역을 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="container" style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ margin: "0 0 14px", fontWeight: 800 }}>주문 내역</h2>

      {loading ? (
        <p>불러오는 중…</p>
      ) : err ? (
        <p style={{ color: "#e11d48" }}>{err}</p>
      ) : orders.length === 0 ? (
        <>
          <p>주문 내역이 없습니다.</p>
          <button className="btn-ghost" onClick={() => nav("/")}>쇼핑 계속하기</button>
        </>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {orders.map((o) => {
            const id  = o.orderId ?? o.id ?? null;
            const uid = o.orderUid ?? o.uid ?? null;

            const goDetail = () => {
              if (id != null) {
                nav(`/orders/${id}`, {
                  state: {
                    orderUid: uid,
                    amount: o.__displayAmount,
                    seed: o,
                  },
                });
              } else if (uid) {
                nav(`/orders/${encodeURIComponent(uid)}`, {
                  state: {
                    orderUid: uid,
                    amount: o.__displayAmount,
                    seed: o,
                  },
                });
              }
            };

            return (
              <OrderRow
                key={id ?? uid ?? Math.random()}
                order={o}
                onViewDetail={goDetail}
                onWriteReview={() => { if (id != null) nav(`/reviews/new?orderId=${id}`); }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
