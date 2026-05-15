import { useMemo, useState, useEffect } from "react";
import { Search, Trash2, Pencil, X, Check, Inbox, Download } from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import EmptyState from "../components/EmptyState";
import { formatMoney, prettyDate } from "../lib/format";
import { categoryMeta, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/categories";

function groupByDate(txs) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const thisWeekStart = new Date(Date.now() - new Date().getDay() * 86400000).toISOString().slice(0, 10);

  const groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };
  for (const t of txs) {
    if (t.date === today) groups.today.push(t);
    else if (t.date === yesterday) groups.yesterday.push(t);
    else if (t.date >= thisWeekStart) groups.thisWeek.push(t);
    else groups.earlier.push(t);
  }
  return Object.entries(groups).filter(([, arr]) => arr.length > 0);
}

const dateLabels = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  earlier: "Earlier",
};

export default function Transactions({ transactions, onAdd, onUpdate, onDelete, currency, showAddModal }) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (showAddModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showAddModal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (q) {
        const hay = `${t.note || ""} ${t.category} ${t.date} ${t.amount}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, query, filterType, filterCat]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { income, expense };
  }, [filtered]);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  function exportCSV() {
    const header = ["Date", "Type", "Category", "Note", "Amount"];
    const rows = filtered.map((t) => [
      t.date,
      t.type,
      t.category,
      (t.note || "").replace(/"/g, '""'),
      t.amount,
    ]);
    const csv =
      [header, ...rows]
        .map((r) => r.map((c) => `"${c}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, category, amount..."
                className="input pl-9"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input sm:w-32"
            >
              <option value="all">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="input sm:w-44"
            >
              <option value="all">All categories</option>
              {allCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-sm mb-3 px-1">
            <div className="text-stone-600">
              <span className="font-semibold text-stone-900">{filtered.length}</span>{" "}
              transaction{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-semibold tabular-nums">
                +{formatMoney(summary.income, currency)}
              </span>
              <span className="text-rose-600 font-semibold tabular-nums">
                −{formatMoney(summary.expense, currency)}
              </span>
              <button
                onClick={exportCSV}
                className="btn-ghost"
                disabled={filtered.length === 0}
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No transactions"
              description={
                transactions.length === 0
                  ? "Add your first transaction to get started"
                  : "Try adjusting your filters"
              }
            />
          ) : (
            groupByDate(filtered).map(([group, txs]) => (
              <div key={group}>
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-2 py-2 sticky top-0 bg-white/90 backdrop-blur z-10 border-b border-stone-100 dark:bg-stone-900/90">
                  {dateLabels[group]}
                </div>
                <ul className="divide-y divide-stone-100">
                  {txs.map((t) => {
                    const meta = categoryMeta(t.category, t.type);
                    if (editing === t.id) {
                      return (
                        <TxEditRow
                          key={t.id}
                          tx={t}
                          onCancel={() => setEditing(null)}
                          onSave={(patch) => {
                            onUpdate(t.id, patch);
                            setEditing(null);
                          }}
                        />
                      );
                    }
                    return (
                      <li
                        key={t.id}
                        className="py-3 flex items-center gap-3 group hover:bg-stone-50 -mx-2 px-2 rounded-lg transition border-l-2 border-transparent hover:border-l-brand-400 focus-within:border-l-brand-400"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: meta.color + "22" }}
                        >
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-900 truncate">
                            {t.note || t.category}
                          </div>
                          <div className="text-xs text-stone-500">
                            {t.category} • {prettyDate(t.date)}
                            {t.recurringId ? (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-semibold">
                                RECURRING
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className={`font-semibold tabular-nums ${
                            t.type === "income" ? "text-emerald-600" : "text-stone-900"
                          }`}
                        >
                          {t.type === "income" ? "+" : "−"}
                          {formatMoney(t.amount, currency)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setEditing(t.id)}
                            className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            title="Edit"
                            aria-label="Edit transaction"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            title="Delete"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="card sticky top-32">
          <TransactionForm onAdd={onAdd} />
        </div>
      </div>
    </div>
  );
}

function TxEditRow({ tx, onCancel, onSave }) {
  const [amount, setAmount] = useState(tx.amount);
  const [note, setNote] = useState(tx.note || "");
  const [date, setDate] = useState(tx.date);
  const [category, setCategory] = useState(tx.category);

  const cats = tx.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <li className="py-3 flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="input w-36"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="input flex-1 min-w-[140px]"
      >
        {cats.map((c) => (
          <option key={c.name} value={c.name}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note"
        className="input flex-1 min-w-[140px]"
      />
      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input w-28 text-right font-semibold"
      />
      <button
        onClick={() =>
          onSave({ amount: parseFloat(amount) || 0, note: note.trim(), date, category })
        }
        className="p-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      >
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="p-2 rounded-md hover:bg-slate-100 text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </li>
  );
}
