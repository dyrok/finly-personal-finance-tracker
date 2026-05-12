import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../lib/format";

function AnimatedNumber({ value, currency }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplay(value);
      return;
    }
    const duration = 800;
    const start = performance.now();
    startRef.current = value;
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <span>{typeof value === "number" ? formatMoney(display, currency) : value}</span>;
}

export default function StatCard({ label, value, icon: Icon, tone = "brand", sub, currency, delay = 0 }) {
  const tones = {
    brand: "from-brand-500 to-brand-700 text-white",
    success: "from-teal-500 to-teal-700 text-white",
    danger: "from-rose-500 to-rose-700 text-white",
    warn: "from-amber-500 to-amber-600 text-white",
    slate: "from-stone-600 to-stone-800 text-white",
  };

  return (
    <div
      className={`stat-card stat-card-enter bg-gradient-to-br ${tones[tone]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -right-4 -top-4 opacity-15">
        {Icon ? <Icon className="w-24 h-24" /> : null}
      </div>
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{label}</div>
        <div className="text-2xl sm:text-3xl font-bold mt-1">
          <AnimatedNumber value={value} currency={currency} />
        </div>
        {sub ? <div className="text-xs opacity-80 mt-1">{sub}</div> : null}
      </div>
    </div>
  );
}