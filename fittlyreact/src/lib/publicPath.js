publicPath.js
export function publicPath(p = "") {
  const base =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ||
    (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) ||
    "/";
  const b = base.endsWith("/") ? base : base + "/";
  return b + String(p || "").replace(/^\/+/, "");
}
