import { useState } from "react";
import { Plus } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/categories";
import { todayISO } from "../lib/format";

export default function TransactionForm({ onAdd, compact = false }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onAdd({
      type,
      amount: amt,
      category,
      note: note.trim(),
      date,
    });
    setAmount("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "" : "card"}>
      {!compact && <h2 className="font-semibold text-slate-900 mb-4">Add Transaction</h2>}

      <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input pl-7 text-lg font-semibold"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="label">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition ${
                  category === c.name
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
                title={c.name}
              >
                <span>{c.icon}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. lunch"
            className="input"
          />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full mt-4">
        <Plus className="w-4 h-4" />
        Add {type === "expense" ? "Expense" : "Income"}
      </button>
    </form>
  );
}
