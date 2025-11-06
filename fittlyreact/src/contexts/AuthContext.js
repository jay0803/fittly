import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  getAuth,
  clearAuth as removeAuth,
  bootstrapAuth,
  setAuth as storeAuth,
} from "../lib/jwt";
import { http, setOnUnauthorized } from "../lib/http";

export const __AUTH_CTX_FILE__ = true;

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const DEV =
  (() => {
    try {
      if (typeof import.meta !== "undefined" && import.meta.env && "DEV" in import.meta.env) {
        return !!import.meta.env.DEV;
      }
    } catch {}
    try {
      return typeof process !== "undefined" &&
             process.env &&
             process.env.NODE_ENV !== "production";
    } catch {}
    return false;
  })();

/** 여러 백엔드 변형을 순차 시도하는 리프레시 */
async function tryRefreshCandidates() {
  const candidates = [
    "/auth/refresh",
    "/api/auth/refresh",
    "/auth/user/refresh",
    "/api/auth/user/refresh", // 변형 포함
  ];

  for (const url of candidates) {
    try {
      console.log('url777: ', url);
      const resp = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!resp.ok) continue;
      console.log('resp777: ', resp);

      const j = await resp.json().catch(() => ({}));
      const prev = getAuth() || {};
      console.log('j777: ', j);
      console.log('prev777: ', prev);

      const nextToken =
        j.token ||
        j.accessToken ||
        j?.data?.token ||
        j?.data?.accessToken ||
        null;
      console.log('nextToken777: ', nextToken);

      if (!nextToken) continue;

      const next = {
        ...prev,
        token: nextToken,
        role: j.role || j?.data?.role || prev.role,
        loginId: j.loginId || j?.data?.loginId || prev.loginId,
        remember: prev?.remember ?? true,
      };
      console.log('next777: ', next);

      storeAuth(next, !!next.remember);
      try { window.dispatchEvent(new Event("authChange")); } catch {}
      return next;
    } catch {
      // 다음 후보 시도
    }
  }
  throw new Error("refresh failed");
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshingRef = useRef(false);
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await bootstrapAuth();
        if (mounted) setAuth(getAuth());
      } catch {
        if (mounted) setAuth(null);
      } finally {
        if (mounted) setIsInitialized(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onAuthChange = () => setAuth(getAuth());
    const onStorage = (e) => { if (e.key === "fittly.auth") onAuthChange(); };
    window.addEventListener("authChange", onAuthChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("authChange", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const tryRefreshOnce = useCallback(async () => {
    if (refreshingRef.current && refreshPromiseRef.current) {
      try { await refreshPromiseRef.current; return true; }
      catch { return false; }
    }
    refreshingRef.current = true;
    refreshPromiseRef.current = (async () => {
      try {
        const next = await tryRefreshCandidates();
        setAuth(next);
        if (DEV) console.info("[auth] refresh success");
        return true;
      } finally {
        refreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();
    try { await refreshPromiseRef.current; return true; }
    catch { return false; }
  }, []);

  // boolean 반환: true=세션 유지/리트라이, false=정리
  useEffect(() => {
    setOnUnauthorized(async (reason) => {
      const url =
        reason?.config?.url ||
        reason?.request?.responseURL ||
        reason?.url ||
        "";

      if (/\/auth\/.*(login|refresh)/.test(url)) {
        try { removeAuth(); } catch {}
        try { window.dispatchEvent(new Event("authChange")); } catch {}
        if (DEV) console.warn("[401 @auth] cleared auth. from:", url);
        return false;
      }

      const curr = getAuth();
      if (!curr?.token) {
        if (DEV) console.warn("[401] no token; skip clear. from:", url);
        return false;
      }

      const ok = await tryRefreshOnce();
      if (ok) {
        if (DEV) console.info("[401] refresh ok; keep session. from:", url);
        return true;
      }

      try { removeAuth(); } catch {}
      try { window.dispatchEvent(new Event("authChange")); } catch {}
      if (DEV) console.warn("[401 handled globally] cleared auth. from:", url);
      return false;
    });
  }, [tryRefreshOnce]);

  const login = useCallback(async (loginId, password, { remember = true } = {}) => {
    try {
      const data = await http.post("/auth/user/login", { loginId, password });
      const authData = {
        token: data.token || data.accessToken,
        role: data.role,
        loginId: data.loginId || loginId,
        remember: !!remember,
      };
      if (!authData.token) throw new Error("로그인 응답에 토큰이 없습니다.");
      setAuth(authData);
      storeAuth(authData, remember);
      try { window.dispatchEvent(new Event("authChange")); } catch {}
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "로그인에 실패했습니다.";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    removeAuth({ redirectTo: "/login/user" });
    try { window.dispatchEvent(new Event("authChange")); } catch {}
  }, []);

  const value = {
    auth,
    isInitialized,
    isLoggedIn: !!auth?.token,
    login,
    logout,
  };

  if (!isInitialized) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
