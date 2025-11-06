import React from "react";
import { Link } from "react-router-dom";
import { getAuth } from "../lib/jwt";
import "../css/Footer.css";

export default function Footer() {
  const { token, role } = getAuth();

  return (
    <footer className="footer">
      <div className="container">
        <p>ⓒ 2025 FitMakers 교육용 사이트이므로 실제로 이용할 수 없습니다. <br/>
      김준경(팀장) 김대일 김경진 고동욱 정동화<br/></p>

        {!token && (
          <p style={{ marginLeft: "auto" }}>
            <Link to="/login/admin">관리자 로그인</Link>
          </p>
        )}

        {role === "ROLE_ADMIN" && (
          <p style={{ marginLeft: 12 }}>
            <Link to="/admin">관리자 페이지</Link>
          </p>
        )}
      </div>
    </footer>
  );
}
