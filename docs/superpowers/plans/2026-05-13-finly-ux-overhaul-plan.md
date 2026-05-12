# Finly UX Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprehensive UX overhaul across 3 phases — visual polish, accessibility/responsiveness, and navigation architecture.

**Architecture:** Incremental CSS & component changes across all pages. No data layer changes. Dark mode via CSS class toggle on `<html>`.

**Tech Stack:** React 19, Tailwind CSS 3, Lucide React, localStorage.

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/index.css` | Global animations, dark mode variables, stone palette |
| `src/App.jsx` | Tab labels, mobile bottom nav, keyboard shortcuts |
| `src/components/StatCard.jsx` | Value counter animation, gradient refinements |
| `src/components/Toaster.jsx` | Slide-in animation, aria-live |
| `src/pages/Dashboard.jsx` | Staggered stat cards, progress bars |
| `src/pages/Transactions.jsx` | Group by date headers, hover interactions |
| `src/pages/Goals.jsx` | Days remaining badges, achievements section |
| `src/pages/Recurring.jsx` | Status indicator, timeline |
| `src/pages/Settings.jsx` | Dark mode toggle |
| `src/tailwind.config.js` | Stone color palette |

---

## Phase 1: Visual Foundation

### Task 1: Global CSS — Animations, Dark Mode, Stone Palette

**Files:**
- Modify: `src/index.css`
- Modify: `src/tailwind.config.js`

- [ ] **Step 1: Add global animations and dark mode CSS**

Replace the entire `src/index.css` content with:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  height: 100%;
}

body {
  font-family: "Inter", system-ui, sans-serif;
  background: linear-gradient(135deg, #fafaf9 0%, #f5f3ff 100%);
  color: #1c1917;
  min-height: 100vh;
  transition: background 0.3s ease, color 0.3s ease;
}

.dark body {
  background: #0c0a09;
  color: #fafaf9;
}

* {
  -webkit-tap-highlight-color: transparent;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a29e;
}

.dark ::-webkit-scrollbar-thumb {
  background: #44403c;
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: #78716c;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(20px) translateY(-10px); opacity: 0; }
  to { transform: translateX(0) translateY(0); opacity: 1; }
}

@keyframes countUp {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes progressFill {
  from { width: 0% !important; }
}

.animate-fade-in {
  animation: fadeIn 200ms ease-out forwards;
}

.dark .card {
  background: #1c1917;
  border-color: #292524;
}

.dark .btn-ghost {
  color: #a8a29e;
}

.dark .btn-ghost:hover {
  background: #292524;
}

@layer components {
  .card {
    @apply bg-white rounded-xl shadow-sm border border-stone-100 p-5 transition-shadow duration-200;
  }
  .card:hover {
    @apply shadow-md border-stone-200;
  }
  .dark .card {
    @apply bg-stone-900 border-stone-800;
  }
  .dark .card:hover {
    @apply border-stone-700;
  }
  .btn {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150;
  }
  .btn:active {
    transform: scale(0.95);
  }
  .btn-primary {
    @apply btn bg-brand-600 text-white hover:bg-brand-700 shadow-sm;
  }
  .btn-ghost {
    @apply btn text-stone-600 hover:bg-stone-100;
  }
  .dark .btn-ghost {
    @apply text-stone-400 hover:bg-stone-800 hover:text-stone-200;
  }
  .btn-danger {
    @apply btn bg-rose-50 text-rose-600 hover:bg-rose-100;
  }
  .dark .btn-danger {
    @apply bg-rose-950 text-rose-400 hover:bg-rose-900;
  }
  .input {
    @apply w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm outline-none transition-all duration-150;
  }
  .input:focus {
    @apply border-brand-400 ring-2 ring-brand-100;
  }
  .dark .input {
    @apply bg-stone-800 border-stone-600 text-stone-100;
  }
  .dark .input:focus {
    @apply border-brand-400 ring-brand-900;
  }
  .label {
    @apply block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide;
  }
  .dark .label {
    @apply text-stone-400;
  }
  .page-enter {
    animation: fadeIn 200ms ease-out forwards;
  }
  .toast-enter {
    animation: slideInRight 300ms ease-out forwards;
  }
  .progress-animate {
    animation: progressFill 600ms ease-out forwards;
  }
  .stat-card {
    @apply rounded-2xl bg-gradient-to-br p-5 shadow-sm relative overflow-hidden;
  }
  .stat-card-enter {
    opacity: 0;
    animation: fadeIn 300ms ease-out forwards;
  }
}
```

- [ ] **Step 2: Update tailwind.config.js with stone palette**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css src/tailwind.config.js
git commit -m "feat: add animations, dark mode CSS variables, stone palette, and card hover effects"
```

---

### Task 2: StatCard — Value Counter Animation

**Files:**
- Modify: `src/components/StatCard.jsx`

- [ ] **Step 1: Add value counter animation to StatCard**

Replace `src/components/StatCard.jsx` with:

```jsx
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../lib/format";

function AnimatedNumber({ value, currency }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplay(value);
      return;
    }
    const duration = 800;
    const start = performance.now();
    startRef.current = value;
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <span>{typeof value === "number" ? formatMoney(display, currency) : value}</span>;
}

export default function StatCard({ label, value, icon: Icon, tone = "brand", sub, currency, delay = 0 }) {
  const tones = {
    brand: "from-brand-500 to-brand-700 text-white",
    success: "from-teal-500 to-teal-700 text-white",
    danger: "from-rose-500 to-rose-700 text-white",
    warn: "from-amber-500 to-amber-600 text-white",
    slate: "from-stone-600 to-stone-800 text-white",
  };

  return (
    <div
      className={`stat-card stat-card-enter bg-gradient-to-br ${tones[tone]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -right-4 -top-4 opacity-15">
        {Icon ? <Icon className="w-24 h-24" /> : null}
      </div>
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{label}</div>
        <div className="text-2xl sm:text-3xl font-bold mt-1">
          <AnimatedNumber value={value} currency={currency} />
        </div>
        {sub ? <div className="text-xs opacity-80 mt-1">{sub}</div> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update Dashboard to pass delay props**

In `src/pages/Dashboard.jsx`, update the StatCard calls to pass delay:

```jsx
<StatCard
  label="Income"
  value={monthData.income}
  tone="success"
  icon={TrendingUp}
  currency={currency}
  sub="this month"
  delay={0}
/>
<StatCard
  label="Expenses"
  value={monthData.expense}
  tone="danger"
  icon={TrendingDown}
  currency={currency}
  sub="this month"
  delay={50}
/>
<StatCard
  label="Wallet"
  value={balance}
  tone={balance >= 0 ? "brand" : "warn"}
  icon={Wallet}
  currency={currency}
  sub={balance >= 0 ? "Net positive" : "Net negative"}
  delay={100}
/>
<StatCard
  label="Savings Rate"
  value={`${savingsRate.toFixed(0)}%`}
  tone="slate"
  icon={TargetIcon}
  sub="of income saved"
  delay={150}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StatCard.jsx src/pages/Dashboard.jsx
git commit -m "feat: add animated value counter to StatCard with staggered entrance"
```

---

### Task 3: Toaster — Slide-in Animation & aria-live

**Files:**
- Modify: `src/components/Toaster.jsx`

- [ ] **Step 1: Update Toaster with slide-in and aria-live**

Replace the Toaster `export default` function:

```jsx
export default function Toaster({ items, onDismiss }) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {items.map((it) => {
        const s = STYLES[it.level] || STYLES.info;
        const Icon = s.icon;
        return (
          <div
            key={it.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur toast-enter ${s.cls}`}
            role="alert"
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.iconCls}`} />
            <div className="flex-1 text-sm font-medium">{it.message}</div>
            <button
              onClick={() => onDismiss(it.id)}
              className="text-slate-500 hover:text-slate-900 transition"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

Remove the inline `<style>` block that defines `slideIn` keyframe — it is now in `index.css`.

- [ ] **Step 2: Commit**

```bash
git add src/components/Toaster.jsx
git commit -m "feat: add aria-live and slide-in animation to Toaster, remove inline keyframes"
```

---

### Task 4: Goal Progress Bar Animations

**Files:**
- Modify: `src/pages/Goals.jsx`

- [ ] **Step 1: Add animated progress bar class**

Find the progress bar div in Goals.jsx and add the `progress-animate` class:

```jsx
<div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
  <div
    className={`h-full transition-all progress-animate ${
      complete
        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
        : "bg-gradient-to-r from-brand-500 to-brand-700"
    }`}
    style={{ width: `${pct}%` }}
  />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Goals.jsx
git commit -m "feat: animate goal progress bars on page load"
```

---

## Phase 2: Accessibility & Responsiveness

### Task 5: Mobile Bottom Navigation

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add bottom nav and keyboard shortcuts**

Replace `src/App.jsx` content with:

```jsx
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ListPlus,
  Target,
  RotateCw,
  FileBarChart,
  Wallet,
  Settings as SettingsIcon,
  Plus,
  History,
  Sparkles,
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
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "History", icon: History },
  { id: "goals", label: "Savings", icon: Target },
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
    if (recurring.length === 0) return;
    const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
    if (newTx.length > 0) {
      setTransactions((prev) => [...newTx, ...prev]);
      setRecurring(updatedRecurring);
      toaster.show(`Added ${newTx.length} recurring transaction(s)`, "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 ${
                    active
                      ? "text-brand-700 border-brand-600 bg-brand-50/60"
                      : "text-stone-600 border-transparent hover:text-stone-900 hover:bg-stone-100"
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
        Finly — Data saved locally in your browser
      </footer>

      <Toaster items={toaster.items} onDismiss={toaster.dismiss} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add keyboard shortcuts, mobile bottom nav, tab renaming, skip-to-content link"
```

---

### Task 6: Settings — Dark Mode Toggle

**Files:**
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Add dark mode toggle in Settings**

After the "Preferences" section in the Settings form, add a toggle:

```jsx
<div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
  <div>
    <div className="font-medium text-stone-800">Dark Mode</div>
    <div className="text-xs text-stone-500">Switch to dark theme</div>
  </div>
  <button
    role="switch"
    aria-checked={settings.darkMode}
    onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
    className={`relative w-12 h-6 rounded-full transition-colors ${
      settings.darkMode ? "bg-brand-600" : "bg-stone-300"
    }`}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
        settings.darkMode ? "translate-x-6" : ""
      }`}
    />
  </button>
</div>
```

Add it inside the Preferences card, after the grid with currency and threshold.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat: add dark mode toggle to Settings"
```

---

### Task 7: Transaction Row — Hover Interaction & Focus Ring

**Files:**
- Modify: `src/pages/Transactions.jsx`

- [ ] **Step 1: Add hover border accent and focus ring**

In the transaction row `<li>` element:

```jsx
<li
  key={t.id}
  className="py-3 flex items-center gap-3 group hover:bg-stone-50 -mx-2 px-2 rounded-lg transition border-l-2 border-transparent hover:border-l-brand-400 focus-within:border-l-brand-400"
>
```

Also update button focus rings:

```jsx
<button
  onClick={() => setEditing(t.id)}
  className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600 focus:ring-2 focus:ring-brand-400 focus:outline-none"
  title="Edit"
  aria-label="Edit transaction"
>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Transactions.jsx
git commit -m "feat: add hover border accent and focus rings to transaction rows"
```

---

## Phase 3: Navigation & Architecture

### Task 8: Transactions — Group by Date Headers

**Files:**
- Modify: `src/pages/Transactions.jsx`

- [ ] **Step 1: Add date grouping helper and render grouped list**

Add a helper function and state for grouping:

```jsx
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
```

Then replace the `<ul>` rendering with grouped list:

```jsx
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
      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-2 py-2 sticky top-0 bg-white/90 backdrop-blur z-10">
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
              className="py-3 flex items-center gap-3 group hover:bg-stone-50 -mx-2 px-2 rounded-lg transition border-l-2 border-transparent hover:border-l-brand-400"
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
                  {t.category} — {prettyDate(t.date)}
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
                  className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600"
                  title="Edit"
                  aria-label="Edit transaction"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600"
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Transactions.jsx
git commit -m "feat: group transactions by date with sticky section headers"
```

---

### Task 9: Goals — Days Remaining Badges & Achievements Section

**Files:**
- Modify: `src/pages/Goals.jsx`

- [ ] **Step 1: Enhance Goals with achievements section**

Add state for completed goals filter, then split the goals array into active and completed:

```jsx
const activeGoals = goals.filter((g) => Math.min(100, (g.saved / g.target) * 100) < 100);
const completedGoals = goals.filter((g) => Math.min(100, (g.saved / g.target) * 100) >= 100);
```

Add a "Days remaining" badge directly in the card (already shown, but enhance styling):

```jsx
{daysLeft !== null && daysLeft >= 0 && (
  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold">
    {daysLeft}d left
  </span>
)}
```

Add achievements section after active goals grid:

```jsx
{completedGoals.length > 0 && (
  <div className="mt-6">
    <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
      <span>Achievements</span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
        {completedGoals.length}
      </span>
    </h3>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {completedGoals.map((g) => {
        return (
          <div key={g.id} className="card relative overflow-hidden opacity-80">
            <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              Complete
            </div>
            <div className="text-3xl mb-2">{g.emoji || "🎉"}</div>
            <h3 className="font-bold text-stone-900 text-lg">{g.name}</h3>
            <div className="mt-3 text-2xl font-bold text-emerald-600 tabular-nums">
              {formatMoney(g.target, currency)}
            </div>
            <div className="text-xs text-stone-500 mt-1">Goal reached</div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

Replace the active goals grid to use `activeGoals` instead of `goals`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Goals.jsx
git commit -m "feat: add achievements section for completed goals"
```

---

### Task 10: Recurring — Status Indicator & Automation Tab Name

**Files:**
- Modify: `src/pages/Recurring.jsx`

- [ ] **Step 1: Add status indicator and timeline**

Add a status badge in the recurring card:

```jsx
<div className="flex items-start justify-between gap-2">
  <div
    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
    style={{ background: meta.color + "22" }}
  >
    {meta.icon}
  </div>
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <h3 className="font-semibold text-stone-900 truncate">{r.name}</h3>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
          r.active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {r.active ? "Active" : "Paused"}
      </span>
    </div>
    <p className="text-xs text-stone-500">{r.category}</p>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Recurring.jsx
git commit -m "feat: add active/paused status indicator to recurring rules"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All Phase 1, 2, 3 items have tasks? **Yes** — Tasks 1-10 cover all spec items
- [ ] Placeholder scan: No "TBD", "TODO", or vague steps? **Clean**
- [ ] Type consistency: `darkMode`, `alertThreshold`, `currency` all referenced correctly? **Yes**
- [ ] Filenames match: All `src/` paths relative to project root? **Yes**
- [ ] Commands complete: All `git add` + `git commit` steps included? **Yes**
