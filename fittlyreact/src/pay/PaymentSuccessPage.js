import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/PaymentSuccessPage.css";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";

export default function PaymentSuccessPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const search = new URLSearchParams(loc.search);
  const orderUidQS = search.get("orderUid");
  const amountQS = search.get("amount");
  const stateOrderUid = loc.state?.orderUid;
  const stateAmount = loc.state?.amount;
  const orderUid = useMemo(() => stateOrderUid || orderUidQS || "-", [stateOrderUid, orderUidQS]);
  const amount = useMemo(() => Number(stateAmount ?? amountQS ?? 0), [stateAmount, amountQS]);
  const handleGoOrders = () => nav("/orders", { replace: true });
  const handleGoHome = () => nav("/", { replace: true });
  const copyOrderUid = async () => {
    try {
      await navigator.clipboard.writeText(orderUid);
      alert("주문번호가 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다. 주문번호를 직접 선택해 복사해주세요.");
    }
  };

  return (
    <div className="pay-ok-wrap container">
      <div aria-hidden className="confetti">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ "--i": i }} />
        ))}
      </div>

      <div className="pay-ok-card">
        <div className="pay-ok-icon">
          <svg viewBox="0 0 24 24" role="img" aria-label="성공">
            <circle cx="12" cy="12" r="11" className="ring" />
            <path className="check" d="M6 12.5l3.8 3.7L18 8" />
          </svg>
        </div>

        <h1 className="pay-ok-title">결제가 완료되었어요 🎉</h1>
        <p className="pay-ok-sub">주문이 정상적으로 접수되었습니다.</p>

        <div className="pay-ok-summary">
          <div className="sum-row">
            <span className="k">주문번호</span>
            <span className="v">
              <code className="order-uid">{orderUid}</code>
              <button className="copy" onClick={copyOrderUid} aria-label="주문번호 복사">복사</button>
            </span>
          </div>
          <div className="sum-row">
            <span className="k">결제금액</span>
            <span className="v strong">{fmtKRW(amount)}</span>
          </div>
          <div className="sum-row">
            <span className="k">결제상태</span>
            <span className="v badge">결제 완료</span>
          </div>
          <div className="sum-tip">
            예상 배송 안내: 결제 완료 후 1~3영업일 내 출고됩니다. (주말/공휴일 제외)
          </div>
        </div>

        <div className="pay-ok-actions">
          <button className="btn outline" onClick={handleGoHome}>계속 쇼핑하기</button>
          <button className="btn" onClick={handleGoOrders}>주문 내역 보기</button>
        </div>

        <div className="pay-ok-help">
          영수증/주문 내역은 <b>마이페이지 &gt; 주문내역</b>에서 확인할 수 있어요.
          문의가 필요하시면 고객센터로 연락해주세요.
        </div>
      </div>
    </div>
  );
}
