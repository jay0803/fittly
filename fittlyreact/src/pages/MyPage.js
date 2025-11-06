
import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import "../css/MyPage.css";
import { http } from "../lib/http";
import { clearAuth } from "../lib/jwt";
import QnA from "../qna/Qna";
import ReviewForm from "../review/ReviewForm";
import OrderHistoryPage from "../order/OrderHistoryPage";
import MyReviewPage from "../review/MyReviewPage";
import { ReviewProvider, useReview } from "../review/ReviewContext";

const AddressesTab = lazy(() => import("./tabs/AddressesTab"));
const TABS = [
  { key: "profile", label: "프로필" },
  { key: "account", label: "내 정보 수정(비밀번호/아이디)" },
  { key: "addresses", label: "배송지 관리" },
  { key: "orders", label: "주문내역" },
  { key: "reviews", label: "리뷰" },
  { key: "qna", label: "문의내역" },
];

const SUPPORT_INQUIRY_PATH = "/support/inquiry";

const ME_OVERRIDE =
  (typeof process !== "undefined" && process?.env?.REACT_APP_ME_ENDPOINT) || "";
const ME_ENDPOINT_CANDIDATES = [
  "/me", "/users/me", "/user/me", "/account/me", "/profile",
  "/members/me", "/member/me", "/user", "/auth/me",
];

async function tryGet(url) {
  try { return await http.get(url); } catch { return undefined; }
}

function normalizeMe(raw) {
  if (!raw) return {};
  const layer1 =
    raw.data ?? raw.result ?? raw.payload ?? raw.user ?? raw.member ??
    raw.account ?? raw.profile ?? raw;

  const principal =
    layer1.principal ?? layer1.details ?? layer1.account ?? layer1.user ?? layer1.name;
  const attrs =
    layer1.attributes ?? layer1.attr ?? layer1.claims ?? principal?.attributes ?? principal?.claims;

  const u = (typeof layer1 === "object" ? layer1 : {}) || {};
  const addr = u.address ?? layer1.address ?? {};

  const loginId =
    u.loginId ?? u.username ?? u.id ?? principal?.username ?? attrs?.preferred_username ?? "";

  return {
    loginId: String(loginId || ""),
    email: String(u.email ?? attrs?.email ?? ""),
    name: String((typeof u.name === "string" ? u.name : u.fullName ?? u.nickname ?? attrs?.name ?? "") || ""),
    phone: String(u.phone ?? u.mobile ?? u.tel ?? attrs?.phone_number ?? ""),
    createdAt: String(u.createdAt ?? u.joinedAt ?? layer1.createdAt ?? ""),
    zipcode: String(u.zipcode ?? u.postcode ?? addr.zipcode ?? addr.postcode ?? ""),
    address1: String(u.address1 ?? addr.line1 ?? addr.address1 ?? addr.address ?? ""),
    address2: String(u.address2 ?? addr.line2 ?? addr.address2 ?? ""),
  };
}

function fmtDateOnly(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v).slice(0, 10) : d.toISOString().slice(0, 10);
  } catch {
    return String(v).slice(0, 10);
  }
}

export default function MyPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [me, setMe] = useState({
    loginId: "", email: "", name: "", phone: "",
    zipcode: "", address1: "", address2: "", createdAt: "",
  });

  const [loginId, setLoginId] = useState({ next: "" });
  const [idSaving, setIdSaving] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [errs, setErrs] = useState({ loginId: "", current: "", next: "", confirm: "" });
  const newIdRef = useRef(null);
  const pwdCurrentRef = useRef(null);
  const pwdNextRef = useRef(null);
  const pwdConfirmRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [draftReview, setDraftReview] = useState({
    productId: null,
    orderItemId: null,
    productName: "",
    brand: "",
    rating: 5,
    content: "",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setMsg("");
        let meRaw;
        if (ME_OVERRIDE) meRaw = await tryGet(ME_OVERRIDE);
        if (!meRaw) {
          for (const u of ME_ENDPOINT_CANDIDATES) {
            const res = await tryGet(u);
            if (res !== undefined) { meRaw = res; break; }
          }
        }
        if (!meRaw) throw new Error("ME_NOT_FOUND");
        setMe((p) => ({ ...p, ...normalizeMe(meRaw) }));

        try {
          const ord = await http.get("/orders?size=10");
          const rows = Array.isArray(ord?.content) ? ord.content : ord || [];
          setOrders(rows);
        } catch { setOrders([]); }
      } catch (e) {
        console.error(e);
        setMsg("내 정보 불러오기에 실패했어요.");
      } finally { setLoading(false); }
    })();
  }, []);

  const isValidPassword = (pw) =>
  typeof pw === "string" && pw.length >= 8 && /[A-Z]/.test(pw) && /[^A-Za-z0-9]/.test(pw);

  const pickErrorCode = (err) => {
    const r = err?.response, d = r?.data;
    let code =
      d?.code || d?.message || d?.error ||
      (typeof d === "string" ? d : null) || r?.statusText || null;

    if (typeof code === "string") {
      const s = code.toLowerCase();
      if (s.includes("mismatch")) return "MISMATCH";
      if (s.includes("same_password")) return "SAME_PASSWORD";
      if (s.includes("weak")) return "WEAK_PASSWORD";
      if (s.includes("no_password")) return "NO_PASSWORD";
      if (s.includes("forbidden")) return "MISMATCH";
      if (s.includes("conflict")) return "SAME_PASSWORD";
    }
    return code;
  };

  const saveAccount = async (e) => {
    e.preventDefault();
    if (pwdSaving) return;

    setMsg("");
    setErrs({ current: "", next: "", confirm: "" });

    const { current, next, confirm } = pwd;

    if (!current) {
      setErrs((p) => ({ ...p, current: "현재 비밀번호를 입력해주세요." }));
      pwdCurrentRef.current?.focus();
      return;
    }
    if (!next) {
      setErrs((p) => ({ ...p, next: "새 비밀번호를 입력해주세요." }));
      pwdNextRef.current?.focus();
      return;
    }
    if (!isValidPassword(next)) {
      setErrs((p) => ({
        ...p,
        next: "비밀번호는 8자 이상, 대문자 1개 이상, 특수문자 1개 이상 포함해야 합니다.",
      }));
      pwdNextRef.current?.focus();
      return;
    }
    if (next !== confirm) {
      setErrs((p) => ({ ...p, confirm: "새 비밀번호 확인이 일치하지 않습니다." }));
      pwdConfirmRef.current?.focus();
      return;
    }

    try {
      setPwdSaving(true);
      await http.put("/account/password", {
        currentPassword: current,
        newPassword: next,
      });

      setPwd({ current: "", next: "", confirm: "" });
      window.alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      try { clearAuth?.(); } catch {}
      window.dispatchEvent(new Event("authChange"));
      window.location.replace("/login");
    } catch (err) {
      const status = err?.response?.status;
      let code =
        status === 403 ? "MISMATCH" :
        status === 409 ? "SAME_PASSWORD" :
        status === 400 ? "WEAK_PASSWORD" : undefined;
      if (!code) code = pickErrorCode(err);

      if (code === "MISMATCH") {
        setErrs((p) => ({ ...p, current: "현재 비밀번호와 일치하지 않습니다." }));
        setTimeout(() => pwdCurrentRef.current?.focus(), 0);
      } else if (code === "SAME_PASSWORD") {
        setErrs((p) => ({ ...p, next: "기존 비밀번호와 동일합니다." }));
        setTimeout(() => pwdNextRef.current?.focus(), 0);
      } else if (code === "WEAK_PASSWORD") {
        setErrs((p) => ({
          ...p,
          next: "비밀번호는 8자 이상, 대문자 1개 이상, 특수문자 1개 이상 포함해야 합니다.",
        }));
        setTimeout(() => pwdNextRef.current?.focus(), 0);
      } else if (code === "NO_PASSWORD") {
        setErrs((p) => ({ ...p, current: "설정된 비밀번호가 없습니다. 관리자에게 문의하세요." }));
        setTimeout(() => pwdCurrentRef.current?.focus(), 0);
      } else {
        setMsg("비밀번호 변경 실패");
        setErrs((p) => ({ ...p, current: "비밀번호 변경에 실패했습니다." }));
        setTimeout(() => pwdCurrentRef.current?.focus(), 0);
      }
    } finally {
      setPwdSaving(false);
    }
  };

  const { addWritten, removeWritable } = useReview?.() || {};
  const currentTabLabel = TABS.find(t => t.key === tab)?.label ?? "메뉴";

  return (
    <div className="mypage">
      <div className="container mypage-inner">
        <aside className="my-side">
          <div className="my-card head">
            <div className="my-hello">내 정보</div>
            <div className="my-sub">계정·배송지·주문을 한 곳에서</div>
          </div>
          <div className="my-tabs">
            <div className="tab-list desktop">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`my-tab ${tab === t.key ? "active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <details className="tab-accordion mobile">
              <summary>
                {currentTabLabel}
                <span className="chev" aria-hidden>▾</span>
              </summary>
              <div className="sheet">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    className={`my-tab ${tab === t.key ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = e.currentTarget.closest("details");
                      if (el) el.removeAttribute("open");
                      setTab(t.key);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </aside>

        <main className="my-content">
          {!!msg && <div className="my-toast">{msg}</div>}
          {loading ? (
            <div className="my-skel">불러오는 중…</div>
          ) : (
            <>
              {tab === "profile" && (
                <section className="my-card">
                  <h2>프로필</h2>
                  <div className="my-form mp-grid">
                    <label>아이디<input value={me.loginId || ""} disabled /></label>
                    <label>이메일<input value={me.email || ""} disabled /></label>
                    <label>이름<input value={me.name || ""} disabled /></label>
                    <label>휴대폰<input value={me.phone || ""} disabled /></label>
                    <label>가입일<input value={fmtDateOnly(me.createdAt)} disabled /></label>
                    <label className="full">기본주소<input value={me.address1 || ""} disabled /></label>
                    <label className="full">상세주소<input value={me.address2 || ""} disabled /></label>
                  </div>
                </section>
              )}

              {tab === "account" && (
                <section className="my-card">
                  <h2>내 정보 수정 (비밀번호)</h2>

                  <form className="my-form" onSubmit={saveAccount} noValidate>
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      value={me.loginId || ""}
                      hidden
                      readOnly
                    />

                    <div className="mp-grid onecol">
                      <label>
                        현재 비밀번호
                        <input
                          ref={pwdCurrentRef}
                          type="password"
                          value={pwd.current}
                          onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                          autoComplete="current-password"
                        />
                        {errs.current && <small className="form-error">{errs.current}</small>}
                      </label>

                      <label>
                        새 비밀번호
                        <input
                          ref={pwdNextRef}
                          type="password"
                          value={pwd.next}
                          onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                          placeholder="8자 이상, 대문자·특수문자 포함"
                          autoComplete="new-password"
                        />
                        {errs.next && <small className="form-error">{errs.next}</small>}
                      </label>

                      <label>
                        새 비밀번호 확인
                        <input
                          ref={pwdConfirmRef}
                          type="password"
                          value={pwd.confirm}
                          onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                          autoComplete="new-password"
                        />
                        {errs.confirm && <small className="form-error">{errs.confirm}</small>}
                      </label>
                    </div>

                    <div className="btn-row">
                      <button className="btn primary" disabled={pwdSaving}>
                        {pwdSaving ? "저장 중…" : "변경사항 저장"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {tab === "addresses" && (
                <Suspense fallback={<div className="my-skel">배송지 로딩…</div>}>
                  <AddressesTab seed={me} />
                </Suspense>
              )}

              {tab === "orders" && (
                <OrderHistoryPage
                  onInquiry={(info) => {
                    const q = new URLSearchParams({
                      orderId: info.orderId + "",
                      orderItemId: info.orderItemId + "",
                      productId: info.productId + "",
                    }).toString();
                    navigate(`${SUPPORT_INQUIRY_PATH}?${q}`);
                  }}
                  onReviewWrite={(info) => {
                    setDraftReview({
                      orderId: info.orderId,
                      productId: info.productId,
                      orderItemId: info.orderItemId,
                      productName: info.productName,
                      option: info.option,
                      thumbnail: info.thumbnail,
                      rating: 5,
                      content: "",
                    });
                    setTab("reviews");
                  }}
                />
              )}

              {tab === "reviews" && (
               <ReviewProvider>
                  <section className="review-container">
                    {!showForm ? (
                      <MyReviewPage
                        draftReview={draftReview}
                        onWriteReview={(productInfo) => {
                          setDraftReview(productInfo);
                          setShowForm(true);
                        }}
                      />
                    ) : (
                      <div className="review-form-wrapper">
                        <button
                          className="btn-back"
                          onClick={() => setShowForm(false)}
                          style={{
                            marginBottom: "16px",
                            background: "none",
                            border: "none",
                            color: "#333",
                            cursor: "pointer",
                          }}
                        >
                          ← 작성 가능한 후기 목록으로
                        </button>
                        <ReviewForm
                          product={draftReview}
                          defaultRating={draftReview.rating}
                          defaultContent={draftReview.content}
                          onSubmit={async (formData) => {
                            try {
                              const res = await http.post("/api/reviews", formData);
                              addWritten?.(res.data);
                              removeWritable?.(draftReview.productId);
                              setShowForm(false);
                            } catch (err) {
                              console.error(err);
                              alert("리뷰 등록 중 오류 발생");
                            }
                          }}
                        />
                      </div>
                    )}
                  </section>
                </ReviewProvider>
              )}

              {tab === "qna" && <QnA />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
