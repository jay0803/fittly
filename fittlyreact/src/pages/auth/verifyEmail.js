import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { http } from "../../lib/http";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState("idle");
  const token = params.get("token");
  const sent = params.get("sent");
  const email = params.get("email");

  useEffect(() => {
    if (!token) { setState(sent==="1"?"sentOnly":"idle"); return; }
    setState("loading");
    (async () => {
      try {
        await http.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setState("ok");
      } catch { setState("fail"); }
    })();
  }, [token, sent]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {state==="loading" && <p>인증 처리 중...</p>}
        {state==="ok" && (<><h3>이메일 인증 완료</h3><Link to="/login/user">로그인 하러가기</Link></>)}
        {state==="fail" && (<><h3>유효하지 않은 링크</h3><Link to="/">메인으로</Link></>)}
        {state==="sentOnly" && (<><h3>인증 메일 발송</h3><p>{email} 확인해 주세요.</p></>)}
      </div>
    </div>
  );
}
