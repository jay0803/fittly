import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/signup.css";
import TermsCard from "../../components/TermsCard";
import AddressSearchButton from "../../components/AddressSearchButton";
import { signup, sendSignupEmailCode, verifySignupEmailCode } from "../../api/auth";
import { http } from "../../lib/http";

const FASHION_STYLE_OPTIONS = ["스트릿", "힙합", "어반", "캐주얼", "빈티지"];
const PRODUCT_CATEGORY_OPTIONS = ["상의","하의","아우터","신발"];
const BODY_TYPES = ["슬림","보통","근육형","통통","기타"];
const HAIR_PRESETS = ["숏","미디엄","롱","펌","스트레이트","기타"];
const STYLE_KR2CODE = { "스트릿":"STREET","힙합":"HIPHOP","어반":"URBAN","캐주얼":"CASUAL","빈티지":"VINTAGE" };
const CAT_KR2CODE   = { "상의":"TOP","하의":"BOTTOM","아우터":"OUTER","신발":"SHOES" };
const BODY_KR2CODE  = { "슬림":"SLIM","보통":"NORMAL","근육형":"MUSCULAR","통통":"CHUBBY","기타":"OTHER" };

function readAnyToken() {
  try {
    const store = (window.getAuth && window.getAuth()) || {};
    return (
      store.token ||
      store.accessToken ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("adminAccessToken") ||
      sessionStorage.getItem("adminAccessToken") ||
      ""
    );
  } catch { return ""; }
}
function pickTokenFromLoginResp(resp) {
  const r = resp || {};
  return (
    r.token || r.accessToken ||
    r.data?.token || r.data?.accessToken ||
    r.data?.data?.token || r.data?.data?.accessToken ||
    ""
  );
}
async function apiPostJSON(url, body, { auth = true } = {}) {
  const full = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = readAnyToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(full, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : res.text();
}

async function uploadUserPhotosDirect(files) {
  if (!files?.length) return null;
  const fd = new FormData();
  files.forEach((f, i) => fd.append("photos", f, f.name || `photo_${i}.jpg`));
  const token = readAnyToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch("/api/user/photos", {
    method: "POST",
    credentials: "include",
    headers,
    body: fd,
  });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return { ok:true }; }
}

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    loginId:"", name:"", email:"", phone:"",
    password:"", password2:"",
    zipcode:"", address1:"", address2:"",
    fashionStyles:[], preferredCategories:[],
    heightCm:"", weightKg:"",
    bodyType:"", hairstyle:"", hairstylePreset:""
  });

  const [photos, setPhotos] = useState([]);
  const previews = useMemo(() => photos.map(f => URL.createObjectURL(f)), [photos]);
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const toggleStyle = (style) => {
    setForm(f => {
      const set = new Set(f.fashionStyles);
      if (set.has(style)) set.delete(style);
      else { if (set.size >= 5) return f; set.add(style); }
      return { ...f, fashionStyles: Array.from(set) };
    });
  };
  const toggleCategory = (cat) => {
    setForm(f => {
      const set = new Set(f.preferredCategories);
      if (set.has(cat)) set.delete(cat); else set.add(cat);
      return { ...f, preferredCategories: Array.from(set) };
    });
  };

  useEffect(() => {
    if (!form.hairstylePreset || form.hairstylePreset === "기타") return;
    setForm(f => ({ ...f, hairstyle: f.hairstylePreset }));
  }, [form.hairstylePreset]);

  const [showTerms, setShowTerms] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  const handleAddressSelected = ({ zonecode, address1 }) => {
    setForm(f => ({ ...f, zipcode: zonecode, address1 }));
  };
  const [emailCode, setEmailCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  useEffect(() => {
    if (!emailSent || emailCooldown <= 0) return;
    const t = setInterval(() => {
      setEmailCooldown(s => (s <= 1 ? (clearInterval(t), 0) : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [emailSent, emailCooldown]);

  const idOk      = useMemo(() => /^[a-zA-Z0-9_]{4,20}$/.test(form.loginId), [form.loginId]);
  const emailOk   = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), [form.email]);
  const pwLenOk   = useMemo(() => form.password.length >= 8, [form.password]);
  const pwUpper   = useMemo(() => /[A-Z]/.test(form.password), [form.password]);
  const pwLower   = useMemo(() => /[a-z]/.test(form.password), [form.password]);
  const pwDigit   = useMemo(() => /\d/.test(form.password), [form.password]);
  const pwSpecial = useMemo(() => /[^A-Za-z0-9]/.test(form.password), [form.password]);
  const pwOk      = pwLenOk && pwUpper && pwLower && pwDigit && pwSpecial;
  const pwMatch   = useMemo(() => form.password && form.password === form.password2, [form.password, form.password2]);
  const nameOk    = useMemo(() => form.name.trim().length >= 2, [form.name]);
  const phoneOk   = useMemo(() => /^[0-9\-+]{9,20}$/.test(form.phone), [form.phone]);
  const [dup, setDup] = useState({
    loginId: { checking:false, exists:false, supported:true },
    email:   { checking:false, exists:false, supported:true },
  });
  const debounceRef = useRef({ id:null, email:null });
  const existsAbortRef = useRef({ id:null, email:null });

  async function checkExists({ loginId, email }) {
    const params = {};
    const updatingId = typeof loginId === "string";
    const updatingEmail = typeof email === "string";
    if (updatingId) params.loginId = loginId.trim();
    if (updatingEmail) params.email = email.trim().toLowerCase();
    if (!updatingId && !updatingEmail) return;

    try {
      if (updatingId && existsAbortRef.current.id) existsAbortRef.current.id.abort();
      if (updatingEmail && existsAbortRef.current.email) existsAbortRef.current.email.abort();
    } catch {}

    const controller = new AbortController();
    if (updatingId) existsAbortRef.current.id = controller;
    if (updatingEmail) existsAbortRef.current.email = controller;

    try {
      const res = await http.get("/auth/exists", { params, signal: controller.signal });
      const raw = res ?? {};
      const idExists = (raw.loginId ?? raw.loginIdExists ?? raw.idExists ?? raw.id) ?? false;
      const emailExists = (raw.email ?? raw.emailExists ?? raw.exists ?? raw.emailTaken) ?? false;
      setDup(prev => ({
        loginId: updatingId   ? { ...prev.loginId, checking:false, exists:!!idExists, supported:true } : prev.loginId,
        email:   updatingEmail? { ...prev.email,   checking:false, exists:!!emailExists, supported:true } : prev.email,
      }));
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      const s = err?.response?.status;
      if (s === 404 || s === 405) {
        setDup(prev => ({
          loginId: updatingId   ? { ...prev.loginId, checking:false, supported:false } : prev.loginId,
          email:   updatingEmail? { ...prev.email,   checking:false, supported:false }   : prev.email,
        }));
      } else {
        setDup(prev => ({
          loginId: updatingId   ? { ...prev.loginId, checking:false } : prev.loginId,
          email:   updatingEmail? { ...prev.email,   checking:false } : prev.email,
        }));
      }
    }
  }

  useEffect(() => {
    if (!form.loginId || !idOk) {
      setDup(d => ({ ...d, loginId: { ...d.loginId, exists:false } }));
      return;
    }
    setDup(d => ({ ...d, loginId: { ...d.loginId, checking:true } }));
    clearTimeout(debounceRef.current.id);
    debounceRef.current.id = setTimeout(() => { checkExists({ loginId: form.loginId }); }, 350);
    return () => clearTimeout(debounceRef.current.id);
  }, [form.loginId, idOk]);

  useEffect(() => {
    setEmailSent(false); setEmailVerified(false); setEmailCode("");
    if (!form.email || !emailOk) {
      setDup(d => ({ ...d, email: { ...d.email, exists:false } }));
      return;
    }
    setDup(d => ({ ...d, email: { ...d.email, checking:true } }));
    clearTimeout(debounceRef.current.email);
    debounceRef.current.email = setTimeout(() => { checkExists({ email: form.email }); }, 350);
    return () => clearTimeout(debounceRef.current.email);
  }, [form.email, emailOk]);

  const validate = () => {
    if (!idOk) return "아이디: 영문/숫자/언더스코어 4~20자";
    if (dup.loginId.exists) return "이미 사용 중인 아이디입니다.";
    if (!nameOk) return "이름을 2자 이상 입력하세요.";
    if (!emailOk) return "올바른 이메일 주소를 입력하세요.";
    if (dup.email.exists) return "이미 사용 중인 이메일입니다.";
    if (!emailVerified) return "이메일 인증을 완료해 주세요.";
    if (!phoneOk) return "연락처 형식이 올바르지 않습니다.";
    if (!pwOk) return "비밀번호: 8자 이상, 대/소문자, 숫자, 특수문자 각 1개 이상 포함";
    if (!pwMatch) return "비밀번호가 일치하지 않습니다.";
    if (!termsAgreed) return "회원가입을 진행하려면 약관에 동의해야 합니다.";
    return "";
  };

  const doSubmit = async () => {
    const err = validate();
    if (err) { setServerMsg(err); return; }

    const heightNum = Number.parseInt(form.heightCm, 10);
    const weightNum = Number.parseInt(form.weightKg, 10);
    const styleCodes = (form.fashionStyles || []).map(s => STYLE_KR2CODE[s] || s);
    const catCodes   = (form.preferredCategories || []).map(c => CAT_KR2CODE[c] || c);

    const payload = {
      loginId: form.loginId.trim(),
      password: form.password,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      zipcode: form.zipcode.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim(),
      marketingAgreed,
      fashionStyles: styleCodes,
      preferredCategories: catCodes,
      heightCm: Number.isFinite(heightNum) ? heightNum : null,
      weightKg: Number.isFinite(weightNum) ? weightNum : null,
      bodyType: form.bodyType || null,
      hairstyle: (form.hairstyle || form.hairstylePreset || "").trim() || null,
      hairstylePreset: form.hairstylePreset || null,
    };

    setSubmitting(true);
    setServerMsg("");
    try {
      const res = await signup(payload);
      const ok = res?.ok ?? true;
      if (!ok) throw new Error(res?.reason || "가입 실패");

      try {
        const lr = await http.post("/auth/user/login", { loginId: form.loginId.trim(), password: form.password });
        const token = pickTokenFromLoginResp(lr);
        if (token) {
          localStorage.setItem("accessToken", token);
          sessionStorage.setItem("accessToken", token);
        }
      } catch (e) {
        console.warn("temp login (token optional):", e?.message || e);
      }

      let photosUploaded = false;
      try {
        if (photos.length > 0) {
          const resp = await uploadUserPhotosDirect(photos);
          photosUploaded = !!resp;
        }
      } catch (e) {
        console.warn("user photos upload failed", e);
      }

      try {
        sessionStorage.setItem("preferredStyles", JSON.stringify(styleCodes));
        sessionStorage.setItem("preferredCategories", JSON.stringify(catCodes));
      } catch {}

      const stateObj = {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        preferredStyles: styleCodes,
        preferredCategories: catCodes,
        bodyType: BODY_KR2CODE[form.bodyType] || null,
        files: photos,
        photosUploaded,
      };
      nav("/auth/signup-complete?email=" + encodeURIComponent(form.email), { state: stateObj });
    } catch (e2) {
      const status = e2?.response?.status;
      const code = e2?.response?.data?.code || e2?.response?.data?.message;
      if (status === 409 && code === "duplicate_email") {
        setDup(d => ({ ...d, email: { ...d.email, exists:true } }));
        setServerMsg("이미 등록된 이메일입니다.");
      } else if (status === 409 && code === "duplicate_loginId") {
        setDup(d => ({ ...d, loginId: { ...d.loginId, exists:true } }));
        setServerMsg("이미 사용 중인 아이디입니다.");
      } else {
        setServerMsg(e2?.response?.data?.message || e2?.message || "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!termsAgreed) {
      setServerMsg("회원가입을 진행하려면 약관에 동의하세요.");
      setPendingSubmit(true);
      setShowTerms(true);
      return;
    }
    await doSubmit();
  };

  const handleTermsAgree = (requiredOk, marketingOk) => {
    setTermsAgreed(!!requiredOk);
    setMarketingAgreed(!!marketingOk);
    setShowTerms(false);
    if (pendingSubmit && requiredOk) { setPendingSubmit(false); doSubmit(); }
  };

  return (
    <div className="signup-page" style={{ '--signup-bg': "url('/images/loginbackground.jpg')" }}>
      <div className="signup-card">
        <h2 className="signup-title">SIGN UP</h2>

        <form className="signup-form" onSubmit={onSubmit} noValidate>
          <label className="label">ID</label>
          <input
            name="loginId"
            className={`input ${form.loginId ? (idOk && !dup.loginId.exists ? "valid" : "invalid") : ""}`}
            value={form.loginId}
            onChange={onChange}
            placeholder="아이디 (영문/숫자/_) 4~20자"
            autoComplete="username"
          />
          <p className="field-hint">
            {!form.loginId ? "영문/숫자/언더스코어만 4~20자"
              : !idOk ? "형식이 올바르지 않습니다."
              : dup.loginId.checking ? "아이디 중복 확인 중..."
              : dup.loginId.exists ? "이미 사용 중인 아이디입니다."
              : "사용 가능한 아이디입니다."}
          </p>

          <label className="label">이름</label>
          <input
            name="name"
            className={`input ${form.name ? (nameOk ? "valid" : "invalid") : ""}`}
            value={form.name}
            onChange={onChange}
            placeholder="이름"
            autoComplete="name"
          />

          <label className="label">EMAIL</label>
          <div className="signup-email-row">
            <input
              name="email"
              className={`input ${form.email ? (emailOk && !dup.email.exists ? "valid" : "invalid") : ""}`}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              disabled={emailVerified}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn-ghost send-btn"
              onClick={async () => {
                if (!emailOk) return setServerMsg("올바른 이메일을 입력하세요.");
                if (dup.email.exists) return setServerMsg("이미 등록된 이메일입니다.");
                setServerMsg("");
                try {
                  setEmailBusy(true);
                  const res = await sendSignupEmailCode(form.email.trim());
                  console.log("메일 발송 응답:", res);
                  setEmailSent(true);
                  setEmailVerified(false);
                  setEmailCooldown(60);
                  setServerMsg("인증코드를 이메일로 보냈습니다. (10분 유효)");
                } catch (e) {
                  console.error("메일 발송 에러:", e?.response?.status, e?.response?.data, e?.message);
                  const status = e?.response?.status;
                  const code = e?.response?.data?.code || e?.response?.data?.message;
                  if (status === 409 && code === "duplicate_email") {
                    setDup(d => ({ ...d, email: { ...d.email, exists:true } }));
                    setServerMsg("이미 등록된 이메일입니다.");
                  } else {
                    setServerMsg(e?.response?.data?.message || e?.message || "인증코드 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
                  }
                } finally {
                  setEmailBusy(false);
                }
              }}
              disabled={emailBusy || !emailOk || emailVerified || emailCooldown > 0 || dup.email.exists}
            >
              {emailBusy ? "발송 중..." : emailVerified ? "인증 완료" : emailCooldown > 0 ? `재전송(${emailCooldown}s)` : emailSent ? "재전송" : "인증코드 보내기"}
            </button>
          </div>
          <p className="field-hint">
            {!form.email ? "올바른 이메일 주소를 입력하세요."
              : !emailOk ? "형식이 올바르지 않습니다."
              : dup.email.checking ? "이메일 중복 확인 중..."
              : dup.email.exists ? "이미 사용 중인 이메일입니다."
              : emailVerified ? "이메일 인증이 완료되었습니다."
              : "형식이 올바릅니다. 인증코드를 받아 인증을 완료하세요."}
          </p>

          <div className="signup-otp-row">
            <input
              name="emailCode"
              className="input otp-input"
              value={emailCode}
              onChange={e => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="인증코드 6자리"
              inputMode="numeric"
              disabled={!emailSent || emailVerified}
              aria-label="이메일로 받은 인증코드"
            />
            <button
              type="button"
              className="btn-primary otp-btn"
              onClick={async () => {
                if (!emailSent) return setServerMsg("먼저 인증코드를 받아주세요.");
                if (!emailCode || emailCode.length !== 6) return setServerMsg("6자리 인증코드를 입력하세요.");
                setServerMsg("");
                try {
                  setEmailBusy(true);
                  const res = await verifySignupEmailCode({ email: form.email.trim(), code: emailCode.trim() });
                  if (res?.ok === false) throw new Error(res?.message || "인증 실패");
                  setEmailVerified(true);
                  setServerMsg("이메일 인증이 완료되었습니다.");
                } catch (e) {
                  setServerMsg(e?.response?.data?.message || e?.message || "인증에 실패했습니다.");
                } finally {
                  setEmailBusy(false);
                }
              }}
              disabled={!emailSent || emailVerified || emailBusy || emailCode.length !== 6}
            >
              {emailVerified ? "인증 완료" : "인증 확인"}
            </button>
          </div>

          <label className="label">연락처</label>
          <input
            name="phone"
            className={`input ${form.phone ? (phoneOk ? "valid" : "invalid") : ""}`}
            value={form.phone}
            onChange={onChange}
            placeholder="010-1234-5678"
            autoComplete="tel"
          />

          <label className="label">PW</label>
          <input
            name="password"
            className={`input ${form.password ? (pwOk ? "valid" : "invalid") : ""}`}
            value={form.password}
            onChange={onChange}
            placeholder="비밀번호"
            type="password"
            autoComplete="new-password"
          />
          <ul className="pw-rules">
            <li className={pwLenOk ? "ok" : ""}>8자 이상</li>
            <li className={pwUpper ? "ok" : ""}>영문 대문자 1자 이상</li>
            <li className={pwLower ? "ok" : ""}>영문 소문자 1자 이상</li>
            <li className={pwDigit ? "ok" : ""}>숫자 1자 이상</li>
            <li className={pwSpecial ? "ok" : ""}>특수문자 1자 이상</li>
          </ul>

          <label className="label">PW 확인</label>
          <input
            name="password2"
            className={`input ${form.password2 ? (pwMatch ? "valid" : "invalid") : ""}`}
            value={form.password2}
            onChange={onChange}
            placeholder="비밀번호 확인"
            type="password"
            autoComplete="new-password"
          />
          <p className="field-hint">
            {form.password2 ? (pwMatch ? "비밀번호가 일치합니다." : "일치하지 않습니다.") : "비밀번호를 한 번 더 입력하세요."}
          </p>

          <div className="row" style={{ marginTop: 12 }}>
            <label className="label">우편번호</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="zipcode"
                className="input"
                style={{ flex: "0 0 140px" }}
                value={form.zipcode}
                onChange={onChange}
                placeholder="우편번호"
                inputMode="numeric"
              />
              <AddressSearchButton className="sc-btn sc-btn-outline zip-btn" onSelected={handleAddressSelected} />
            </div>
          </div>

          <label className="label">주소</label>
          <input name="address1" className="input" value={form.address1} onChange={onChange} placeholder="도로명/지번 주소" />

          <label className="label">상세주소</label>
          <input name="address2" className="input" value={form.address2} onChange={onChange} placeholder="상세주소" />

          <h3 className="section-title" style={{ marginTop: 24 }}>
            선호 패션 스타일 <small>(최대 5개)</small>
          </h3>
          <div className="chips-grid">
            {FASHION_STYLE_OPTIONS.map(s => {
              const checked = form.fashionStyles.includes(s);
              const disabled = !checked && form.fashionStyles.length >= 5;
              return (
                <label key={s} className={`chip ${checked ? "chip-on" : ""} ${disabled ? "chip-disabled" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleStyle(s)} disabled={disabled} />
                  <span>{s}</span>
                </label>
              );
            })}
          </div>
          <p className="field-hint">선택 {form.fashionStyles.length}/5</p>

          <h3 className="section-title" style={{ marginTop: 16 }}>홈 노출 희망 상품 카테고리</h3>
          <div className="chips-grid">
            {PRODUCT_CATEGORY_OPTIONS.map(c => {
              const checked = form.preferredCategories.includes(c);
              return (
                <label key={c} className={`chip ${checked ? "chip-on" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleCategory(c)} />
                  <span>{c}</span>
                </label>
              );
            })}
          </div>
          <p className="field-hint">
            {form.preferredCategories.length ? `선택: ${form.preferredCategories.join(", ")}` : "선택하지 않아도 가입이 가능합니다."
            }
          </p>

          <h3 className="section-title" style={{ marginTop: 16 }}>개인 신체 정보 (선택)</h3>
          <div className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label className="label">키(cm)</label>
              <input
                name="heightCm" className="input" value={form.heightCm}
                onChange={e => setForm(f => ({ ...f, heightCm: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                inputMode="numeric" placeholder="예) 175"
              />
            </div>
            <div>
              <label className="label">체중(kg)</label>
              <input
                name="weightKg" className="input" value={form.weightKg}
                onChange={e => setForm(f => ({ ...f, weightKg: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                inputMode="numeric" placeholder="예) 70"
              />
            </div>
          </div>

          <div className="row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8, marginTop: 8 }}>
            <div>
              <label className="label">체형</label>
              <select name="bodyType" className="input" value={form.bodyType} onChange={onChange}>
                <option value="">선택 안 함</option>
                {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">헤어스타일</label>
              <div style={{ display:"flex", gap: 8 }}>
                <select name="hairstylePreset" className="input" style={{ flex:1 }} value={form.hairstylePreset} onChange={onChange}>
                  <option value="">프리셋 선택</option>
                  {HAIR_PRESETS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input name="hairstyle" className="input" style={{ flex:1 }} value={form.hairstyle} onChange={onChange} placeholder="예) 투블럭, 아이비리그 컷 등" />
              </div>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: 16 }}>스타일 분석용 사진 업로드 (최대 3장, 선택)</h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 3))}
          />
          {previews.length > 0 && (
            <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
              {previews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`preview${idx}`}
                  style={{ width:96, height:96, objectFit:"cover", borderRadius:8, border:"1px solid #eee" }}
                />
              ))}
            </div>
          )}

          <div className="terms-row">
            <span className={`terms-badge ${termsAgreed ? "ok" : ""}`}>{termsAgreed ? "약관 동의 완료" : "약관 미동의"}</span>
            <button type="button" className="btn-ghost" onClick={() => setShowTerms(true)}>약관 보기</button>
          </div>

          {serverMsg && <p className={`msg ${serverMsg.includes("완료") ? "ok" : "error"}`}>{serverMsg}</p>}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "처리 중..." : "회원가입"}
          </button>
        </form>
      </div>

      {showTerms && (
        <TermsCard
          open={showTerms}
          onClose={() => setShowTerms(false)}
          onAgree={handleTermsAgree}
          defaultRequired={false}
          defaultMarketing={false}
        />
      )}
    </div>
  );
}
