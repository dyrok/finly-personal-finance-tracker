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

export default function Recurring({ recurring, setRecurring, currency, toaster }) {
  const [showForm, setShowForm] = useState(false);

  function addRecurring(r) {
    setRecurring((prev) => [
      { id: uid(), active: true, ...r, nextDate: r.startDate },
      ...prev,
    ]);
    setShowForm(false);
    toaster.show("Recurring rule created", "success");
  }

  function toggle(id) {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    );
  }

  function remove(id) {
    if (!confirm("Delete this recurring rule? Existing transactions stay.")) return;
    setRecurring((prev) => prev.filter((r) => r.id !== id));
    toaster.show("Recurring rule deleted", "info");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recurring Transactions</h2>
          <p className="text-sm text-slate-500">
            Auto-add subscriptions, rent, and regular paychecks
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {showForm && <RecurringForm onAdd={addRecurring} onCancel={() => setShowForm(false)} />}

      {recurring.length === 0 && !showForm ? (
        <div className="card">
          <EmptyState
            icon={RotateCw}
            title="No recurring rules"
            description="Set up rent, salary, or Netflix once — they'll auto-log on schedule."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add a recurring rule
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((r) => {
            const meta = categoryMeta(r.category, r.type);
            return (
              <div
                key={r.id}
                className={`card ${!r.active ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: meta.color + "22" }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{r.name}</h3>
                    <p className="text-xs text-slate-500">{r.category}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      r.type === "income" ? "text-emerald-600" : "text-slate-900"
                    }`}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {formatMoney(r.amount, currency)}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{r.frequency}</span>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Next: <span className="font-medium text-slate-700">{prettyDate(r.nextDate)}</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => toggle(r.id)}
                    className="btn-ghost flex-1"
                    title={r.active ? "Pause" : "Resume"}
                  >
                    {r.active ? (
                      <>
                        <Pause className="w-4 h-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Resume
                      </>
                    )}
                  </button>
                  <button onClick={() => remove(r.id)} className="btn-danger p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
    onAdd({
      type,
      name: name.trim(),
      amount: amt,
      category,
      frequency,
      startDate,
    });
  }

  return (
    <form onSubmit={submit} className="card">
      <h3 className="font-semibold text-slate-900 mb-4">New Recurring Rule</h3>
      <div className="flex gap-2 mb-3 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setType("expense");
            setCategory(EXPENSE_CATEGORIES[0].name);
          }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
            type === "expense" ? "bg-white shadow-sm text-rose-600" : "text-slate-600"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType("income");
            setCategory(INCOME_CATEGORIES[0].name);
          }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
            type === "income" ? "bg-white shadow-sm text-emerald-600" : "text-slate-600"
          }`}
        >
          Income
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Rent, Netflix, Salary"
            className="input"
          />
        </div>
        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input"
          />
        </div>
        <div>
          <label className="label">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="input"
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {cats.map((c) => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button type="submit" className="btn-primary flex-1">
          Create Rule
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
