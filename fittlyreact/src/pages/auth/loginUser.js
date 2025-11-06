import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { setAuth, isLoggedIn } from "../../lib/jwt";
import "../../css/auth.css";
import "../../css/login.css";
import { http } from "../../lib/http";

export default function LoginUser() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const idRef = useRef(null);
  const pwRef = useRef(null);

  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn()) {
      nav("/", { replace: true });
    } else {
      idRef.current?.focus();
    }
  }, [nav]);

  const showFail = (msg, focus = "pw") => {
    setErr(msg);
    alert(msg);
    (focus === "id" ? idRef : pwRef).current?.focus();
  };

  const parseLoginError = (e) => {
  const data = e?.response?.data;
  const code = data?.code;
  const message = data?.message?.toLowerCase?.() || "";

  if (code === "invalid_credentials" || message.includes("unauthorized")) {
    return "아이디 또는 비밀번호가 잘못되었습니다.";
  }
  if (code === "not_user") return "회원 전용 로그인입니다.";
  if (code === "not_admin") return "관리자 전용 로그인입니다.";
  if (code === "forbidden" || message.includes("forbidden")) {
    return "접근 권한이 없습니다.";
  }
  return data?.message || e?.message || "로그인 실패";
};

  const onSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await http.post("/auth/user/login", {
      loginId: loginId.trim(),
      password,
    });

    const body = res?.data ?? res;
    const ok = body?.success ?? body?.ok ?? true;
    if (!ok) throw new Error(body?.message || "로그인 실패");

    const payload = body?.data ?? body;
    const token = payload?.token || payload?.accessToken || payload?.jwt;
    const role  = payload?.role  || payload?.authority || "ROLE_USER";
    const resLoginId = payload?.loginId;

    if (!token) throw new Error("토큰이 응답에 없습니다.");
    if (role !== "ROLE_USER") throw new Error("회원 전용 로그인입니다.");

    setAuth(
      { token, role, loginId: resLoginId || loginId.trim() },
      { remember }
    );
    window.dispatchEvent(new Event("authChange"));

    const to =
      location.state?.from && location.state.from !== "/login/user"
        ? location.state.from
        : "/";
    nav(to, { replace: true, state: { justLoggedIn: true } });
  } catch (e1) {
    alert(parseLoginError(e1));
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="auth-login-wrap"
      style={{
        backgroundImage: "url('/images/loginbackground.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "87vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "100px",
      }}
    >
      <div>
        <Link to="/">
          <img src="/images/logo.png" alt="Fittly Logo" className="login-logo" />
        </Link>

        <div className="auth-login-card">
          <h2>LOGIN</h2>

          <form onSubmit={onSubmit}>
            <label>ID</label>
            <input
              ref={idRef}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              autoComplete="username"
            />

            <label>PW</label>
            <input
              ref={pwRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{" "}
              로그인 상태 유지
            </label>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {err && <div className="error">{err}</div>}

          <div className="auth-login-switch">
            <Link className="btn-link" to="/auth/find-id">
              아이디 찾기
            </Link>
            <span className="sep">|</span>
            <Link className="btn-link" to="/auth/find-pw">
              비밀번호 찾기
            </Link>
          </div>

          <div className="auth-login-actions">
            <Link className="btn-outline btn-compact" to="/signup">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
