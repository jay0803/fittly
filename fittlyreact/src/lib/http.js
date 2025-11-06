//http.js
import axios from "axios";
import { getAuth } from "../lib/jwt"; // 여기서는 clearAuth 금지

export const __HTTP_FILE__ = true;

const IS_DEV =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
  (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production");

function toPath(u) {
  try {
    if (typeof Request !== "undefined" && u instanceof Request) return new URL(u.url, window.location.origin).pathname;
    if (typeof u === "string") return new URL(u, window.location.origin).pathname;
  } catch {}
  return "";
}

function readAnyToken() {
  const store = getAuth?.() || {};
  return (
    store.token ||
    store.accessToken ||
    localStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

/** 공개/예외 경로들 */
const PUBLIC_PATHS = [
  // 로그인/리프레시/검증 (변형 포함)
  /^\/api\/auth\/user\/login$/,
  /^\/auth\/user\/login$/,
  /^\/api\/auth\/refresh$/,
  /^\/auth\/refresh$/,
  /^\/auth\/user\/refresh$/,
  /^\/api\/auth\/user\/refresh$/,
  /^\/api\/auth\/validate$/,
  /^\/auth\/validate$/,
  /^\/api\/auth\/user\/validate$/,
  /^\/auth\/user\/validate$/,

  // 공개 API
  /^\/api\/auth\/email-verify(\/.*)?$/,
  /^\/api\/ai\/public\//,
  /^\/uploads\//,
  /^\/api\/notices\//,
  /^\/api\/faqs\//,
  /^\/api\/products\//,
  /^\/api\/pay\/webhook$/,
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((r) => r.test(pathname || ""));
}

const VIA_ENV =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE?.trim()) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE?.trim()) ||
  "";

const devDefault = "/api";
export const API_BASE = devDefault;
// export const API_BASE = VIA_ENV || devDefault;

let onUnauthorized = null;
/** AuthContext가 주입: boolean 반환 (true=세션유지/리트라이 OK, false=정리) */
export function setOnUnauthorized(fn) { onUnauthorized = fn; }

/* ------------------------------- Fetch patch ------------------------------- */
export function setupFetchInterceptor() {
  if (typeof window === "undefined") return;
  if (window.__fittlyFetchPatched) return;
  window.__fittlyFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const path = toPath(input);
    const urlStr = typeof input === "string" ? input : input?.url || "";
    const isApiCall = path.startsWith("/api/") || urlStr.startsWith("/api/");
    const headers = new Headers(init.headers || {});
    const t = readAnyToken();

    // 최초 요청: public이면 기본적으로 토큰 미부착
    const shouldAttach = isApiCall && !isPublicPath(path) && t && !headers.has("Authorization");
    if (shouldAttach) headers.set("Authorization", `Bearer ${t}`);

    const reqInit = {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    };

    let res;
    try {
      res = await originalFetch(input, reqInit);
    } catch (err) {
      if (IS_DEV) console.error("[fetch] NETWORK ERROR:", { url: urlStr, msg: err?.message });
      throw err;
    }

    const isRedirect = res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400);
    if (isApiCall && isRedirect) {
      // 프록시 레벨 리다이렉트 → 통일된 401로 변환
      res = new Response(
        JSON.stringify({ success: false, code: "unauthorized_redirect", message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 401 처리: onUnauthorized → 성공 시 1회 재시도(이때는 강제로 Authorization 부착)
    if (res.status === 401 && !isPublicPath(path) && !reqInit.__retried) {
      if (onUnauthorized) {
        const ok = await onUnauthorized({ url: urlStr || path, status: 401, response: res, from: "fetch" });
        if (ok) {
          const nextHeaders = new Headers(reqInit.headers || {});
          const nt = readAnyToken();
          if (nt) nextHeaders.set("Authorization", `Bearer ${nt}`);
          const retryInit = { ...reqInit, headers: nextHeaders, __retried: true };
          try {
            return await originalFetch(input, retryInit);
          } catch (e) {
            if (IS_DEV) console.warn("[fetch] retry failed:", e?.message);
          }
        }
      }
    }

    return res;
  };
}

if (typeof window !== "undefined") {
  try { setupFetchInterceptor(); } catch {}
}

/* ------------------------------- Axios client ------------------------------ */
const client = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

function normalizeUrl(url, base) {
  const endsWithApi = /\/api\/?$/.test(String(base || ""));
  let u = "/" + String(url || "").replace(/^\/+/, "");
  if (endsWithApi && u.startsWith("/api/")) u = u.replace(/^\/api(\/|$)/, "/");
  return u;
}

client.interceptors.request.use((config) => {
  if (typeof config.url === "string") config.url = normalizeUrl(config.url, config.baseURL);

  // 최종 경로 판단
  let finalPath = "";
  try {
    finalPath = new URL((config.url || ""), config.baseURL || window.location.origin).pathname;
  } catch {
    finalPath = ((config.baseURL || "") + (config.url || "")).replace(/^https?:\/\/[^/]+/, "");
  }

  const t = readAnyToken();
  const force = config.__forceAuth === true; // ✅ 강제 토큰 부착 플래그

  // 공개 경로라도 force면 Authorization을 유지/부착
  if ((isPublicPath(finalPath) && !force) || !t) {
    if (config.headers?.Authorization) delete config.headers.Authorization;
  } else {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`;
  }

  // JSON 기본 Content-Type (FormData 예외)
  if (!(config.data instanceof FormData)) {
    config.headers = config.headers || {};
    if (!config.headers["Content-Type"]) config.headers["Content-Type"] = "application/json";
  }

  return config;
});

client.interceptors.response.use(
  (res) => res.data ?? res,
  async (err) => {
    const status = err?.response?.status;
    const cfg = err?.config || {};
    const code = (err?.response?.data?.code || err?.response?.data?.message || "").toString().toLowerCase();
    const suppress401 = !!cfg.suppress401AutoLogout;

    if (IS_DEV) {
      let fullUrl = "";
      try { fullUrl = new URL((cfg.url || ""), cfg.baseURL || window.location.origin).toString(); }
      catch { fullUrl = (cfg.baseURL || "") + (cfg.url || ""); }
      console.error("HTTP ERROR:", { msg: err?.message, status, url: fullUrl, method: cfg.method, retried: cfg.__retried });
    }

    // 401/만료 처리: onUnauthorized → 성공 시 1회 재시도 (이때는 __forceAuth로 토큰 강제 부착)
    if ((status === 401 || code.includes("expired")) && !suppress401 && !cfg.__retried) {
      if (onUnauthorized) {
        const ok = await onUnauthorized(err);
        if (ok) {
          const nt = readAnyToken();
          const retryCfg = { ...cfg, __retried: true, __forceAuth: true }; // ✅ 강제 부착
          retryCfg.headers = { ...(cfg.headers || {}) };
          if (nt) retryCfg.headers.Authorization = `Bearer ${nt}`;
          try {
            return await client.request(retryCfg);
          } catch (e) {
            if (IS_DEV) console.warn("[axios] retry failed:", e?.message);
          }
        }
      }
    }

    return Promise.reject(err);
  }
);

export const http = client;
export default client;
