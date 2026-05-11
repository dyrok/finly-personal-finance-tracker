import { useCallback, useState } from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from "lucide-react";

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

const STYLES = {
  success: {
    cls: "bg-emerald-50 border-emerald-200 text-emerald-900",
    icon: CheckCircle2,
    iconCls: "text-emerald-600",
  },
  info: {
    cls: "bg-blue-50 border-blue-200 text-blue-900",
    icon: Info,
    iconCls: "text-blue-600",
  },
  warn: {
    cls: "bg-amber-50 border-amber-200 text-amber-900",
    icon: AlertTriangle,
    iconCls: "text-amber-600",
  },
  error: {
    cls: "bg-rose-50 border-rose-200 text-rose-900",
    icon: AlertOctagon,
    iconCls: "text-rose-600",
  },
};

export default function Toaster({ items, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]">
      {items.map((it) => {
        const s = STYLES[it.level] || STYLES.info;
        const Icon = s.icon;
        return (
          <div
            key={it.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur ${s.cls} animate-[slideIn_200ms_ease-out]`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.iconCls}`} />
            <div className="flex-1 text-sm font-medium">{it.message}</div>
            <button
              onClick={() => onDismiss(it.id)}
              className="text-slate-500 hover:text-slate-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
