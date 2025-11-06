import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { setAuth } from "../../lib/jwt";
import "../../css/login.css";
import "../../css/auth.css";
import { http } from "../../lib/http";

export default function LoginAdmin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErr("");
    setSubmitting(true);

    try {
      const res = await http.post("/auth/admin/login", { loginId, password });
      const body = res?.data ?? res;
      const ok = body?.success ?? body?.ok ?? true;
      if (!ok) throw new Error(body?.message || "로그인 실패");
      const payload = body?.data ?? body;

      if (payload?.role !== "ROLE_ADMIN") {
        setErr("관리자 전용 로그인입니다.");
        return;
      }

      const token = payload?.token || payload?.accessToken || payload?.jwt;
      if (!token) throw new Error("토큰이 응답에 없습니다.");
      setAuth({ token, role: "ROLE_ADMIN", loginId: payload?.loginId || loginId });

      const to = location.state?.from?.pathname || "/";
      nav(to, { replace: true, state: { justLoggedIn: true } });
      } catch (e) {
      const resData = e.response?.data;
      const code = resData?.code;
      const message = resData?.message?.toLowerCase?.() || "";
      let msg = "로그인 실패";

      if (code === "invalid_credentials" || message.includes("unauthorized")) {
        msg = "아이디 또는 비밀번호가 잘못되었습니다.";
      } else if (code === "not_admin") {
        msg = "관리자 전용 로그인입니다.";
      } else if (code === "not_user") {
        msg = "회원 전용 로그인입니다.";
      } else if (code === "forbidden" || message.includes("forbidden")) {
        msg = "접근 권한이 없습니다.";
      }

      setErr(msg);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-login-wrap"
      style={{
        backgroundImage: "url('/images/loginbackground.jpg')",
        backgroundSize: "cover",
      }}
    >
      <div>
        <Link to="/">
          <img src="/images/logo.png" alt="Fittly Logo" className="login-logo" />
        </Link>

        <div className="auth-login-card">
          <h2>ADMIN LOGIN</h2>

          <form onSubmit={onSubmit}>
            <label>ID</label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />

            <label>PW</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "로그인 중..." : "로그인"}
            </button>

            <div className="auth-login-switch">
              <Link to="/login/user" className="btn-link">
                회원 로그인으로 이동
              </Link>
            </div>
          </form>

          {err && <div className="error">{err}</div>}
        </div>
      </div>
    </div>
  );
}
