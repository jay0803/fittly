import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth({ role, children }) {
  const { isInitialized, auth } = useAuth();
  const location = useLocation();
  const shownRef = useRef(false);
  const ALERT_KEY = "__login_alert_stamp__";

  useEffect(() => {
    if (!isInitialized) return;

    if (!auth?.token && !shownRef.current) {
      shownRef.current = true;
      const now = Date.now();
      const prev = Number(sessionStorage.getItem(ALERT_KEY) || 0);
      console.log("prev3535::: ",prev);
      if (!prev || now - prev > 800) {
        sessionStorage.setItem(ALERT_KEY, String(now));
        window.alert("로그인이 필요한 서비스입니다.");
      }
    }
  }, [isInitialized, auth?.token]);

  if (!isInitialized) return null;

  if (!auth?.token) {
    return (
      <Navigate
        to="/login/user"
        replace
        state={{
          from: location,
          redirectTo: location.pathname + location.search,
        }}
      />
    );
  }

  const required = Array.isArray(role) ? role : role ? [role] : [];
  if (required.length && !required.includes(auth.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
