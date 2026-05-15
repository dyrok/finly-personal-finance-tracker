import { useCallback, useState } from "react";

export function useToaster() {
  const [items, setItems] = useState([]);

  const show = useCallback((message, level = "info", duration = 3500) => {
    const id = Math.random().toString(36).slice(2, 9);
    setItems((prev) => [...prev, { id, message, level }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, show, dismiss };
}
