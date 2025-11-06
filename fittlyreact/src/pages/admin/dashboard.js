import React from "react";
import { getAuth } from "../../lib/jwt";

export default function Dashboard() {
  const { loginId, role } = getAuth();
  return (
    <div style={{ padding: 24 }}>
      <h2>관리자 대시보드</h2>
      <p>{loginId} ({role})</p>
      <p>여기에 관리자 기능 메뉴를 붙이면 된다.</p>
    </div>
  );
}
