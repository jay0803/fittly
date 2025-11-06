// src/pages/auth/findPw.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  sendPwResetCode,
  verifyPwResetCode,
  confirmPwReset,
} from "../../api/auth";
import "../../css/find.css";

const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FindPw() {

  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const emailError = useMemo(() => {
    if (!email) return "";
    if (!EMAIL_RULE.test(email.trim())) return "올바른 이메일 형식이 아닙니다.";
    return "";
  }, [email]);

  const pwHint = useMemo(() => {
    if (!pw1) return "";
    if (!PW_RULE.test(pw1))
      return "8~20자, 영문/숫자/특수문자를 각각 1개 이상 포함해야 합니다.";
    if (pw2 && pw1 !== pw2) return "비밀번호가 일치하지 않습니다.";
    return "";
  }, [pw1, pw2]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!loginId.trim()) return setErr("아이디를 입력하세요.");
    if (!email.trim()) return setErr("이메일을 입력하세요.");
    if (emailError) return setErr(emailError);

    try {
      setLoading(true);
      await sendPwResetCode({ loginId: loginId.trim(), email: email.trim() });
      setSent(true);
      setMsg("인증코드를 이메일로 보냈습니다. (유효시간 10분)");
      setCooldown(60);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "요청 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!sent) return setErr("먼저 인증코드를 받아주세요.");
    if (!code || code.length !== 6) return setErr("6자리 인증코드를 입력하세요.");

    try {
      setLoading(true);
      const { token } = await verifyPwResetCode({
        loginId: loginId.trim(),
        email: email.trim(),
        code: code.trim(),
      });

      setResetToken(token || "");
      setVerified(true);
      setMsg(
        token
          ? "인증이 확인되었습니다. 새 비밀번호를 설정하세요."
          : "인증이 확인되었습니다(토큰 없음). 새 비밀번호를 설정하세요."
      );
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "인증에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!verified) return setErr("인증을 먼저 완료하세요.");
    if (!PW_RULE.test(pw1)) return setErr("비밀번호 규칙을 확인하세요.");
    if (pw1 !== pw2) return setErr("비밀번호가 일치하지 않습니다.");

    try {
      setLoading(true);

      const payload = resetToken
        ? { token: resetToken, newPassword: pw1 }
        : { loginId: loginId.trim(), email: email.trim(), code: code.trim(), newPassword: pw1 };

      await confirmPwReset(payload);

      setDone(true);
      setMsg("비밀번호가 변경되었습니다. 이제 로그인하세요.");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "변경 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-find-wrap">
      <div className="auth-find-card">
        <div className="find-header">비밀번호 찾기</div>

        <div className="find-body">
          <form className="find-form" onSubmit={handleSendCode} noValidate>
            <label htmlFor="loginId">아이디</label>
            <input
              id="loginId"
              name="loginId"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
                setErr(""); setMsg("");
              }}
              placeholder="로그인 아이디"
              disabled={loading || sent}
            />

            <label htmlFor="email">등록 이메일</label>
            <input
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr(""); setMsg("");
              }}
              placeholder="you@example.com"
              disabled={loading || sent}
            />

            {emailError && !sent && <div className="find-msg error">{emailError}</div>}

            <div className="find-actions">
              <button
                className="btn-primary"
                disabled={loading || cooldown > 0 || !!emailError || !loginId || !email || sent}
              >
                {loading
                  ? "발송 중..."
                  : sent
                  ? "발송 완료"
                  : cooldown > 0
                  ? `재전송 (${cooldown}s)`
                  : "인증코드 보내기"}
              </button>
            </div>
          </form>

          <form className="find-form" onSubmit={handleVerify} noValidate>
            <label htmlFor="code">인증코드 6자리</label>
            <input
              id="code"
              name="code"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                setErr("");
                setMsg("");
              }}
              placeholder="예: 123456"
              disabled={loading || !sent || verified}
            />
            <div className="find-actions">
              <button
                className="btn-primary"
                disabled={loading || !sent || verified || code.length !== 6}
              >
                {verified ? "인증 완료" : "인증 확인"}
              </button>
            </div>
          </form>

          <form className="find-form" onSubmit={handleConfirm} noValidate>
            <label htmlFor="pw1">새 비밀번호</label>
            <input
              id="pw1"
              name="pw1"
              type="password"
              value={pw1}
              onChange={(e) => { setPw1(e.target.value); setErr(""); setMsg(""); }}
              placeholder="영문/숫자/특수문자 포함 8~20자"
              disabled={!verified || loading || done}
            />
            <label htmlFor="pw2">새 비밀번호 확인</label>
            <input
              id="pw2"
              name="pw2"
              type="password"
              value={pw2}
              onChange={(e) => { setPw2(e.target.value); setErr(""); setMsg(""); }}
              placeholder="한 번 더 입력"
              disabled={!verified || loading || done}
            />

            {pwHint && verified && <div className="find-msg error">{pwHint}</div>}

            <div className="find-actions">
              <button
                className="btn-primary"
                disabled={!verified || loading || done || !PW_RULE.test(pw1) || pw1 !== pw2}
              >
                {done ? "변경 완료" : "비밀번호 변경"}
              </button>
            </div>
          </form>

          {err && <div className="find-msg error">{err}</div>}
          {msg && <div className="find-msg ok">{msg}</div>}
        </div>

        <div className="find-footer">
          <Link to="/login/user" className="btn-outline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
