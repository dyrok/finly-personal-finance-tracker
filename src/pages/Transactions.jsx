import { useMemo, useState } from "react";
import { Search, Trash2, Pencil, X, Check, Inbox, Download } from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import EmptyState from "../components/EmptyState";
import { formatMoney, prettyDate } from "../lib/format";
import { categoryMeta, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/categories";

const CAT_COLORS = {
  "Food & Dining": "#fff7ed", Groceries: "#f0fdf4", Transport: "#ecfeff", Housing: "#f5f3ff",
  Utilities: "#fefce8", Entertainment: "#fdf2f8", Shopping: "#fff1f2", Health: "#ecfdf5",
  Education: "#eff6ff", Travel: "#f0fdfa", Subscriptions: "#faf5ff", Savings: "#eef2ff",
  Other: "#f8fafc", Salary: "#ecfdf5", Freelance: "#ecfeff", Investment: "#f5f3ff",
  Gift: "#fdf2f8", "Other Income": "#f8fafc",
};

export default function Transactions({ transactions, onAdd, onUpdate, onDelete, currency }) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState(null);

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
    const rows = filtered.map((t) => [t.date, t.type, t.category, (t.note || "").replace(/"/g, '""'), t.amount]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="card bg-white">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions..." className="input pl-10" />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input sm:w-32">
              <option value="all">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input sm:w-44">
              <option value="all">All categories</option>
              {allCategories.map((c) => (<option key={c.name} value={c.name}>{c.icon} {c.name}</option>))}
            </select>
          </div>

          <div className="flex items-center justify-between text-sm mb-4 px-1">
            <div className="text-slate-600">
              <span className="font-semibold text-slate-900">{filtered.length}</span> transaction{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-600 font-semibold tabular-nums">+{formatMoney(summary.income, currency)}</span>
              <span className="text-rose-600 font-semibold tabular-nums">−{formatMoney(summary.expense, currency)}</span>
              <button onClick={exportCSV} className="btn-ghost" disabled={filtered.length === 0} title="Export CSV">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Inbox} title="No transactions" description={transactions.length === 0 ? "Add your first transaction to get started" : "Try adjusting your filters"} />
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {filtered.map((t, i) => {
                  const meta = categoryMeta(t.category, t.type);
                  if (editing === t.id) {
                    return <TxEditRow key={t.id} tx={t} onCancel={() => setEditing(null)} onSave={(patch) => { onUpdate(t.id, patch); setEditing(null); }} />;
                  }
                  return (
                    <li key={t.id} className={`py-3.5 px-4 flex items-center gap-3.5 group transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-slate-50`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: CAT_COLORS[t.category] || "#f8fafc" }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{t.note || t.category}</div>
                        <div className="text-xs text-slate-500">
                          {t.category} · {prettyDate(t.date)}
                          {t.recurringId && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-semibold">RECURRING</span>}
                        </div>
                      </div>
                      <div className={`font-bold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-slate-900"}`}>
                        {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, currency)}
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(t.id)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(t.id)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="card sticky top-32 bg-white">
          <TransactionForm onAdd={onAdd} currency={currency} />
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
    <li className="py-3 px-4 bg-brand-50/50 flex flex-wrap items-center gap-2">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-36 text-sm" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="input flex-1 min-w-[140px] text-sm">
        {cats.map((c) => (<option key={c.name} value={c.name}>{c.icon} {c.name}</option>))}
      </select>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="input flex-1 min-w-[140px] text-sm" />
      <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input w-28 text-right font-semibold text-sm" />
      <button onClick={() => onSave({ amount: parseFloat(amount) || 0, note: note.trim(), date, category })} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </li>
  );
}
