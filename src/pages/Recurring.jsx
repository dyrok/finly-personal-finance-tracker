import { useState } from "react";
import { Plus, RotateCw, Trash2, Pause, Play } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { formatMoney, prettyDate, todayISO } from "../lib/format";
import { uid } from "../lib/storage";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryMeta } from "../lib/categories";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const CAT_COLORS = {
  "Food & Dining": "#fff7ed", Groceries: "#f0fdf4", Transport: "#ecfeff", Housing: "#f5f3ff",
  Utilities: "#fefce8", Entertainment: "#fdf2f8", Shopping: "#fff1f2", Health: "#ecfdf5",
  Education: "#eff6ff", Travel: "#f0fdfa", Subscriptions: "#faf5ff", Savings: "#eef2ff",
  Other: "#f8fafc", Salary: "#ecfdf5", Freelance: "#ecfeff", Investment: "#f5f3ff",
  Gift: "#fdf2f8", "Other Income": "#f8fafc",
};

export default function Recurring({ recurring, setRecurring, currency, toaster }) {
  const [showForm, setShowForm] = useState(false);

  function addRecurring(r) {
    setRecurring((prev) => [{ id: uid(), active: true, ...r, nextDate: r.startDate }, ...prev]);
    setShowForm(false);
    toaster.show("Recurring rule created", "success");
  }

  function toggle(id) {
    setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  function remove(id) {
    if (!confirm("Delete this recurring rule?")) return;
    setRecurring((prev) => prev.filter((r) => r.id !== id));
    toaster.show("Recurring rule deleted", "info");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Transactions</h2>
          <p className="text-sm text-slate-500 mt-1">Auto-add subscriptions, rent, and regular paychecks</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary"><Plus className="w-4 h-4" /> New Rule</button>
      </div>

      {showForm && <RecurringForm onAdd={addRecurring} onCancel={() => setShowForm(false)} />}

      {recurring.length === 0 && !showForm ? (
        <div className="card bg-white">
          <EmptyState icon={RotateCw} title="No recurring rules" description="Set up rent, salary, or Netflix once — they'll auto-log on schedule." action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add a recurring rule</button>} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((r) => {
            const meta = categoryMeta(r.category, r.type);
            return (
              <div key={r.id} className={`card bg-white ${!r.active ? "opacity-50 grayscale-[0.3]" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: CAT_COLORS[r.category] || "#f8fafc" }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{r.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{r.category}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold tabular-nums ${r.type === "income" ? "text-emerald-600" : "text-slate-900"}`}>
                    {r.type === "income" ? "+" : "−"}{formatMoney(r.amount, currency)}
                  </span>
                  <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full font-medium">{r.frequency}</span>
                </div>

                <div className="text-xs text-slate-500 mt-3">
                  Next: <span className="font-medium text-slate-700">{prettyDate(r.nextDate)}</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => toggle(r.id)} className="btn-ghost flex-1" title={r.active ? "Pause" : "Resume"}>
                    {r.active ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
                  </button>
                  <button onClick={() => remove(r.id)} className="btn-danger p-2.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecurringForm({ onAdd, onCancel }) {
  const [type, setType] = useState("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(todayISO());
  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function submit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || !amt) return;
    onAdd({ type, name: name.trim(), amount: amt, category, frequency, startDate });
  }

  return (
    <form onSubmit={submit} className="card bg-white">
      <h3 className="font-bold text-slate-900 text-lg mb-5">New Recurring Rule</h3>
      <div className="flex gap-1.5 mb-5 p-1 bg-slate-100 rounded-xl">
        <button type="button" onClick={() => { setType("expense"); setCategory(EXPENSE_CATEGORIES[0].name); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === "expense" ? "bg-white shadow-sm text-rose-600" : "text-slate-500 hover:text-slate-700"}`}>Expense</button>
        <button type="button" onClick={() => { setType("income"); setCategory(INCOME_CATEGORIES[0].name); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === "income" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Income</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rent, Netflix, Salary" className="input" />
        </div>
        <div>
          <label className="label">Amount</label>
          <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input" />
        </div>
        <div>
          <label className="label">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="input">{FREQUENCIES.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}</select>
        </div>
        <div>
          <label className="label">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">{cats.map((c) => (<option key={c.name} value={c.name}>{c.icon} {c.name}</option>))}</select>
        </div>
        <div>
          <label className="label">Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button type="submit" className="btn-primary flex-1">Create Rule</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
