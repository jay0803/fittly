import { http } from "./http";

export const __JWT_FILE__ = true;

const KEY = "fittly.auth";
const OLD_KEYS = ["fittly.token", "fittly.role", "fittly.loginId"];
const storage = {
  get() {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
      return null;
    }
  },
  set(val, remember = false) {
    const data = JSON.stringify(val);
    if (remember) { localStorage.setItem(KEY, data); sessionStorage.removeItem(KEY); }
    else { sessionStorage.setItem(KEY, data); localStorage.removeItem(KEY); }
  },
  clear() { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); },
};

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(json);
  } catch { return null; }
}

function migrateOldKeysIfNeeded() {
  const alreadyUnified = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
  if (alreadyUnified) return;
  const token = localStorage.getItem("fittly.token");
  const role = localStorage.getItem("fittly.role");
  const loginId = localStorage.getItem("fittly.loginId");
  if (token) {
    const payload = decodeJwtPayload(token);
    const exp = payload?.exp ?? null;
    storage.set({ token, role, loginId, exp }, true);
    OLD_KEYS.forEach((k) => localStorage.removeItem(k));
  }
}

let logoutTimer = null;
function scheduleAutoLogout(expSeconds) {
  clearTimeout(logoutTimer);
  if (!expSeconds) return;
  const ms = expSeconds * 1000 - Date.now();
  if (ms <= 0) { clearAuth(); return; }
  logoutTimer = setTimeout(() => { clearAuth(); }, ms);
}

/**
 * setAuth(auth, remember) 또는 setAuth(auth, { remember })
 * 두 형태 모두 지원
 * setAuth({ token, role: "ROLE_ADMIN", loginId: payload?.loginId || loginId });
 */
export function setAuth(auth, rememberOrOptions = undefined) {
  const { token, role, loginId } = auth || {};
  if (!token) return;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp ?? null;

  const remember = typeof rememberOrOptions === "boolean"
    ? rememberOrOptions
    : !!(rememberOrOptions && rememberOrOptions.remember);

  storage.set({ token, role, loginId, exp }, remember);
  scheduleAutoLogout(exp);
  try { window.dispatchEvent(new Event("authChange")); } catch {}
}

export function getAuth() {
  const v = storage.get();
  if (!v) {
    // 레거시 키 호환
    const token = localStorage.getItem("fittly.token");
    const role = localStorage.getItem("fittly.role");
    const loginId = localStorage.getItem("fittly.loginId");
    if (token) {
      const exp = decodeJwtPayload(token)?.exp ?? null;
      return { token, role, loginId, exp };
    }
  }
  return v ?? { token: null, role: null, loginId: null, exp: null };
}

export function clearAuth({ redirectTo = null } = {}) {
  storage.clear();
  clearTimeout(logoutTimer);
  try { window.dispatchEvent(new Event("authChange")); } catch {}
  if (redirectTo) {
    try { window.location.assign(redirectTo); } catch {}
  }
}

export function isLoggedIn() {
  const { token, exp } = getAuth();
  if (!token) return false;
  if (exp && Date.now() >= exp * 1000) { clearAuth({ redirectTo: "/login/user?session=expired" }); return false; }
  return true;
}

export function hasRole(...roles) {
  const { role } = getAuth();
  return roles.includes(role);
}

export async function bootstrapAuth() {
  migrateOldKeysIfNeeded();
  const { token, exp } = getAuth();
  if (!token) return;
  if (exp && Date.now() >= exp * 1000) { clearAuth({ redirectTo: null }); return; }
  scheduleAutoLogout(exp);
  try {
    // 백엔드에 따라 /api/auth/validate 로 매핑됨
    await http.get("/auth/validate", { suppress401AutoLogout: true });
  } catch (error){
    // 검증 실패해도 여기서는 세션을 즉시 파기하지 않음 (전역 401 핸들러가 처리)
    console.log("error메세지: ", error);
  }
}
