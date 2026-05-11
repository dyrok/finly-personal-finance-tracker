import { useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return typeof initial === "function" ? initial() : initial;
      return JSON.parse(raw);
    } catch {
      return typeof initial === "function" ? initial() : initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  }, [key, value]);

  return [value, setValue];
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
