import { useState } from "react";
import { Plus, ChevronDown, Check } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/categories";
import { todayISO, prettyDate, currencySymbol } from "../lib/format";

export default function TransactionForm({ onAdd, compact = false, currency = "USD" }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [showDetails, setShowDetails] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isExpense = type === "expense";
  const symbol = currencySymbol(currency);

  const palette = isExpense
    ? {
        text: "text-rose-600",
        ring: "focus-within:border-rose-300 focus-within:ring-rose-100",
        tileActive: "ring-rose-500 bg-rose-50 text-rose-700",
        button: "bg-rose-500 hover:bg-rose-600",
        underline: "bg-rose-500",
      }
    : {
        text: "text-emerald-600",
        ring: "focus-within:border-emerald-300 focus-within:ring-emerald-100",
        tileActive: "ring-emerald-500 bg-emerald-50 text-emerald-700",
        button: "bg-emerald-500 hover:bg-emerald-600",
        underline: "bg-emerald-500",
      };

  function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onAdd({ type, amount: amt, category, note: note.trim(), date });
    setAmount("");
    setNote("");
    setShowDetails(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function switchType(next) {
    setType(next);
    setCategory(
      (next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].name,
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "flex-1 flex flex-col" : "card"}>
      {!compact && <h2 className="font-semibold text-slate-900 mb-4">Add Transaction</h2>}

      {/* Underlined tab toggle — cleaner than pill segmented */}
      <div className="relative flex border-b border-slate-200 mb-4">
        <button
          type="button"
          onClick={() => switchType("expense")}
          className={`flex-1 pb-2.5 text-sm font-semibold transition ${
            isExpense ? "text-rose-600" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => switchType("income")}
          className={`flex-1 pb-2.5 text-sm font-semibold transition ${
            !isExpense ? "text-emerald-600" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Income
        </button>
        <span
          className={`absolute bottom-0 h-0.5 w-1/2 transition-all duration-200 ease-out ${palette.underline} ${
            isExpense ? "left-0" : "left-1/2"
          }`}
        />
      </div>

      {/* Amount — hero, single line */}
      <label
        className={`block rounded-xl border border-slate-200 bg-white px-4 py-3 mb-4 transition focus-within:ring-4 ${palette.ring}`}
      >
        <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-1">
          Amount
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-2xl font-semibold transition-colors ${
              amount ? palette.text : "text-slate-300"
            }`}
          >
            {symbol}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-bold text-slate-900 placeholder:text-slate-300 outline-none tabular-nums w-full min-w-0"
          />
        </div>
      </label>

      {/* Category — chip row that wraps */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
            Category
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = category === c.name;
            const Icon = c.icon;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                title={c.name}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ring-1 transition whitespace-nowrap ${
                  active
                    ? palette.tileActive
                    : "ring-slate-200 text-slate-600 hover:ring-slate-300 hover:text-slate-800 bg-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible details */}
      <button
        type="button"
        onClick={() => setShowDetails((s) => !s)}
        className="flex items-center justify-between w-full text-xs font-medium text-slate-500 hover:text-slate-700 transition mb-3"
      >
        <span>
          {date === todayISO() ? "Today" : prettyDate(date)}
          {note && <span className="text-slate-400"> · {note}</span>}
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          {showDetails ? "Hide" : "More"}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {showDetails && (
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 block mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-xs py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 block mb-1">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. coffee with sam"
              className="input text-xs py-1.5"
            />
          </div>
        </div>
      )}

      {(() => {
        const isInvalid = !amount || parseFloat(amount) <= 0;
        return (
          <button
            type="submit"
            disabled={isInvalid}
            className={`w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition active:scale-[0.98] ${
              isInvalid
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : `text-white ${palette.button}`
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : isInvalid ? (
              "Enter an amount"
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add {isExpense ? "Expense" : "Income"}
              </>
            )}
          </button>
        );
      })()}
    </form>
  );
}
