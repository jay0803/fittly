import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../css/find.css";
import { http } from "../../lib/http";

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FindId() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [ids, setIds] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const emailOk = useMemo(() => EMAIL_RULE.test(email.trim()), [email]);

  const maskId = (raw) => {
    const s = String(raw || "");
    if (s.length <= 3) return s.replace(/./g, "*");
    return s.slice(0, 3) + "*".repeat(s.length - 3);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setIds([]);

    if (!nameOk) return setErr("이름을 2자 이상 입력하세요.");
    if (!emailOk) return setErr("올바른 이메일 주소를 입력하세요.");

    try {
      setLoading(true);
      const data = await http.post("/auth/find-id/lookup", {
        name: name.trim(),
        email: email.trim(),
      });

      const arr = Array.isArray(data.ids) ? data.ids : (data.loginIds || []);
      setIds(arr);
      setMsg(arr?.length ? "가입하신 아이디를 확인했습니다." : "해당 정보로 가입된 계정을 찾지 못했습니다.");
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.message || "아이디 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-find-wrap">
      <div className="auth-find-card">
        <div className="find-header">아이디 찾기</div>
        <div className="find-body">
          <form className="find-form" onSubmit={onSubmit} noValidate>
            <label htmlFor="name">이름</label>
            <input
              id="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(""); setMsg(""); }}
              placeholder="이름"
              disabled={loading}
            />
            <label htmlFor="email">가입 이메일</label>
            <input
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErr(""); setMsg(""); }}
              placeholder="you@example.com"
              disabled={loading}
            />
            {err && <div className="find-msg error">{err}</div>}
            {msg && <div className="find-msg ok">{msg}</div>}
            <div className="find-actions">
              <button className="btn-primary" disabled={loading || !nameOk || !emailOk}>
                {loading ? "조회 중..." : "아이디 조회"}
              </button>
            </div>
          </form>
          {ids?.length > 0 && (
            <div className="find-result" style={{ marginTop: 12 }}>
              <div className="find-msg ok" style={{ marginBottom: 8 }}>가입하신 아이디</div>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {ids.map((id, i) => <li key={i}>{maskId(id)}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="find-footer">
          <Link to="/login/user" className="btn-outline">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
