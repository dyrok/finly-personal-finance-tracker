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
        <StatCard
          label="Income"
          value={monthData.income}
          tone="success"
          icon={TrendingUp}
          currency={currency}
          sub="this month"
        />
        <StatCard
          label="Expenses"
          value={monthData.expense}
          tone="danger"
          icon={TrendingDown}
          currency={currency}
          sub="this month"
        />
        <StatCard
          label="Balance"
          value={balance}
          tone={balance >= 0 ? "brand" : "warn"}
          icon={Wallet}
          currency={currency}
          sub={balance >= 0 ? "Net positive" : "Net negative"}
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(0)}%`}
          tone="slate"
          icon={TargetIcon}
          sub="of income saved"
        />
      </div>

      {alerts.length > 0 && (
        <div className="card border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.category}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-100"
              >
                <div className="flex items-center gap-2">
                  <span>{categoryMeta(a.category).icon}</span>
                  <span className="font-medium text-sm text-slate-800">{a.category}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      a.level === "over"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.level === "over" ? "Over budget" : "Approaching"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-700">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Income vs Expense — Last 6 Months</h2>
            </div>
            {last6Months.every((m) => m.income === 0 && m.expense === 0) ? (
              <EmptyState
                icon={TrendingUp}
                title="No data yet"
                description="Add transactions to see your trends"
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={last6Months}>
                  <defs>
                    <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    formatter={(v) => formatMoney(v, currency)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    fill="url(#g-income)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#f43f5e"
                    fill="url(#g-expense)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Spending by Category</h2>
            </div>
            {monthData.pieData.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No expenses this month"
                description="Your spending breakdown will appear here"
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-2 items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={monthData.pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {monthData.pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatMoney(v, currency)}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {monthData.pieData.slice(0, 6).map((d) => {
                    const pct = (d.value / monthData.expense) * 100;
                    return (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ background: d.color }}
                        />
                        <span className="flex-1 truncate text-slate-700">{d.name}</span>
                        <span className="text-slate-500 text-xs">{pct.toFixed(0)}%</span>
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
              <button
                onClick={() => onSwitchTab("transactions")}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No transactions yet"
                description="Add your first transaction using the form"
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((t) => {
                  const meta = categoryMeta(t.category, t.type);
                  return (
                    <li key={t.id} className="py-2.5 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: meta.color + "22" }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {t.note || t.category}
                        </div>
                        <div className="text-xs text-slate-500">
                          {t.category} • {prettyDate(t.date)}
                        </div>
                      </div>
                      <div
                        className={`font-semibold tabular-nums ${
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

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-1">Quick Add</h2>
            <p className="text-xs text-slate-500 mb-4">Log a transaction in seconds</p>
            <TransactionForm onAdd={onAddTransaction} compact />
          </div>

          {goals.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Savings Goals</h2>
                <button
                  onClick={() => onSwitchTab("goals")}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-3">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, (g.saved / g.target) * 100);
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-slate-800 truncate">{g.name}</span>
                        <span className="text-slate-500 text-xs">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1 tabular-nums">
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
