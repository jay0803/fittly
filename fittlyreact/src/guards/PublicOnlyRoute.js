import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { isInitialized, auth } = useAuth();
  const location = useLocation();

  if (!isInitialized) return null;

  if (auth?.token) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }
  return children;
}
