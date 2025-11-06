import React, { useEffect, useState } from "react";
import { http } from "../lib/http";
import "../css/Qna.css";

export default function OrderSelectModal({ onClose, onSelect }) {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState("1m");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders(period);
  }, [period]);

  async function fetchOrders(p) {
    try {
      setLoading(true);
      const res = await http.get("/api/user/orders", { params: { period: p } });
      const rows = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setOrders(rows);
    } catch (e) {
      console.error("주문 조회 실패:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head">
          <h3>주문번호 조회</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="닫기">
            &times;
          </button>
        </div>
        <div className="period-options">
          {[
            { label: "1개월", val: "1m" },
            { label: "3개월", val: "3m" },
            { label: "6개월", val: "6m" },
            { label: "최대 5년", val: "5y" },
          ].map((p) => (
            <button
              key={p.val}
              className={`period-btn ${period === p.val ? "active" : ""}`}
              onClick={() => setPeriod(p.val)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="empty">불러오는 중...</div>
          ) : orders.length === 0 ? (
            <div className="empty">주문 내역이 없습니다.</div>
          ) : (
            <ul className="order-list">
              {orders.map((o) => (
                <li key={o.orderId || o.orderUid} className="order-item">
                  <div className="order-item-left">
                    <img
                      src={o.items?.[0]?.thumbnailUrl || "/images/no-image.png"}
                      alt={o.items?.[0]?.productName || "상품"}
                      className="order-thumb"
                      onError={(e) => (e.currentTarget.src = "/images/no-image.png")}
                    />
                    <div className="order-info-text">
                      <div className="order-id">No. {o.orderUid}</div>
                      <div className="product-name">
                        {o.items?.[0]?.productName || "상품명 없음"}
                      </div>
                      <div className="muted">
                        수량 {o.items?.[0]?.quantity ?? 0} ·{" "}
                        {(o.items?.[0]?.orderPrice ?? 0).toLocaleString()}원
                      </div>
                    </div>
                  </div>

                  <button
                    className="order-select-btn"
                    onClick={() =>
                      onSelect({
                        orderUid: o.orderUid,
                        orderId: o.orderId,
                        items: (o.items || []).map((it) => ({
                          orderItemId: it.orderItemId,
                          productId: it.productId,
                          productName: it.productName,
                          quantity: it.quantity,
                          thumbnailUrl: it.thumbnailUrl,
                        })),
                      })
                    }
                  >
                    선택
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
