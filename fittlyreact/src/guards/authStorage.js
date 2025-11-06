const KEY = "fittly.auth";

export const storage = {
  get() {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
      return null;
    }
  },
  set(val, remember = false) {
    const data = JSON.stringify(val);
    if (remember) {
      localStorage.setItem(KEY, data);
      sessionStorage.removeItem(KEY);
    } else {
      sessionStorage.setItem(KEY, data);
      localStorage.removeItem(KEY);
    }
  },
  clear() {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  },
};