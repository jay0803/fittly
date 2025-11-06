import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { http } from "../../lib/http";

export default function VerifyCode() {
  const nav = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  const [code, setCode] = useState("");
  const [left, setLeft] = useState(0);
  const [cool, setCool] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!email) { nav("/auth/signup"); return; }
    (async () => {
      try {
        const data = await http.post("/auth/verify-email/send-otp", { email });
        setLeft(data.expiresSec ?? 600); setCool(data.cooldownSec ?? 60);
        setMsg("인증번호를 이메일로 보냈어요.");
      } catch {
        setMsg("인증번호 발송에 실패했습니다.");
      }
    })();
  }, [email, nav]);

  useEffect(() => { if (left>0) { const t=setInterval(()=>setLeft(s=>Math.max(0,s-1)),1000); return()=>clearInterval(t);} }, [left]);
  useEffect(() => { if (cool>0) { const t=setInterval(()=>setCool(s=>Math.max(0,s-1)),1000); return()=>clearInterval(t);} }, [cool]);

  const resend = async () => {
    if (cool>0) return;
    try {
      const data = await http.post("/auth/verify-email/send-otp", { email });
      setLeft(data.expiresSec ?? 600); setCool(data.cooldownSec ?? 60);
      setMsg("인증번호를 다시 보냈어요.");
    } catch { setMsg("재발송에 실패했습니다."); }
  };

  const submit = async () => {
    if (code.length!==6) { setMsg("6자리 입력하세요."); return; }
    try {
      const data = await http.post("/auth/verify-email/verify-otp", { email, code });
      if (data.ok) { setMsg("인증 완료!"); nav("/auth/verified", { replace:true }); }
      else setMsg("인증 실패");
    } catch { setMsg("인증 실패"); }
  };

  const mm = String(Math.floor(left/60)).padStart(2,"0"), ss=String(left%60).padStart(2,"0");

  return (
    <div className="panel">
      <h2>이메일 인증</h2>
      <p>{email}로 전송된 코드를 입력하세요.</p>
      <div><input value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} /><button onClick={submit}>확인</button></div>
      <div>유효시간: {mm}:{ss}</div>
      <div><button disabled={cool>0} onClick={resend}>{cool>0?`재전송 (${cool}s)`:"재전송"}</button></div>
      <p>{msg}</p>
    </div>
  );
}
