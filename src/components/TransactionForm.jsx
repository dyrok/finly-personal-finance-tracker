import { useState } from "react";
import { Plus } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/categories";
import { todayISO, getCurrencySymbol } from "../lib/format";

export default function TransactionForm({ onAdd, compact = false, currency = "USD" }) {
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
    <form onSubmit={handleSubmit} className={compact ? "" : "card bg-white"}>
      {!compact && (
        <div className="mb-5">
          <h2 className="font-bold text-slate-900 text-lg">Add Transaction</h2>
          <p className="text-xs text-slate-500 mt-1">Record income or expense</p>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setType("expense");
            setCategory(EXPENSE_CATEGORIES[0].name);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            type === "expense"
              ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            type === "income"
              ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">
              {getCurrencySymbol(currency)}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input pl-8 text-lg font-semibold"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="label">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  category === c.name
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
                }`}
                title={c.name}
              >
                <span className="text-base">{c.icon}</span>
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
          <label className="label">Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="input"
          />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full mt-5">
        <Plus className="w-4 h-4" />
        Add {type === "expense" ? "Expense" : "Income"}
      </button>
    </form>
  );
}
