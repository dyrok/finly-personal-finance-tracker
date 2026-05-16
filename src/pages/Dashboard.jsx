import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Target as TargetIcon, ArrowRight, Inbox } from "lucide-react";
import StatCard from "../components/StatCard";
import TransactionForm from "../components/TransactionForm";
import EmptyState from "../components/EmptyState";
import { formatMoney, ym, prettyDate } from "../lib/format";
import { categoryMeta } from "../lib/categories";

const TOOLTIP_LIGHT = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  backgroundColor: "rgba(255,255,255,0.98)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 13,
};

const TOOLTIP_DARK = {
  borderRadius: 12,
  border: "1px solid #374151",
  backgroundColor: "rgba(17,24,39,0.98)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  fontSize: 13,
};

function useTooltipStyles() {
  const dark = document.documentElement.classList.contains("dark");
  return dark ? TOOLTIP_DARK : TOOLTIP_LIGHT;
}

const CAT_COLORS = {
  "Food & Dining": { bg: "#fff7ed", darkBg: "#431407", ring: "#fed7aa" },
  Groceries: { bg: "#f0fdf4", darkBg: "#052e16", ring: "#bbf7d0" },
  Transport: { bg: "#ecfeff", darkBg: "#083344", ring: "#a5f3fc" },
  Housing: { bg: "#f5f3ff", darkBg: "#2e1065", ring: "#ddd6fe" },
  Utilities: { bg: "#fefce8", darkBg: "#422006", ring: "#fef08a" },
  Entertainment: { bg: "#fdf2f8", darkBg: "#500724", ring: "#fbcfe8" },
  Shopping: { bg: "#fff1f2", darkBg: "#4c0519", ring: "#fecdd3" },
  Health: { bg: "#ecfdf5", darkBg: "#022c22", ring: "#a7f3d0" },
  Education: { bg: "#eff6ff", darkBg: "#172554", ring: "#bfdbfe" },
  Travel: { bg: "#f0fdfa", darkBg: "#042f2e", ring: "#99f6e4" },
  Subscriptions: { bg: "#faf5ff", darkBg: "#3b0764", ring: "#e9d5ff" },
  Savings: { bg: "#eef2ff", darkBg: "#1e1b4b", ring: "#c7d2fe" },
  Other: { bg: "#f8fafc", darkBg: "#1c1917", ring: "#e7e5e4" },
  Salary: { bg: "#ecfdf5", darkBg: "#022c22", ring: "#a7f3d0" },
  Freelance: { bg: "#ecfeff", darkBg: "#083344", ring: "#a5f3fc" },
  Investment: { bg: "#f5f3ff", darkBg: "#2e1065", ring: "#ddd6fe" },
  Gift: { bg: "#fdf2f8", darkBg: "#500724", ring: "#fbcfe8" },
  "Other Income": { bg: "#f8fafc", darkBg: "#1c1917", ring: "#e7e5e4" },
};

function getCatColor(name) {
  return CAT_COLORS[name] || { bg: "#f8fafc", darkBg: "#1c1917", ring: "#e7e5e4" };
}

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

  const last6Months = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const map = Object.fromEntries(months.map((m) => [m, { month: m, income: 0, expense: 0 }]));
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
  }, [transactions]);

  const recent = transactions.slice(0, 5);
  const balance = monthData.income - monthData.expense;
  const savingsRate = monthData.income > 0 ? (balance / monthData.income) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Income" value={monthData.income} tone="success" icon={TrendingUp} currency={currency} sub="this month" />
        <StatCard label="Expenses" value={monthData.expense} tone="danger" icon={TrendingDown} currency={currency} sub="this month" />
        <StatCard label="Wallet" value={balance} tone={balance >= 0 ? "brand" : "warn"} icon={Wallet} currency={currency} sub={balance >= 0 ? "Net positive" : "Net negative"} />
        <StatCard label="Savings Rate" value={`${savingsRate.toFixed(0)}%`} tone="slate" icon={TargetIcon} sub="of income saved" />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-[20px] border border-amber-200/60 dark:border-amber-700/20 bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-900/20 dark:to-orange-900/10 p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.category} className="flex items-center justify-between p-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border border-amber-200/40 dark:border-amber-700/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{categoryMeta(a.category).icon}</span>
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{a.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    a.level === "over"
                      ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-700/20 text-rose-600 dark:text-rose-400"
                      : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/20 text-amber-600 dark:text-amber-400"
                  }`}>
                    {a.level === "over" ? "Over budget" : "Approaching"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {formatMoney(a.spent, currency)} / {formatMoney(a.limit, currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Income vs Expense</h2>
            {last6Months.every((m) => m.income === 0 && m.expense === 0) ? (
              <EmptyState icon={TrendingUp} title="No data yet" description="Add transactions to see your financial trends" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={last6Months}>
                  <defs>
                    <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={1} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                  <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={useTooltipStyles()} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#g-income)" strokeWidth={2.5} name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="url(#g-expense)" strokeWidth={2.5} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Spending Breakdown</h2>
            {monthData.pieData.length === 0 ? (
              <EmptyState icon={Inbox} title="No expenses this month" description="Your spending breakdown will appear here once you add transactions" />
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 items-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={monthData.pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                      {monthData.pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={useTooltipStyles()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {monthData.pieData.slice(0, 6).map((d) => {
                    const pct = (d.value / monthData.expense) * 100;
                    return (
                      <div key={d.name} className="flex items-center gap-3 text-sm">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="flex-1 truncate text-slate-600">{d.name}</span>
                        <span className="text-slate-400 text-xs tabular-nums">{pct.toFixed(0)}%</span>
                        <span className="font-semibold text-slate-900 tabular-nums w-20 text-right">
                          {formatMoney(d.value, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">Recent Transactions</h2>
              <button onClick={() => onSwitchTab("transactions")} className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {recent.length === 0 ? (
              <EmptyState icon={Inbox} title="No transactions yet" description="Add your first transaction to get started" />
            ) : (
              <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                {recent.map((t, i) => {
                  const meta = categoryMeta(t.category, t.type);
                  const cc = getCatColor(t.category);
                  return (
                    <div key={t.id} className={`py-3.5 px-4 flex items-center gap-3.5 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cc.bg }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{t.note || t.category}</div>
                        <div className="text-xs text-slate-500">{t.category} · {prettyDate(t.date)}</div>
                      </div>
                      <div className={`font-bold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-slate-900"}`}>
                        {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-slate-900 dark:text-white mb-1 text-lg">Quick Add</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Log a transaction in seconds</p>
            <TransactionForm onAdd={onAddTransaction} compact currency={currency} />
          </div>

          {goals.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 dark:text-white text-lg">Savings Goals</h2>
                <button onClick={() => onSwitchTab("goals")} className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors">Manage</button>
              </div>
              <div className="space-y-4">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, (g.saved / g.target) * 100);
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{g.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs tabular-nums font-medium">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                        {formatMoney(g.saved, currency)} / {formatMoney(g.target, currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
