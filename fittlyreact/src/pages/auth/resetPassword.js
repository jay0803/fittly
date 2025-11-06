import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyResetToken, resetPassword } from "../../api/auth";
import "../../css/find.css";

export default function ResetPassword() {
  const nav = useNavigate();
  const { search } = useLocation();
  const token = useMemo(
    () => new URLSearchParams(search).get("token") || "",
    [search]
  );

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const validatePw = (pw) => {
    const okLen = pw.length >= 8 && pw.length <= 32;
    const hasNum = /\d/.test(pw);
    const hasEng = /[A-Za-z]/.test(pw);
    const hasSpc = /[^A-Za-z0-9]/.test(pw);
    if (!okLen) return "비밀번호는 8~32자로 설정해 주세요.";
    if (!(hasNum && hasEng && hasSpc))
      return "영문/숫자/특수문자를 각각 1자 이상 포함해 주세요.";
    return "";
  };

  useEffect(() => {
    (async () => {
      setChecking(true);
      setError("");
      setMsg("");
      setTokenValid(false);

      if (!token) {
        setError("토큰이 없습니다. 메일에서 링크를 다시 열어주세요.");
        setChecking(false);
        return;
      }

      try {
        const data = await verifyResetToken(token);
        const valid = Boolean(data?.valid);
        setTokenValid(valid);
        if (!valid) {
          setError("유효하지 않거나 만료된 링크입니다. 다시 요청해 주세요.");
        }
      } catch {
        setError("링크 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!token) return setError("토큰이 없습니다.");
    if (!tokenValid) return setError("유효하지 않거나 만료된 링크입니다.");

    const v = validatePw(pw1);
    if (v) return setError(v);
    if (pw1 !== pw2) return setError("비밀번호가 서로 일치하지 않습니다.");

    try {
      setLoading(true);
      const data = await resetPassword({ token, newPassword: pw1 });
      if (data?.ok) {
        setMsg("비밀번호가 재설정되었습니다. 로그인 페이지로 이동합니다...");
        setTimeout(() => nav("/login/user"), 1200);
      } else {
        setError(data?.reason || data?.message || "재설정에 실패했습니다.");
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.reason || err?.response?.data?.message;
      setError(serverMsg || "처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-find-wrap">
        <div className="auth-find-card">
          <div className="find-header">새 비밀번호 설정</div>
          <div className="find-body">
            <p>링크 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-find-wrap">
      <div className="auth-find-card">
        <div className="find-header">새 비밀번호 설정</div>
        <div className="find-body">
          <form className="find-form" onSubmit={onSubmit} noValidate>
            <label htmlFor="pw1">새 비밀번호</label>
            <input
              id="pw1"
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="영문/숫자/특수문자 포함 8~32자"
              autoComplete="new-password"
              disabled={loading || !tokenValid}
            />

            <label htmlFor="pw2">새 비밀번호 확인</label>
            <input
              id="pw2"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="다시 입력"
              autoComplete="new-password"
              disabled={loading || !tokenValid}
            />

            {error && <div className="find-msg error">{error}</div>}
            {msg && <div className="find-msg ok">{msg}</div>}

            <div className="find-actions">
              <button className="btn-primary" disabled={loading || !tokenValid}>
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        </div>

        <div className="find-footer">
          <button className="btn-outline" onClick={() => nav("/login/user")}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
