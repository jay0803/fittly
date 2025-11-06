// asset.js
// 정적 자산 URL 생성 (base href / Vite BASE_URL / CRA PUBLIC_URL 모두 호환)
function computeBase() {
  try {
    // <base href="..."> 우선
    const fromBaseTag = typeof document !== "undefined"
      ? document.querySelector("base")?.getAttribute("href")
      : null;
    if (fromBaseTag) return fromBaseTag;
  } catch {}

  // Vite
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) {
      return import.meta.env.BASE_URL;
    }
  } catch {}

  // CRA / 일반
  try {
    if (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) {
      return process.env.PUBLIC_URL;
    }
  } catch {}

  return "/";
}

export function asset(path = "") {
  const base = computeBase();
  const b = base.endsWith("/") ? base : base + "/";
  return b + String(path || "").replace(/^\/+/, "");
}

// 호환 별칭
export const assetUrl = asset;
export default asset;
