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
    cls: "bg-emerald-50/95 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-700/30 text-emerald-900 dark:text-emerald-200",
    icon: CheckCircle2,
    iconCls: "text-emerald-500",
  },
  info: {
    cls: "bg-sky-50/95 dark:bg-sky-900/30 border-sky-200/50 dark:border-sky-700/30 text-sky-900 dark:text-sky-200",
    icon: Info,
    iconCls: "text-sky-500",
  },
  warn: {
    cls: "bg-amber-50/95 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-700/30 text-amber-900 dark:text-amber-200",
    icon: AlertTriangle,
    iconCls: "text-amber-500",
  },
  error: {
    cls: "bg-rose-50/95 dark:bg-rose-900/30 border-rose-200/50 dark:border-rose-700/30 text-rose-900 dark:text-rose-200",
    icon: AlertOctagon,
    iconCls: "text-rose-500",
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
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md ${s.cls} animate-slide-in`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.iconCls}`} />
            <div className="flex-1 text-sm font-medium leading-snug">{it.message}</div>
            <button
              onClick={() => onDismiss(it.id)}
              className="text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
