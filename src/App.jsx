import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  History,
  Target,
  RotateCw,
  FileBarChart,
  Wallet,
  Settings as SettingsIcon,
  Plus,
  Trophy,
} from "lucide-react";
import AchievementsPage from "./components/AchievementsPage";
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
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "History", icon: History },
  { id: "goals", label: "Savings", icon: Target },
  { id: "achievements", label: "Badges", icon: Trophy },
  { id: "recurring", label: "Automation", icon: RotateCw },
  { id: "report", label: "Reports", icon: FileBarChart },
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
    darkMode: false,
  });

  const [showAddModal, setShowAddModal] = useState(false);

  const toaster = useToaster();

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setTab("transactions");
        setShowAddModal(true);
      }
      if (e.key === "Escape") {
        setShowAddModal(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (recurring.length === 0) return;
    const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
    if (newTx.length > 0) {
      setTransactions((prev) => [...newTx, ...prev]);
      setRecurring(updatedRecurring);
      toaster.show(`Added ${newTx.length} recurring transaction(s)`, "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg">
        Skip to main content
      </a>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-stone-900">Finly</h1>
              <p className="text-[11px] text-stone-500 leading-tight">Personal Finance Tracker</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-xs text-stone-500">Wallet</div>
              <div
                className={`font-bold ${totals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
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
          <div className="flex gap-1 pb-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                    active
                      ? "text-brand-700 border-brand-600 bg-brand-50/60"
                      : "text-stone-600 border-transparent hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 page-enter">
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
            showAddModal={showAddModal}
            onCloseAddModal={() => setShowAddModal(false)}
          />
        )}
        {tab === "goals" && (
          <Goals goals={goals} setGoals={setGoals} currency={settings.currency} toaster={toaster} />
        )}
        {tab === "achievements" && (
          <AchievementsPage
            transactions={transactions}
            goals={goals}
            recurring={recurring}
            budgets={budgets}
            toaster={toaster}
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 z-30 pb-safe">
        <div className="flex items-center justify-around h-16">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
            { id: "transactions", icon: History, label: "History" },
            { id: "add", icon: Plus, label: "Add", special: true },
            { id: "goals", icon: Target, label: "Savings" },
            { id: "settings", icon: SettingsIcon, label: "Settings" },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            if (item.id === "add") {
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab("transactions"); setShowAddModal(true); }}
                  className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg -mt-4"
                  aria-label="Add transaction"
                >
                  <Plus className="w-6 h-6" />
                </button>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition focus:ring-2 focus:ring-brand-400 ${
                  active ? "text-brand-600" : "text-stone-400"
                }`}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <footer className="hidden md:block text-center text-xs text-stone-400 py-4 pb-16 md:pb-4">
        Finly • Data saved locally in your browser
      </footer>

      <Toaster items={toaster.items} onDismiss={toaster.dismiss} />
    </div>
  );
}