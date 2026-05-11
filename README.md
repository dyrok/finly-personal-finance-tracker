# Finly — Personal Finance Tracker

A clean, fast, fully client-side personal finance tracker built with **React**, **Tailwind CSS**, and **Recharts**. No backend, no database — everything lives in your browser's `localStorage`.

![Finly Dashboard](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-8884d8)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Expense Logging** | Log expenses and income across 17 categories with emoji icons |
| 2 | **Income vs Expense Summary** | Live stat cards + 6-month area chart |
| 3 | **Spending Charts** | Pie chart by category + daily bar chart in reports |
| 4 | **Savings Goals** | Create goals with targets, deadlines, and a one-click fund button |
| 5 | **Recurring Transactions** | Auto-materialize daily/weekly/monthly/yearly rules on app load |
| 6 | **Budget Alerts** | Configurable threshold toasts when you approach or exceed a budget |
| 7 | **Transaction History** | Full-text search, type/category filters, inline edit, CSV export |
| 8 | **Monthly Report** | Per-month breakdown with budget vs actual chart + text export |

---

## Tech Stack

- **React 19** — UI with hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
- **Vite 8** — lightning-fast dev server and build tool
- **Tailwind CSS 3** — utility-first styling with a custom brand palette
- **Recharts 2** — Area, Bar, and Pie charts with responsive containers
- **lucide-react** — icon library
- **localStorage** — zero-backend persistence via a custom `useLocalStorage` hook

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repo
git clone https://github.com/dyrok/finly-personal-finance-tracker.git
cd finly-personal-finance-tracker

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Project Structure

```
src/
├── App.jsx                    # Root component — owns all state, routing
├── index.css                  # Tailwind base + custom component classes
│
├── lib/
│   ├── storage.js             # useLocalStorage custom hook + uid()
│   ├── format.js              # formatMoney, prettyDate, ym() helpers
│   ├── categories.js          # Expense & income categories with icons/colors
│   └── recurring.js           # materializeRecurring — auto-creates missed transactions
│
├── components/
│   ├── TransactionForm.jsx    # Reusable add-transaction form (expense/income)
│   ├── StatCard.jsx           # Gradient summary tile (income, expense, balance)
│   ├── EmptyState.jsx         # Generic empty-list placeholder
│   └── Toaster.jsx            # Toast notification system + useToaster hook
│
└── pages/
    ├── Dashboard.jsx          # Overview: stats, charts, quick-add, recent txs
    ├── Transactions.jsx       # History: search, filter, edit, delete, CSV export
    ├── Goals.jsx              # Savings goals with progress bars and deadlines
    ├── Recurring.jsx          # Recurring rules: create, pause, delete
    ├── Report.jsx             # Monthly report: daily chart, pie, budget comparison
    └── Settings.jsx           # Budgets, currency, alert threshold, data backup
```

---

## Key Design Decisions

### State management without Redux
All application state lives in `App.jsx` and is persisted via a custom `useLocalStorage` hook. State is lifted to the common ancestor (`App`) and passed down as props — no external state library needed for an app of this size.

### Tab-based routing without React Router
Navigation is a single `tab` string in state. The URL does not change, which trades deep-linking for zero-dependency simplicity — acceptable for a local-only tool.

### Immutable state updates
Every state mutation creates new arrays/objects using `Array.map`, `Array.filter`, and the spread operator. This is required for React to detect changes and re-render correctly.

### localStorage persistence
The `useLocalStorage` hook initialises state from `localStorage` using a lazy initializer (runs once on mount) and syncs back via `useEffect` whenever the value changes. All reads are wrapped in try/catch to handle private-browsing restrictions.

---

## Data Model

```js
// Transaction
{
  id: "a3f8b2c1",         // uid()
  type: "expense",         // "expense" | "income"
  amount: 42.50,
  category: "Food & Dining",
  note: "lunch",
  date: "2026-05-11",
  recurringId: "x9z1"     // optional — links to a recurring rule
}

// Goal
{
  id: "g7h2k9",
  name: "Emergency Fund",
  emoji: "🎯",
  target: 5000,
  saved: 1200,
  deadline: "2026-12-31", // optional ISO date
  note: "6 months expenses",
  createdAt: "2026-01-01T00:00:00.000Z"
}

// Recurring rule
{
  id: "r4m5n6",
  name: "Netflix",
  type: "expense",
  amount: 15.99,
  category: "Subscriptions",
  frequency: "monthly",   // daily | weekly | biweekly | monthly | yearly
  nextDate: "2026-06-11",
  active: true
}
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR at localhost:5173 |
| `npm run build` | Build optimised production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Viva / Study Guide

A comprehensive React Q&A guide covering all hooks, component patterns, and JavaScript concepts used in this codebase is available in [`VIVA.md`](./VIVA.md).

---

## License

MIT — free to use, modify, and distribute.
