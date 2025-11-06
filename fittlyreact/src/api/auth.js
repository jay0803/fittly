//src/api/auth.js
import { http } from "../lib/http";

export const __API_AUTH_FILE__ = true;
const t = (v) => (typeof v === "string" ? v.trim() : "");

export async function signupWithPhotos(payload, files = []) {
  const fd = new FormData();
  fd.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  (files || []).forEach((f) => fd.append("photos", f));
  return http.post("/auth/signup-mp", fd, {
    timeout: 60000,
  });
}

export async function signup(payload) {
  return http.post("/auth/signup", payload);
}

export async function requestPasswordReset(payload) {
  const email =
    typeof payload === "string"
      ? payload.trim()
      : typeof payload?.email === "string"
        ? payload.email.trim()
        : "";
  if (!email) throw new Error("email_required");
  return http.post("/auth/password/forgot", { email });
}

export async function verifyResetToken(token) {
  return http.get(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`);
}
export async function resetPassword({ token, newPassword }) {
  return http.post("/auth/reset-password", { token, newPassword });
}

export async function sendPwResetCode({ loginId, email }) {
  return http.post("/auth/password-reset/code/request", {
    loginId: t(loginId),
    email: t(email),
  });
}

export async function verifyPwResetCode({ loginId, email, code }) {
  const r = await http.post("/auth/password-reset/code/verify", {
    loginId: t(loginId),
    email: t(email),
    code: t(code),
  });

  const d = r?.data;
  let token = null;

  if (typeof d === "string") {
    try {
      const j = JSON.parse(d);
      token =
        j.token ??
        j.resetToken ??
        j?.data?.token ??
        j?.data?.resetToken ??
        null;
    } catch {
      token = d || null;
    }
  } else if (d && typeof d === "object") {
    token =
      d.token ??
      d.resetToken ??
      d.reset_token ??
      d.ticket ??
      d?.data?.token ??
      d?.data?.resetToken ??
      null;
  }

  if (!token && r?.headers) {
    token = r.headers["x-reset-token"] ?? r.headers["X-Reset-Token"] ?? null;
  }

  return { token: token || null };
}

export async function confirmPwReset(payload) {
  const token = t(payload?.token || payload?.resetToken || "");
  const newPassword = t(payload?.newPassword);

  if (token) {
    const r = await http.post("/auth/password-reset/confirm", {
      resetToken: token,
      newPassword,
    });
    return r.data;
  }

  const body = {
    loginId: t(payload?.loginId),
    email: t(payload?.email),
    code: t(payload?.code),
    newPassword,
  };

  try {
    const r = await http.post("/auth/password-reset/perform", body);
    return r.data;
  } catch (e) {
    const r2 = await http.post("/auth/password-reset/confirm", body);
    return r2.data;
  }
}

export async function sendSignupEmailCode(email) {
  return http.post("/auth/email-verify/code/request", { email }, { timeout: 30000 });
}
export async function verifySignupEmailCode({ email, code }) {
  return http.post("/auth/email-verify/code/verify", { email, code });
}

export async function loginUser({ loginId, password }) {
  return http.post("/auth/user/login", { loginId: t(loginId), password: t(password) });
}
export async function loginAdmin({ loginId, password }) {
  return http.post("/auth/admin/login", { loginId: t(loginId), password: t(password) });
}
