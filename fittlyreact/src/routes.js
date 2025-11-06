import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AiVisionPage from "./pages/ai/AiVisionPage";

const hasAuth = () => {
  try {
    return ["accessToken", "jwt", "token"].some(
      (k) => localStorage.getItem(k) || sessionStorage.getItem(k)
    );
  } catch {
    return false;
  }
};

function RequireAuth({ children }) {
  const location = useLocation();
  if (!hasAuth()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo: location.pathname + location.search }}
      />
    );
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route
        path="/ai/vision"
        element={
          <RequireAuth>
            <AiVisionPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
