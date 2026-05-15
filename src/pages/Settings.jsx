import { useState } from "react";
import { Trash2, Save, Upload, Download } from "lucide-react";
import { EXPENSE_CATEGORIES, categoryMeta } from "../lib/categories";
import { formatMoney } from "../lib/format";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "CNY", "BRL"];

export default function SettingsPanel({
  budgets,
  setBudgets,
  settings,
  setSettings,
  onReset,
  toaster,
}) {
  const [draft, setDraft] = useState({ ...budgets });
  const [threshold, setThreshold] = useState(Math.round(settings.alertThreshold * 100));

  function saveBudgets() {
    const cleaned = {};
    for (const [k, v] of Object.entries(draft)) {
      const n = parseFloat(v);
      if (n > 0) cleaned[k] = n;
    }
    setBudgets(cleaned);
    setSettings({ ...settings, alertThreshold: threshold / 100 });
    toaster.show("Settings saved", "success");
  }

  function addCategory(catName) {
    setDraft((d) => ({ ...d, [catName]: d[catName] ?? 100 }));
  }

  function removeCategory(catName) {
    setDraft((d) => {
      const next = { ...d };
      delete next[catName];
      return next;
    });
  }

  function exportAll() {
    const data = {
      transactions: JSON.parse(localStorage.getItem("ft.transactions") || "[]"),
      goals: JSON.parse(localStorage.getItem("ft.goals") || "[]"),
      recurring: JSON.parse(localStorage.getItem("ft.recurring") || "[]"),
      budgets: JSON.parse(localStorage.getItem("ft.budgets") || "{}"),
      settings: JSON.parse(localStorage.getItem("ft.settings") || "{}"),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toaster.show("Backup downloaded", "success");
  }

  function importAll(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.transactions) localStorage.setItem("ft.transactions", JSON.stringify(data.transactions));
        if (data.goals) localStorage.setItem("ft.goals", JSON.stringify(data.goals));
        if (data.recurring) localStorage.setItem("ft.recurring", JSON.stringify(data.recurring));
        if (data.budgets) localStorage.setItem("ft.budgets", JSON.stringify(data.budgets));
        if (data.settings) localStorage.setItem("ft.settings", JSON.stringify(data.settings));
        toaster.show("Backup restored — reloading", "success");
        setTimeout(() => location.reload(), 800);
      } catch {
        toaster.show("Invalid backup file", "error");
      }
    };
    reader.readAsText(file);
  }

  const usedCats = Object.keys(draft);
  const available = EXPENSE_CATEGORIES.filter((c) => !usedCats.includes(c.name));

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Preferences, budgets, and data management</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">Preferences</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="input"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Budget alert threshold: {threshold}%</label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Alert when category spending crosses this share of the budget.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">Monthly Budgets</h3>
            <p className="text-xs text-slate-500">Set limits to get smart alerts</p>
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {usedCats.map((cat) => {
            const meta = categoryMeta(cat);
            return (
              <li key={cat} className="py-2.5 flex flex-wrap items-center gap-2">
                <span className="text-xl">{meta.icon}</span>
                <span className="font-medium text-slate-800 flex-1 min-w-[120px]">{cat}</span>
                <div className="relative w-28 sm:w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={draft[cat]}
                    onChange={(e) => setDraft({ ...draft, [cat]: e.target.value })}
                    className="input pl-7 text-right tabular-nums"
                  />
                </div>
                <button
                  onClick={() => removeCategory(cat)}
                  className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>

        {available.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-slate-500 mb-2">Add budget for…</div>
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button
                  key={c.name}
                  onClick={() => addCategory(c.name)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 hover:bg-brand-100 hover:text-brand-700 transition"
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Total budget:{" "}
            <span className="font-semibold text-slate-900">
              {formatMoney(
                Object.values(draft).reduce((a, b) => a + (parseFloat(b) || 0), 0),
                settings.currency,
              )}
            </span>
          </div>
          <button onClick={saveBudgets} className="btn-primary">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-1">Data</h3>
        <p className="text-xs text-slate-500 mb-4">
          Everything is stored locally in your browser. Back it up to keep it safe.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportAll} className="btn-ghost border border-slate-200">
            <Download className="w-4 h-4" />
            Export Backup
          </button>
          <label className="btn-ghost border border-slate-200 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Backup
            <input type="file" accept="application/json" onChange={importAll} className="hidden" />
          </label>
          <button onClick={onReset} className="btn-danger ml-auto">
            <Trash2 className="w-4 h-4" />
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
