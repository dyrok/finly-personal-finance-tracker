import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ArrowRight,
  Inbox,
  ArrowUp,
  ArrowDown,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import EmptyState from "../components/EmptyState";
import { formatMoney, ym, prettyDate } from "../lib/format";
import { categoryMeta } from "../lib/categories";

const RANGE_OPTIONS = [
  { key: "1M", months: 2 },
  { key: "3M", months: 3 },
  { key: "6M", months: 6 },
  { key: "12M", months: 12 },
];

export default function Dashboard({
  transactions,
  budgets,
  goals,
  alerts,
  currency,
  onAddTransaction,
  onSwitchTab,
}) {
  const currentMonth = ym(new Date());
  const lastMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return ym(d);
  }, []);

  const monthsWithData = useMemo(() => {
    const set = new Set(transactions.map((t) => ym(t.date)));
    return set.size;
  }, [transactions]);

  const defaultRange = useMemo(() => {
    if (monthsWithData >= 6) return "6M";
    if (monthsWithData >= 3) return "3M";
    return "1M";
  }, [monthsWithData]);

  const [range, setRange] = useState(defaultRange);

  const monthData = useMemo(() => {
    const txs = transactions.filter((t) => ym(t.date) === currentMonth);
    let income = 0;
    let expense = 0;
    const byCat = {};
    for (const t of txs) {
      if (t.type === "income") income += Number(t.amount);
      else {
        expense += Number(t.amount);
        byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
      }
    }
    const pieData = Object.entries(byCat)
      .map(([name, value]) => ({ name, value, color: categoryMeta(name).color }))
      .sort((a, b) => b.value - a.value);
    return { income, expense, pieData, count: txs.length };
  }, [transactions, currentMonth]);

  const lastMonthData = useMemo(() => {
    const txs = transactions.filter((t) => ym(t.date) === lastMonth);
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      if (t.type === "income") income += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { income, expense, balance: income - expense };
  }, [transactions, lastMonth]);

  const buildTrend = (months) => {
    const out = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const map = Object.fromEntries(out.map((m) => [m, { month: m, income: 0, expense: 0 }]));
    for (const t of transactions) {
      const m = ym(t.date);
      if (map[m]) {
        if (t.type === "income") map[m].income += Number(t.amount);
        else map[m].expense += Number(t.amount);
      }
    }
    return Object.values(map).map((d) => ({
      ...d,
      label: new Date(d.month + "-01").toLocaleDateString(undefined, { month: "short" }),
      net: d.income - d.expense,
    }));
  };

  const trendForChart = useMemo(() => {
    const months = RANGE_OPTIONS.find((r) => r.key === range)?.months || 6;
    return buildTrend(months);
  }, [transactions, range]);

  const trendForSpark = useMemo(() => buildTrend(6), [transactions]);

  const recent = transactions.slice(0, 5);
  const balance = monthData.income - monthData.expense;
  const savingsRate = monthData.income > 0 ? (balance / monthData.income) * 100 : 0;
  const lastSavingsRate =
    lastMonthData.income > 0 ? (lastMonthData.balance / lastMonthData.income) * 100 : 0;
  const hasTrendData = trendForChart.some((m) => m.income > 0 || m.expense > 0);
  const sparseData = monthsWithData < 2;

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div className="flex items-end justify-between flex-wrap gap-2 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Income"
          value={monthData.income}
          currency={currency}
          previous={lastMonthData.income}
          icon={TrendingUp}
          accent="emerald"
          sparklineKey="income"
          trend={trendForSpark}
          positiveIsGood
          delay={0}
        />
        <KpiCard
          label="Expenses"
          value={monthData.expense}
          currency={currency}
          previous={lastMonthData.expense}
          icon={TrendingDown}
          accent="rose"
          sparklineKey="expense"
          trend={trendForSpark}
          positiveIsGood={false}
          delay={40}
        />
        <KpiCard
          label="Net Balance"
          value={balance}
          currency={currency}
          previous={lastMonthData.balance}
          icon={Wallet}
          accent={balance >= 0 ? "emerald" : "rose"}
          sparklineKey="net"
          trend={trendForSpark}
          positiveIsGood
          delay={80}
        />
        <KpiCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(0)}%`}
          rawDelta={savingsRate - lastSavingsRate}
          deltaSuffix="pp"
          icon={PiggyBank}
          accent="indigo"
          ringRate={savingsRate}
          delay={120}
        />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl ring-1 ring-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm text-amber-900">
              {alerts.length} budget alert{alerts.length > 1 ? "s" : ""}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((a) => {
              const meta = categoryMeta(a.category);
              const Icon = meta.icon;
              return (
                <div
                  key={a.category}
                  className="flex items-center gap-2 bg-white ring-1 ring-amber-100 rounded-full pl-2 pr-3 py-1 text-xs"
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  <span className="font-medium text-slate-800">{a.category}</span>
                  <span className="text-slate-400">·</span>
                  <span
                    className={`font-semibold ${
                      a.level === "over" ? "text-rose-600" : "text-amber-700"
                    }`}
                  >
                    {formatMoney(a.spent, currency)} / {formatMoney(a.limit, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cash Flow + Quick Add */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Cash Flow</h2>
              <div className="flex items-center gap-3 text-xs mt-1">
                <LegendDot color="bg-emerald-500" label="Income" />
                <LegendDot color="bg-rose-500" label="Expense" />
              </div>
            </div>
            <RangeSelector value={range} onChange={setRange} />
          </div>
          {!hasTrendData ? (
            <div className="py-8">
              <EmptyState
                icon={TrendingUp}
                title="No data yet"
                description="Add transactions to see your trend"
              />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendForChart} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={56}
                    tickFormatter={(v) => compactNumber(v)}
                  />
                  <Tooltip
                    cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                    content={<ChartTooltip currency={currency} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {sparseData && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Add a few more transactions to see month-over-month trends.
                </p>
              )}
            </>
          )}
        </div>

        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Quick Add</h2>
              <p className="text-xs text-slate-500">Log a transaction</p>
            </div>
          </div>
          <TransactionForm onAdd={onAddTransaction} compact currency={currency} />
        </div>
      </div>

      {/* Categories + Recent */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Top Categories</h2>
            <button
              onClick={() => onSwitchTab("reports")}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Report
            </button>
          </div>
          {monthData.pieData.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No expenses this month"
              description="Your spending breakdown will appear here"
            />
          ) : (
            <div className="space-y-4">
              <div className="relative" style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthData.pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {monthData.pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatMoney(v, currency)}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Total spent
                  </div>
                  <div className="font-bold text-slate-900 tabular-nums text-sm">
                    {formatMoney(monthData.expense, currency)}
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {monthData.pieData.slice(0, 5).map((d) => {
                  const pct = (d.value / monthData.expense) * 100;
                  const meta = categoryMeta(d.name);
                  const Icon = meta.icon;
                  return (
                    <li key={d.name} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: d.color + "1f" }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                      </span>
                      <span className="flex-1 truncate text-slate-700">{d.name}</span>
                      <span className="text-slate-400 text-xs tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                      <span className="font-medium text-slate-900 tabular-nums w-16 text-right text-xs">
                        {formatMoney(d.value, currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <button
              onClick={() => onSwitchTab("transactions")}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No transactions yet"
              description="Add your first one with Quick Add"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((t) => {
                const meta = categoryMeta(t.category, t.type);
                const Icon = meta.icon;
                return (
                  <li key={t.id} className="py-2.5 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.color + "1f" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {t.note || t.category}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t.category} · {prettyDate(t.date)}
                      </div>
                    </div>
                    <div
                      className={`font-semibold text-sm tabular-nums ${
                        t.type === "income" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatMoney(t.amount, currency)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {goals.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Savings Goals</h2>
            <button
              onClick={() => onSwitchTab("goals")}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 [&>*]:max-w-md">
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              return (
                <div
                  key={g.id}
                  className="rounded-xl ring-1 ring-slate-200 p-4 hover:ring-brand-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800 truncate flex items-center gap-1.5">
                      {g.emoji && <span>{g.emoji}</span>}
                      {g.name}
                    </span>
                    <span className="text-xs font-semibold text-brand-700 tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-2 tabular-nums">
                    {formatMoney(g.saved, currency)} of {formatMoney(g.target, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const ACCENT_MAP = {
  emerald: { stroke: "#10b981", fill: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50" },
  rose: { stroke: "#f43f5e", fill: "#f43f5e", text: "text-rose-600", bg: "bg-rose-50" },
  indigo: { stroke: "#6366f1", fill: "#6366f1", text: "text-indigo-600", bg: "bg-indigo-50" },
};

function KpiCard({
  label,
  value,
  currency,
  previous,
  rawDelta,
  deltaSuffix,
  icon: Icon,
  accent,
  sparklineKey,
  trend,
  positiveIsGood = true,
  ringRate,
  delay = 0,
}) {
  const colors = ACCENT_MAP[accent] || ACCENT_MAP.indigo;
  const numericValue = typeof value === "number" ? value : null;

  let deltaPct = null;
  let deltaAbs = null;
  let isNew = false;
  if (rawDelta != null) {
    deltaAbs = rawDelta;
  } else if (numericValue != null && previous != null && previous !== 0) {
    deltaPct = ((numericValue - previous) / Math.abs(previous)) * 100;
  } else if (numericValue != null && previous === 0 && numericValue !== 0) {
    isNew = true;
  }

  const delta = deltaPct ?? deltaAbs;
  const isUp = delta != null && delta > 0;
  const isFlat = !isNew && (delta == null || Math.abs(delta) < 0.5);
  const deltaGood = isFlat || isNew ? null : positiveIsGood ? isUp : !isUp;
  const deltaColor =
    deltaGood == null
      ? "text-slate-500 bg-slate-100"
      : deltaGood
      ? "text-emerald-700 bg-emerald-50"
      : "text-rose-700 bg-rose-50";

  return (
    <div
      className="card reveal hover:ring-slate-300 transition"
      style={{ animationDelay: `${delay}ms`, padding: "1rem" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </div>
        {Icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums leading-none tracking-tight">
            {typeof value === "number" ? formatMoney(value, currency) : value}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {isNew ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                New
              </span>
            ) : delta != null ? (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ${deltaColor}`}
              >
                {isFlat ? null : isUp ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {isFlat
                  ? "—"
                  : `${Math.abs(delta).toFixed(deltaSuffix === "pp" ? 0 : 1)}${
                      deltaSuffix === "pp" ? "pp" : "%"
                    }`}
              </span>
            ) : null}
            <span className="text-[11px] text-slate-400">
              {isNew ? "no prior data" : "vs last month"}
            </span>
          </div>
        </div>
        {sparklineKey && trend ? (
          <div className="h-14 w-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient
                    id={`spark-${accent}-${sparklineKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={colors.fill} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={sparklineKey}
                  stroke={colors.stroke}
                  strokeWidth={1.75}
                  fill={`url(#spark-${accent}-${sparklineKey})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : ringRate != null ? (
          <ProgressRing rate={ringRate} color={colors.stroke} />
        ) : null}
      </div>
    </div>
  );
}

function ProgressRing({ rate, color }) {
  const pct = Math.max(0, Math.min(100, rate));
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="flex-shrink-0">
      <circle cx="28" cy="28" r={r} stroke="#e2e8f0" strokeWidth="4" fill="none" />
      <circle
        cx="28"
        cy="28"
        r={r}
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 28 28)"
        style={{ transition: "stroke-dashoffset 300ms ease-out" }}
      />
    </svg>
  );
}

function RangeSelector({ value, onChange }) {
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
            value === opt.key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {opt.key}
        </button>
      ))}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  const inc = payload.find((p) => p.dataKey === "income")?.value || 0;
  const exp = payload.find((p) => p.dataKey === "expense")?.value || 0;
  const net = inc - exp;
  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs min-w-[150px]">
      <div className="font-semibold text-slate-900 mb-1.5">{label}</div>
      <div className="flex items-center justify-between gap-3 text-emerald-600">
        <span>Income</span>
        <span className="font-semibold tabular-nums">{formatMoney(inc, currency)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-rose-600 mt-0.5">
        <span>Expense</span>
        <span className="font-semibold tabular-nums">{formatMoney(exp, currency)}</span>
      </div>
      <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex items-center justify-between gap-3 text-slate-700">
        <span className="font-semibold">Net</span>
        <span className="font-bold tabular-nums">{formatMoney(net, currency)}</span>
      </div>
    </div>
  );
}

function compactNumber(v) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toString();
}
