import { formatMoney } from "../lib/format";

export default function StatCard({ label, value, icon: Icon, tone = "brand", sub, currency }) {
  const tones = {
    brand: "from-brand-500 to-brand-700 text-white",
    success: "from-emerald-500 to-emerald-700 text-white",
    danger: "from-rose-500 to-rose-700 text-white",
    warn: "from-amber-500 to-amber-600 text-white",
    slate: "from-slate-700 to-slate-900 text-white",
  };
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-5 shadow-sm relative overflow-hidden`}
    >
      <div className="absolute -right-4 -top-4 opacity-15">
        {Icon ? <Icon className="w-24 h-24" /> : null}
      </div>
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{label}</div>
        <div className="text-2xl sm:text-3xl font-bold mt-1">
          {typeof value === "number" ? formatMoney(value, currency) : value}
        </div>
        {sub ? <div className="text-xs opacity-80 mt-1">{sub}</div> : null}
      </div>
    </div>
  );
}
