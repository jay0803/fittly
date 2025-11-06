import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { http } from "../lib/http";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../cart/CartContext";
import "../css/PaymentPage.css";
import { removeAfterOrderByOptionsApi } from "../cart/CartApi";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const norm = (v) => (v == null ? null : String(v).trim() || null);
async function tryGet(url) { try { return await http.get(url); } catch { return undefined; } }
const ME_ENDPOINT_CANDIDATES = [
  "/api/auth/me", "/auth/me", "/api/me", "/me",
  "/api/user/me", "/user/me", "/members/me", "/member/me", "/users/me",
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBuyNow = location?.state?.mode === "buynow";
  const buynowProducts = isBuyNow ? (location?.state?.products || []) : null;
  const { auth, isInitialized } = useAuth();
  const { cartItems, fetchCart } = useCart();

  useEffect(() => {
    if (!isInitialized) return;
    if (!auth?.token) {
      alert("로그인 후 결제를 진행해주세요.");
      navigate("/login/user", { replace: true, state: { from: location.pathname } });
    }
  }, [isInitialized, auth?.token, navigate, location.pathname]);

  const orderItems = useMemo(() => {
    if (isBuyNow) {
      return (buynowProducts || []).map((p) => ({
        productId: p.productId ?? p.id,
        productName:
          p.productName ||
          p.name ||
          p.title ||
          (p.productId ? `상품 #${p.productId}` : "상품"),
        quantity: Math.max(1, Number(p.quantity) || 1),
        price: Number(p.price) || 0,
        color: norm(p.color),
        colorName: norm(p.colorName),
        size: norm(p.size),
      }));
    }
    if (Array.isArray(location.state?.orderItems)) {
      return location.state.orderItems;
    }

    return (cartItems || []).map((ci) => ({
      productId: ci.productId ?? ci.id,
      productName:
        ci.productName ||
        ci.name ||
        ci.title ||
        ci.productNameKo ||
        (ci.product?.name) ||
        (ci.productId ? `상품 #${ci.productId}` : "상품"),
      quantity: Math.max(1, Number(ci.quantity) || 1),
      price: Number(ci.appliedPrice ?? ci.price ?? ci.productPrice ?? 0) || 0,
      color: norm(ci.color),
      colorName: norm(ci.colorName),
      size: norm(ci.size),
    }));
  }, [isBuyNow, buynowProducts, location.state?.orderItems, cartItems]);

  useEffect(() => {
    if (isInitialized && auth?.token && orderItems.length === 0) {
      alert("주문할 상품이 없습니다.");
      navigate("/cart", { replace: true });
    }
  }, [isInitialized, auth?.token, orderItems.length, navigate]);

  const [buyer, setBuyer] = useState({ name: "", phone: "" });
  const [shipAddr, setShipAddr] = useState({ zipcode: "", address1: "", address2: "" });
  const [addresses, setAddresses] = useState([]);
  const [createAddr, setCreateAddr] = useState({ zipcode: "", address1: "", address2: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    (async () => {
      try {
        let me = null;
        for (const u of ME_ENDPOINT_CANDIDATES) {
          const r = await tryGet(u);
          if (r) { me = r.data ?? r; break; }
        }
        if (me) setBuyer((b) => ({ ...b, name: me.name || b.name, phone: me.phone || b.phone }));

        const addrResp = await http.get("/api/addresses");
        const list = (addrResp?.data ?? addrResp ?? []).map(a => ({
          id: a.id, name: a.name, phone: a.phone,
          zipcode: a.zipcode, address1: a.address1, address2: a.address2,
          isDefault: !!a.isDefault,
        }));
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find(a => a.isDefault) ?? list[0];
          setShipAddr({ zipcode: def.zipcode, address1: def.address1, address2: def.address2 || "" });
        }
      } catch (e) {
        if (e?.response?.status === 401) {
          alert("로그인 후 결제를 진행해주세요.");
          navigate("/login/user", { replace: true, state: { from: location.pathname } });
        }
      }
    })();
  }, [isInitialized, navigate, location.pathname]);

  useEffect(() => {
    if (document.getElementById("daum-postcode")) return;
    const s = document.createElement("script");
    s.id = "daum-postcode";
    s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    document.head.appendChild(s);
    return () => document.getElementById("daum-postcode")?.remove();
  }, []);
  const openPostcode = (target) => {
    if (!window.daum) { alert("주소 검색 서비스가 준비되지 않았습니다."); return; }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const payload = {
          zipcode: data.zonecode,
          address1: data.roadAddress || data.jibunAddress || "",
          address2: "",
        };
        if (target === "ship") setShipAddr(payload);
        else setCreateAddr(payload);
      },
    }).open();
  };

  const pickAddress = (a) => {
    setShipAddr({ zipcode: a.zipcode, address1: a.address1, address2: a.address2 || "" });
    if (!buyer.phone && a.phone) setBuyer((p) => ({ ...p, phone: a.phone }));
  };

  const saveNewAddress = async () => {
    if (!createAddr.zipcode || !createAddr.address1) return alert("주소를 입력해주세요.");
    try {
      setSavingNew(true);
      const payload = {
        name: buyer.name, phone: buyer.phone,
        zipcode: createAddr.zipcode, address1: createAddr.address1, address2: createAddr.address2 || "",
        isDefault: false,
      };
      const created = await http.post("/api/addresses", payload);
      const obj = created?.data ?? created ?? payload;
      setAddresses((prev) => [obj, ...prev]);
      setShipAddr({ zipcode: obj.zipcode, address1: obj.address1, address2: obj.address2 || "" });
      setCreateAddr({ zipcode: "", address1: "", address2: "" });
    } catch (e) {
      alert(e?.response?.data?.message || "배송지 추가 중 오류가 발생했습니다.");
    } finally {
      setSavingNew(false);
    }
  };

  const itemsTotal = useMemo(
    () => orderItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0),
    [orderItems]
  );
  const shippingFee = itemsTotal > 0 ? 3000 : 0;
  const finalAmount = itemsTotal + shippingFee;
  const validate = () => {
    if (!window.IMP || !process.env.REACT_APP_PORTONE_IMP_CODE) {
      alert("결제 설정이 누락되었습니다."); return false;
    }
    if (!buyer.name?.trim()) return alert("이름을 확인해주세요."), false;
    if (!buyer.phone?.trim()) return alert("연락처를 입력해주세요."), false;
    if (!shipAddr.zipcode || !shipAddr.address1) return alert("배송지를 선택해주세요."), false;
    return true;
  };

  const handleRequestPayment = () => {
    if (!validate()) return;
    setLoading(true);
    const IMP = window.IMP;
    IMP.init(process.env.REACT_APP_PORTONE_IMP_CODE);

    const merchantUid = `FITTLY-${Date.now()}`;
    const firstName = orderItems[0]?.productName || "상품";
    const productName =
      orderItems.length > 1 ? `${firstName} 외 ${orderItems.length - 1}건` : firstName;

    IMP.request_pay(
      {
        pg: "html5_inicis",
        pay_method: "card",
        merchant_uid: merchantUid,
        name: productName,
        amount: finalAmount,
        buyer_email: auth?.user?.email || "",
        buyer_name: buyer.name,
        buyer_tel: buyer.phone,
        buyer_addr: `${shipAddr.address1} ${shipAddr.address2 || ""}`,
        buyer_postcode: shipAddr.zipcode,
      },
      async (rsp) => {
        if (!rsp.success) { alert(`결제 실패: ${rsp.error_msg}`); setLoading(false); return; }
        try {
          const payload = {
            impUid: rsp.imp_uid,
            merchantUid: rsp.merchant_uid,
            amount: itemsTotal,
            receiverName: buyer.name,
            receiverPhone: buyer.phone,
            zipcode: shipAddr.zipcode,
            address1: shipAddr.address1,
            address2: shipAddr.address2 || "",
            products: orderItems.map((it) => ({
              productId: it.productId ?? it.id,
              quantity: Math.max(1, Number(it.quantity) || 1),
              price: Number(it.price) || 0,
              color: it.color ?? null,
              colorName: it.colorName ?? null,
              size: it.size ?? null,
            })),
          };
          const res = await http.post("/api/pay/verify", payload);

          if (res?.success) {
            if (!isBuyNow) {
              try {
                const optionItems = orderItems.map((it) => ({
                  productId: it.productId ?? it.id,
                  color: norm(it.color),
                  size: norm(it.size),
                }));
                await removeAfterOrderByOptionsApi(optionItems);
                await fetchCart?.();
              } catch (e) {
                console.error("장바구니 정리 실패(옵션 삭제):", e);
              }
            }
            navigate(`/payment/success?orderUid=${encodeURIComponent(rsp.merchant_uid)}&amount=${finalAmount}`, {
              replace: true,
              state: { orderUid: rsp.merchant_uid, amount: finalAmount },
            });
          } else alert(res?.message || "결제 처리 중 서버 오류가 발생했습니다.");
        } catch (e) {
          alert(e?.response?.data?.message || "결제 처리 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  if (!isInitialized)
    return (
      <div className="container payment-container">
        <h2>주문 / 결제</h2>
        <div>페이지를 준비하는 중입니다...</div>
      </div>
    );

  return (
    <div className="container payment-container">
      <h2>주문 / 결제</h2>

      <div className="payment-section">
        <h3>주문자 정보</h3>
        <div className="form-group">
          <label>이름</label>
          <input value={buyer.name} readOnly />
        </div>
        <div className="form-group">
          <label>연락처</label>
          <input
            value={buyer.phone || ""}
            onChange={(e) => setBuyer((p) => ({ ...p, phone: e.target.value }))}
            placeholder="'-' 없이 숫자만 입력"
          />
        </div>
      </div>

      <div className="payment-section">
        <h3>배송지 정보</h3>
        {addresses.length > 0 ? (
          <ul className="addr-list">
            {addresses.map((a) => (
              <li key={a.id} className="addr-item">
                <div>
                  <div>
                    ({a.zipcode}) {a.address1} {a.address2 || ""}
                    {a.isDefault && <span className="addr-tag">기본</span>}
                  </div>
                  <button type="button" onClick={() => pickAddress(a)}>
                    선택
                  </button>
                </div>
                <div className="addr-info">
                  {a.name} · {a.phone}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">등록된 배송지가 없습니다.</div>
        )}

        <div className="form-group">
          <label>선택된 배송지</label>
          <input value={shipAddr.zipcode} readOnly placeholder="우편번호" />
          <input value={shipAddr.address1} readOnly placeholder="기본 주소" />
          <input
            value={shipAddr.address2}
            onChange={(e) => setShipAddr((s) => ({ ...s, address2: e.target.value }))}
            placeholder="상세 주소"
          />
        </div>

        <div className="address-add">
          <h4>새 배송지 추가</h4>
          <div className="zip-row">
            <input value={createAddr.zipcode} readOnly placeholder="우편번호" />
            <button type="button" onClick={() => openPostcode("create")}>주소 검색</button>
          </div>
          <input value={createAddr.address1} readOnly placeholder="기본 주소" />
          <input
            value={createAddr.address2}
            onChange={(e) => setCreateAddr((p) => ({ ...p, address2: e.target.value }))}
            placeholder="상세 주소"
          />
          <button onClick={saveNewAddress} disabled={savingNew}>
            {savingNew ? "저장 중..." : "배송지 추가"}
          </button>
        </div>
      </div>

      <div className="payment-section">
        <h3>주문 상품 정보</h3>
        {orderItems.map((item, idx) => (
          <div
            key={`${item.productId}-${item.color ?? ""}-${item.size ?? ""}-${idx}`}
            className="order-item-display"
          >
            <span>{item.productName} - {item.quantity}개</span>
            <span>{fmtKRW(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="payment-summary">
        <div className="summary-row"><span>총 상품 금액:</span><span>{fmtKRW(itemsTotal)}</span></div>
        <div className="summary-row"><span>배송비:</span><span>{fmtKRW(shippingFee)}</span></div>
        <div className="summary-row total"><h3>최종 결제 금액:</h3><h3>{fmtKRW(finalAmount)}</h3></div>
        <button onClick={handleRequestPayment} disabled={loading || orderItems.length === 0} className="checkout-button">
          {loading ? "결제 처리 중..." : `${fmtKRW(finalAmount)} 결제하기`}
        </button>
      </div>
    </div>
  );
}
