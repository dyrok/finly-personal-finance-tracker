# Dashboard

**Owner:** Neel
**File:** `src/pages/Dashboard.jsx`

The Dashboard is the first screen the user sees. It answers four questions at a glance:
"How much did I earn this month?", "How much did I spend?", "What's left?", and "Where did the money go?"

Nothing on this page lets you edit data. It only shows numbers and charts. All the editing happens on the other tabs.

---

## What's on the page

From top to bottom:

1. **A heading** — "Overview" and today's date
2. **Four KPI cards** — Income, Expenses, Net Balance, Savings Rate. Each has a tiny chart (sparkline) on the right
3. **Budget alerts** — only appears if the user is close to or over a budget limit
4. **Cash Flow chart** — a line chart for the last 1 / 3 / 6 / 12 months (you can toggle the range)
5. **Quick Add form** — the same form as the Transactions tab, but small. Lets you log a transaction without leaving the dashboard
6. **Top Categories** — a donut chart of what you spent on this month
7. **Recent Activity** — the last 5 transactions
8. **Savings Goals** — small preview cards, only if you have any goals

---

## How data flows in

The Dashboard component does not store any data of its own. The `App.jsx` file at the top of the app keeps everything in one place — transactions, budgets, goals, settings — and passes them down to Dashboard as **props** (inputs to a component).

```jsx
// from App.jsx
<Dashboard
  transactions={transactions}
  budgets={budgets}
  goals={goals}
  alerts={alerts}
  currency={settings.currency}
  onAddTransaction={addTransaction}
  onSwitchTab={setTab}
/>
```

Think of `Dashboard` as a window. It reads the numbers it's handed and draws them. When the user adds a transaction via Quick Add, the Dashboard calls the function `onAddTransaction` that came in as a prop — it doesn't change the list itself. The parent (`App.jsx`) is the one that actually adds the transaction. This pattern is called **lifting state up**.

---

## The KPI cards

There are four cards in a row. Each one calls the same internal component called `KpiCard`. You only see the differences (label, value, color) because each card is given different props.

```jsx
<KpiCard
  label="Income"
  value={monthData.income}
  currency={currency}
  previous={lastMonthData.income}
  icon={TrendingUp}
  accent="emerald"
  sparklineKey="income"
  trend={trendForSpark}
  positiveIsGood
/>
```

Inside the card we calculate a few things:

- **The delta pill** — small badge like `↑ 12%` showing how this month compares to last month. If there was no spending or income last month, we show "New" instead because comparing to zero would give a fake-looking "100%".
- **The sparkline** — a tiny chart on the right that shows the last 6 months of this single metric. It uses Recharts (a chart library) under the hood.
- **The progress ring** — only on the Savings Rate card, because there is no sparkline data to show. It draws a circle that fills as the rate gets closer to 100%.

### How the monthly totals are calculated

We loop through every transaction and add the amount to either `income` or `expense` if its date is in the current month.

```jsx
const monthData = useMemo(() => {
  const txs = transactions.filter((t) => ym(t.date) === currentMonth);
  let income = 0;
  let expense = 0;
  const byCat = {};
  for (const t of txs) {
    if (t.type === "income") income += Number(t.amount);
    else {
      expense += Number(t.amount);
      byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
    }
  }
  // ...
}, [transactions, currentMonth]);
```

`useMemo` is a React feature that means "only re-run this calculation when the inputs change". If `transactions` and `currentMonth` haven't changed, React reuses the answer it computed last time. This keeps the page fast when the user types in the Quick Add form (which would otherwise re-render everything constantly).

The `ym()` helper turns a date like `2026-05-11` into `2026-05` so we can group by year-month.

---

## The Cash Flow chart

This is the big chart in the middle. It shows two lines — green for income, rose for expense — for the selected range.

### The range selector

There's a small pill at the top right of the chart: `1M / 3M / 6M / 12M`. Tapping a pill changes the range, and the chart redraws.

```jsx
const [range, setRange] = useState(defaultRange);
```

`useState` is React's way of remembering a value across re-renders. `range` starts at `defaultRange` (which is picked based on how much data exists — 6M if there are 6+ months of data, otherwise 3M or 1M). When the user clicks a pill, we call `setRange("3M")` and React redraws the chart with the new value.

### Building the chart data

We rebuild the chart data whenever the range changes:

```jsx
const trendForChart = useMemo(() => {
  const months = RANGE_OPTIONS.find((r) => r.key === range)?.months || 6;
  return buildTrend(months);
}, [transactions, range]);
```

`buildTrend` walks backwards from today, builds an empty bucket for each month, then drops every transaction into its month bucket. The result is an array like:

```js
[
  { month: "2025-12", income: 0,     expense: 0,   label: "Dec" },
  { month: "2026-01", income: 0,     expense: 0,   label: "Jan" },
  // ...
  { month: "2026-05", income: 10000, expense: 464, label: "May" },
]
```

Recharts takes that array and draws two lines from it.

### The custom tooltip

When you hover over a point, a small box appears showing Income, Expense, and Net for that month. That box is a custom React component called `ChartTooltip` that Recharts calls with the hovered data:

```jsx
<Tooltip content={<ChartTooltip currency={currency} />} />
```

---

## Top Categories (the donut)

This shows what the user spent on this month, broken down by category.

```jsx
const pieData = Object.entries(byCat)
  .map(([name, value]) => ({ name, value, color: categoryMeta(name).color }))
  .sort((a, b) => b.value - a.value);
```

We turn the category totals into an array, attach the color from `categories.js` to each one, and sort biggest-first.

The donut comes from Recharts' `PieChart`. The hole in the middle is created by setting `innerRadius={58}` and `outerRadius={80}`. We absolutely-position a label inside the hole showing the total spent — Recharts itself doesn't draw that, we do it manually with HTML on top of the chart.

Below the donut is a list of the top 5 categories with a colored icon, the category name, the percentage, and the amount.

---

## Recent Activity

Just the first five entries from the `transactions` array. The newest are at the top because every time a transaction is added (in `App.jsx`), we put it at the start with `[newTx, ...prev]`.

Each row shows a colored icon (Lucide icon tinted with the category color), the note or category, the date, and the amount. Income is green, expense is dark slate. No editing or deleting here — that's on the Transactions tab. Clicking "View all" calls `onSwitchTab("transactions")` which is just `setTab("transactions")` up in `App.jsx`.

---

## Savings Goals preview

If the user has any goals, this section shows up to three of them with a progress bar. Clicking "Manage" switches to the Goals tab. Nothing is editable from here — it's a peek.

---

## Animations

When the dashboard first loads, the four KPI cards slide up and fade in one after another (about 40ms apart). This is done with a CSS class called `.reveal` defined in `src/index.css`:

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal { animation: reveal 250ms ease-out both; }
```

It's wrapped in `@media (prefers-reduced-motion: no-preference)` so users who have turned off motion in their OS settings see the cards appear instantly. That's an accessibility detail.

---

## Core Concepts Used

| Concept | What it means | Where to see it |
|---|---|---|
| **Component** | A reusable chunk of UI written as a JavaScript function | `Dashboard()`, `KpiCard()`, `ChartTooltip()` |
| **Props** | Inputs passed into a component, like function arguments | `<KpiCard label="Income" value={...} />` |
| **useState** | React's memory — stores a value between re-renders | `const [range, setRange] = useState(...)` |
| **useMemo** | "Only redo this calculation when the inputs change" — used for expensive math like building chart data | `monthData`, `trendForChart` |
| **Conditional rendering** | Show something only if a condition is true | `{alerts.length > 0 && <AlertsBlock />}` |
| **Lists with `.map()`** | Turn an array of data into a list of React elements | `monthData.pieData.map(...)` |
| **Lifting state up** | Keeping the data in a parent component and passing it down | `App.jsx` owns `transactions`, Dashboard reads them |
| **Recharts** | Third-party chart library. We give it data, it draws SVG charts | `LineChart`, `PieChart`, `AreaChart` |
| **Lucide icons** | Icon library — vector icons that scale and color cleanly | `<TrendingUp />`, `<Wallet />` |
| **Tailwind CSS** | Utility-first CSS. Classes like `bg-white p-4` style the element directly | Almost every `className=` you see |

---

## My contribution

_(Fill in: which sections you built, which bugs you hunted down, anything you redesigned or refactored.)_

---

## Summary Table

| Section | What it does | Key code |
|---|---|---|
| Heading | Page title + today's date | Top of `Dashboard.jsx` |
| KPI cards | 4 cards with number + sparkline + delta vs last month | `<KpiCard />` × 4 |
| Budget alerts | Pills for over-budget categories | Reads `alerts` prop from App.jsx |
| Cash Flow chart | Line chart, 1M/3M/6M/12M toggle | `<LineChart />` + `<RangeSelector />` |
| Quick Add | Form embedded from Transactions feature | `<TransactionForm compact />` |
| Top Categories | Donut + list of biggest categories | `<PieChart />` |
| Recent Activity | Last 5 transactions, read-only | `transactions.slice(0, 5).map(...)` |
| Savings Goals | Up to 3 goals with progress bar | Reads `goals` prop |
