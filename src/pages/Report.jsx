import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileBarChart, Download } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { formatMoney, ym, ymLabel } from "../lib/format";
import { categoryMeta } from "../lib/categories";

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  backgroundColor: "rgba(255,255,255,0.98)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 13,
};

export default function Report({ transactions, budgets, currency }) {
  const months = useMemo(() => {
    const s = new Set(transactions.map((t) => ym(t.date)));
    s.add(ym(new Date()));
    return Array.from(s).sort().reverse();
  }, [transactions]);

  const [month, setMonth] = useState(months[0] || ym(new Date()));

  const data = useMemo(() => {
    const txs = transactions.filter((t) => ym(t.date) === month);
    let income = 0, expense = 0;
    const byCat = {}, byDay = {};
    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.type === "income") income += amt;
      else { expense += amt; byCat[t.category] = (byCat[t.category] || 0) + amt; const day = t.date.slice(8, 10); byDay[day] = (byDay[day] || 0) + amt; }
    }
    const catData = Object.entries(byCat).map(([name, value]) => ({ name, value, color: categoryMeta(name).color })).sort((a, b) => b.value - a.value);
    const daysInMonth = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => { const d = String(i + 1).padStart(2, "0"); return { day: d, amount: byDay[d] || 0 }; });
    return { income, expense, catData, dailyData, count: txs.length };
  }, [transactions, month]);

  const budgetCompare = useMemo(() => {
    return Object.entries(budgets).map(([cat, limit]) => {
      const spent = data.catData.find((c) => c.name === cat)?.value || 0;
      return { category: cat, budget: limit, spent, remaining: Math.max(0, limit - spent), over: Math.max(0, spent - limit) };
    });
  }, [budgets, data.catData]);

  const balance = data.income - data.expense;
  const savingsRate = data.income > 0 ? (balance / data.income) * 100 : 0;

  function exportReport() {
    const lines = [`Monthly Financial Report — ${ymLabel(month)}`, "", `Total Income:   ${formatMoney(data.income, currency)}`, `Total Expenses: ${formatMoney(data.expense, currency)}`, `Net Balance:    ${formatMoney(balance, currency)}`, `Savings Rate:   ${savingsRate.toFixed(1)}%`, `Transactions:   ${data.count}`, "", "Spending by Category:"];
    for (const c of data.catData) lines.push(`  ${c.name.padEnd(20)} ${formatMoney(c.value, currency)}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${month}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Report</h2>
          <p className="text-sm text-slate-500 mt-1">Detailed breakdown for the selected month</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="input">
            {months.map((m) => (<option key={m} value={m}>{ymLabel(m)}</option>))}
          </select>
          <button onClick={exportReport} className="btn-ghost" disabled={data.count === 0}><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      {data.count === 0 ? (
        <div className="card bg-white"><EmptyState icon={FileBarChart} title="No transactions this month" description="Pick another month or log a transaction to see your report." /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Income" value={formatMoney(data.income, currency)} tone="emerald" />
            <Metric label="Expenses" value={formatMoney(data.expense, currency)} tone="rose" />
            <Metric label="Net Wallet" value={formatMoney(balance, currency)} tone={balance >= 0 ? "brand" : "amber"} />
            <Metric label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} tone="slate" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card bg-white">
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Daily Spending</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} interval={2} stroke="#94a3b8" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                  <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="amount" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Spending" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card bg-white">
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.catData} dataKey="value" nameKey="name" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {data.catData.map((e) => (<Cell key={e.name} fill={e.color} />))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card bg-white">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">Budget vs Actual</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, budgetCompare.length * 40)}>
              <BarChart data={budgetCompare} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={11} width={100} stroke="#64748b" />
                <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="budget" fill="#cbd5e1" name="Budget" radius={[0, 6, 6, 0]} />
                <Bar dataKey="spent" fill="#14b8a6" name="Spent" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card bg-white">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">Category Details</h3>
            <ul className="divide-y divide-slate-100">
              {data.catData.map((c) => {
                const pct = (c.value / data.expense) * 100;
                return (
                  <li key={c.name} className="py-3 flex items-center gap-3">
                    <span className="text-xl">{categoryMeta(c.name).icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="font-bold tabular-nums text-slate-900">{formatMoney(c.value, currency)}</span>
                      </div>
                      <div className="progress-track mt-1.5">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{pct.toFixed(1)}% of expenses</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, tone = "slate" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    rose: "bg-rose-50 text-rose-700 border-rose-200/50",
    brand: "bg-brand-50 text-brand-700 border-brand-200/50",
    amber: "bg-amber-50 text-amber-700 border-amber-200/50",
    slate: "bg-slate-50 text-slate-700 border-slate-200/50",
  };
  return (
    <div className={`rounded-[16px] border p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{value}</div>
    </div>
  );
}
