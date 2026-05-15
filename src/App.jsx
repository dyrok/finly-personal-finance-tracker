import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ListPlus,
  Target,
  RotateCw,
  FileBarChart,
  Wallet,
  Settings as SettingsIcon,
} from "lucide-react";
import { useLocalStorage, uid } from "./lib/storage";
import { materializeRecurring } from "./lib/recurring";
import { ym } from "./lib/format";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Goals from "./pages/Goals";
import Recurring from "./pages/Recurring";
import Report from "./pages/Report";
import SettingsPanel from "./pages/Settings";
import Toaster, { useToaster } from "./components/Toaster";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ListPlus },
  { id: "goals", label: "Goals", icon: Target },
  { id: "recurring", label: "Recurring", icon: RotateCw },
  { id: "report", label: "Report", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const DEFAULT_BUDGETS = {
  "Food & Dining": 400,
  Groceries: 350,
  Transport: 200,
  Entertainment: 150,
  Shopping: 200,
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);
  const [goals, setGoals] = useLocalStorage("ft.goals", []);
  const [recurring, setRecurring] = useLocalStorage("ft.recurring", []);
  const [budgets, setBudgets] = useLocalStorage("ft.budgets", DEFAULT_BUDGETS);
  const [settings, setSettings] = useLocalStorage("ft.settings", {
    currency: "USD",
    alertThreshold: 0.8,
  });

  const toaster = useToaster();

  useEffect(() => {
    if (recurring.length === 0) return;
    const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
    const needsUpdate =
      newTx.length > 0 ||
      updatedRecurring.some((r, i) => r.nextDate !== recurring[i]?.nextDate);
    if (needsUpdate) {
      if (newTx.length > 0) {
        setTransactions((prev) => [...newTx, ...prev]);
        toaster.show(`Added ${newTx.length} recurring transaction(s)`, "info");
      }
      setRecurring(updatedRecurring);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring.length, transactions.length]);

  const monthlyByCategory = useMemo(() => {
    const m = ym(new Date());
    const map = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (ym(t.date) !== m) continue;
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    }
    return map;
  }, [transactions]);

  const alerts = useMemo(() => {
    const list = [];
    for (const [cat, limit] of Object.entries(budgets)) {
      const spent = monthlyByCategory[cat] || 0;
      if (limit > 0) {
        const ratio = spent / limit;
        if (ratio >= 1) list.push({ category: cat, level: "over", spent, limit, ratio });
        else if (ratio >= settings.alertThreshold)
          list.push({ category: cat, level: "warn", spent, limit, ratio });
      }
    }
    return list;
  }, [budgets, monthlyByCategory, settings.alertThreshold]);

  function addTransaction(tx) {
    const full = { id: uid(), ...tx };
    setTransactions((prev) => [full, ...prev]);

    if (tx.type === "expense" && budgets[tx.category]) {
      const spentNow = (monthlyByCategory[tx.category] || 0) + Number(tx.amount);
      const limit = budgets[tx.category];
      if (spentNow >= limit) {
        toaster.show(`Budget exceeded for ${tx.category}!`, "error");
      } else if (spentNow / limit >= settings.alertThreshold) {
        toaster.show(
          `You've used ${Math.round((spentNow / limit) * 100)}% of ${tx.category} budget`,
          "warn",
        );
      } else {
        toaster.show("Transaction added", "success");
      }
    } else {
      toaster.show("Transaction added", "success");
    }
  }

  function updateTransaction(id, patch) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    toaster.show("Transaction deleted", "info");
  }

  function resetAll() {
    if (!confirm("Clear ALL data? This cannot be undone.")) return;
    setTransactions([]);
    setGoals([]);
    setRecurring([]);
    setBudgets(DEFAULT_BUDGETS);
    toaster.show("All data cleared", "info");
  }

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">Finly</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Personal Finance Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-500">Wallet</div>
              <div
                className={`font-bold text-sm ${totals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: settings.currency,
                  maximumFractionDigits: 0,
                }).format(totals.balance)}
              </div>
            </div>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto">
          <div className="flex gap-0.5 pb-1 min-w-max">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                    active
                      ? "text-brand-700 border-brand-600 bg-brand-50/60"
                      : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {tab === "dashboard" && (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            alerts={alerts}
            currency={settings.currency}
            onAddTransaction={addTransaction}
            onSwitchTab={setTab}
          />
        )}
        {tab === "transactions" && (
          <Transactions
            transactions={transactions}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
            currency={settings.currency}
          />
        )}
        {tab === "goals" && (
          <Goals
            goals={goals}
            setGoals={setGoals}
            currency={settings.currency}
            toaster={toaster}
            onAddTransaction={addTransaction}
          />
        )}
        {tab === "recurring" && (
          <Recurring
            recurring={recurring}
            setRecurring={setRecurring}
            currency={settings.currency}
            toaster={toaster}
          />
        )}
        {tab === "report" && (
          <Report transactions={transactions} budgets={budgets} currency={settings.currency} />
        )}
        {tab === "settings" && (
          <SettingsPanel
            budgets={budgets}
            setBudgets={setBudgets}
            settings={settings}
            setSettings={setSettings}
            onReset={resetAll}
            toaster={toaster}
          />
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 py-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        Finly • Data saved locally in your browser
      </footer>

      <Toaster items={toaster.items} onDismiss={toaster.dismiss} />
    </div>
  );
}
