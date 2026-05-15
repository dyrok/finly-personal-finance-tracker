# Monthly Report

**Owner:** Manthan
**File:** `src/pages/Report.jsx`

This page is a deeper, single-month view. The Dashboard shows the current month at a glance — this one lets the user pick any month they have transactions for and see:

- A summary of income, expenses, net balance, and savings rate
- Daily spending as a bar chart
- Category breakdown as a pie chart
- A budget-vs-actual comparison
- A detailed list of every category with progress bar

The user can also export the whole report as a plain text file.

---

## Where the data comes from

Like every other page, Report does not own any data. It receives transactions, budgets, and currency as props from `App.jsx`:

```jsx
<Report
  transactions={transactions}
  budgets={budgets}
  currency={settings.currency}
/>
```

There's no edit/delete here. Report is read-only. It just digests numbers and draws charts.

---

## The month selector

At the top right, there's a dropdown listing every month that has at least one transaction (plus the current month, even if empty). The list is sorted newest first.

```jsx
const months = useMemo(() => {
  const s = new Set(transactions.map((t) => ym(t.date)));
  s.add(ym(new Date()));
  return Array.from(s).sort().reverse();
}, [transactions]);
```

Quick breakdown:
- `transactions.map((t) => ym(t.date))` — pull just the year-month string ("2026-05") from every transaction
- `new Set(...)` — drop duplicates. Sets only hold unique values
- `s.add(ym(new Date()))` — make sure the current month is always in the list, even if no transactions yet
- `Array.from(s).sort().reverse()` — turn the set back into an array, sort alphabetically (which is also chronological for ISO dates), then reverse so newest is first

The currently selected month is stored in `useState`:

```jsx
const [month, setMonth] = useState(months[0] || ym(new Date()));
```

It defaults to the newest month available.

---

## Calculating the report data

Whenever the month changes, we recompute everything inside one big `useMemo`:

```jsx
const data = useMemo(() => {
  const txs = transactions.filter((t) => ym(t.date) === month);
  let income = 0;
  let expense = 0;
  const byCat = {};
  const byDay = {};
  for (const t of txs) {
    const amt = Number(t.amount);
    if (t.type === "income") income += amt;
    else {
      expense += amt;
      byCat[t.category] = (byCat[t.category] || 0) + amt;
      const day = t.date.slice(8, 10);
      byDay[day] = (byDay[day] || 0) + amt;
    }
  }
  // ... build catData and dailyData arrays
}, [transactions, month]);
```

In one pass through the transactions:
- Add to total income if it's income
- Add to total expense + the per-category bucket + the per-day bucket if it's an expense

`t.date.slice(8, 10)` grabs the day part of an ISO date like `"2026-05-11"` — characters 8 and 9 are `"11"`.

### Building the daily chart array

The daily chart needs a bar for **every** day of the month, not just the days with transactions. So we build a 30-or-31-element array:

```jsx
const daysInMonth = new Date(
  Number(month.split("-")[0]),
  Number(month.split("-")[1]),
  0,
).getDate();
const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { day: d, amount: byDay[d] || 0 };
});
```

The trick `new Date(year, month, 0)` gives the **last day** of the previous month — JavaScript Date quirk. By passing `month` as the actual month number (not zero-indexed), we get the last day of the month we actually want. So for May, it returns May 31.

`Array.from({ length: n }, (_, i) => ...)` creates an array of length `n`, filling each slot with the result of the callback. Used here to generate one bar per day.

### Sorting the category data

```jsx
const catData = Object.entries(byCat)
  .map(([name, value]) => ({ name, value, color: categoryMeta(name).color }))
  .sort((a, b) => b.value - a.value);
```

Turn the `{ Food: 200, Transport: 50 }` map into `[{name: "Food", value: 200, color}, ...]`, then sort descending by amount so the pie chart shows biggest slices first.

---

## The four summary metrics

Four colored tiles at the top of the report:

| Metric | Calc | Tone |
|---|---|---|
| Income | sum of `type === "income"` | emerald |
| Expenses | sum of `type === "expense"` | rose |
| Net Balance | income − expense | brand (positive) or amber (negative) |
| Savings Rate | `(balance / income) × 100` | slate |

```jsx
const balance = data.income - data.expense;
const savingsRate = data.income > 0 ? (balance / data.income) * 100 : 0;
```

The `data.income > 0 ? ... : 0` check avoids dividing by zero, which would give `NaN` ("Not a Number") and look broken.

Each tile is rendered with a small inline `Metric` component at the bottom of the file. It picks a color scheme based on a `tone` prop.

---

## The three charts

### 1. Daily Spending (Bar chart)

A vertical bar for each day of the month, height proportional to expense.

```jsx
<BarChart data={data.dailyData}>
  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
  <XAxis dataKey="day" interval={2} />
  <YAxis />
  <Tooltip formatter={(v) => formatMoney(v, currency)} />
  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
</BarChart>
```

`interval={2}` skips every other label on the X-axis so it doesn't get crowded with 30 labels. `radius={[4, 4, 0, 0]}` rounds the top of each bar (the four values are top-left, top-right, bottom-right, bottom-left). The tooltip uses `formatMoney(v, currency)` to show the amount with the right currency symbol.

### 2. Category Breakdown (Pie chart)

```jsx
<Pie
  data={data.catData}
  dataKey="value"
  nameKey="name"
  outerRadius={95}
  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
  labelLine={false}
>
  {data.catData.map((e) => <Cell key={e.name} fill={e.color} />)}
</Pie>
```

`<Cell />` is how you set a different color per slice. We map over the data and emit one `<Cell />` per category, using the color we attached earlier (from `categoryMeta`).

The `label` prop is a function that returns the text to render next to each slice. We show category name + percentage. `labelLine={false}` removes the little lines that usually connect labels to slices — they tend to look messy.

### 3. Budget vs Actual (horizontal bar chart)

This compares what the user budgeted versus what they actually spent, one row per category.

```jsx
const budgetCompare = useMemo(() => {
  return Object.entries(budgets).map(([cat, limit]) => {
    const spent = data.catData.find((c) => c.name === cat)?.value || 0;
    return {
      category: cat,
      budget: limit,
      spent,
      remaining: Math.max(0, limit - spent),
      over: Math.max(0, spent - limit),
    };
  });
}, [budgets, data.catData]);
```

For every category that has a budget, we look up how much was actually spent (or 0 if nothing) and build a row.

The chart itself uses `layout="vertical"` to flip Recharts' default. Each row has two bars side by side — gray for the budget limit, indigo for the actual spent. You can tell at a glance which categories went over.

---

## The category details list

Below the charts, every expense category for the month is listed with:

- Colored icon + name
- Amount
- A horizontal progress bar showing this category's share of total expenses
- Percentage label

```jsx
{data.catData.map((c) => {
  const pct = (c.value / data.expense) * 100;
  const meta = categoryMeta(c.name);
  return (
    <li key={c.name}>
      <span style={{ background: meta.color + "22" }}>
        <meta.icon style={{ color: meta.color }} />
      </span>
      <span>{c.name}</span>
      <span>{formatMoney(c.value, currency)}</span>
      <div style={{ width: `${pct}%`, background: c.color }} />
      <span>{pct.toFixed(1)}% of expenses</span>
    </li>
  );
})}
```

The bar's color matches the category color. `meta.color + "22"` is a small CSS trick — appending `"22"` to a hex color makes it semi-transparent (the last two hex chars are alpha, where `22` is about 13% opacity). Used as a light tinted background behind the icon.

---

## Exporting the report

Clicking the Export button generates a plain `.txt` file with all the summary stats and category totals.

```jsx
function exportReport() {
  const lines = [];
  lines.push(`Monthly Financial Report — ${ymLabel(month)}`);
  lines.push("");
  lines.push(`Total Income:   ${formatMoney(data.income, currency)}`);
  lines.push(`Total Expenses: ${formatMoney(data.expense, currency)}`);
  lines.push(`Net Balance:    ${formatMoney(balance, currency)}`);
  lines.push(`Savings Rate:   ${savingsRate.toFixed(1)}%`);
  lines.push(`Transactions:   ${data.count}`);
  lines.push("");
  lines.push("Spending by Category:");
  for (const c of data.catData) {
    lines.push(`  ${c.name.padEnd(20)} ${formatMoney(c.value, currency)}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${month}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
```

The pattern:
1. Build the file content as an array of lines, then join with newlines
2. Wrap it in a `Blob` — a file-shaped object in memory
3. Create a temporary URL with `URL.createObjectURL`
4. Create a fake `<a>` element with `download` set to the file name, click it programmatically
5. Free the URL when done

`padEnd(20)` adds spaces to the right of the category name so the amounts line up in a column. The text file ends up looking like:

```
Monthly Financial Report — May 2026

Total Income:   ₹10,000.00
Total Expenses: ₹464.00
Net Balance:    ₹9,536.00
Savings Rate:   95.4%
Transactions:   3

Spending by Category:
  Subscriptions        ₹299.00
  Food & Dining        ₹165.00
```

Same pattern is used in `Transactions.jsx` for CSV export and in `Settings.jsx` for JSON backup. It's the standard JavaScript way to make a "save file" feature without a backend.

---

## Empty state

If the selected month has zero transactions, we don't render any charts — just an empty state with a friendly message:

```jsx
{data.count === 0 ? (
  <EmptyState
    icon={FileBarChart}
    title="No transactions this month"
    description="Pick another month or log a transaction to see your report."
  />
) : (
  // charts + tables
)}
```

This protects against drawing an empty pie chart (which Recharts renders as a single gray circle, looks like a bug) or division-by-zero issues in the percentage math.

---

## Core Concepts Used

| Concept | What it means | Where to see it |
|---|---|---|
| **useState** | Stores the currently selected month | `const [month, setMonth] = useState(...)` |
| **useMemo** | Caches expensive calculations so they don't run every render. Used here for filtering + grouping all month data | `data`, `months`, `budgetCompare` |
| **Set** | A JavaScript collection that holds only unique values. Used to drop duplicate months | `new Set(transactions.map(...))` |
| **Array.from with mapper** | Build a fixed-length array with a generator function | Daily bars: `Array.from({ length: 31 }, ...)` |
| **Object.entries** | Turn `{a: 1, b: 2}` into `[["a", 1], ["b", 2]]` so we can map/sort it | Building category and budget arrays |
| **Recharts** | The chart library. We give it data, it draws SVG. Used for `BarChart`, `PieChart` | All three charts |
| **Conditional rendering** | Show empty state when data is empty, otherwise show charts | `{data.count === 0 ? <Empty /> : <Charts />}` |
| **Blob + URL.createObjectURL** | Browser APIs that let us build a file in JavaScript and trigger a download | `exportReport()` |
| **String formatting** | `padEnd`, `slice`, template literals for clean text output | inside `exportReport` |
| **Hex alpha trick** | Appending `"22"` to a hex color gives ~13% opacity — a quick way to make a tinted background from a brand color | `style={{ background: color + "22" }}` |

---

## My contribution

_(Fill in: which charts, the export, the budget-vs-actual logic, or any visual tweaks you wrote.)_

---

## Summary Table

| Section | What it shows | Key code |
|---|---|---|
| Month picker | Every month with transactions, newest first | `new Set(...).sort().reverse()` |
| Summary tiles | Income, Expenses, Net, Savings Rate | `<Metric />` component |
| Daily Spending chart | Bar per day of the month | `BarChart` + `byDay` bucket |
| Category Pie | Slice per expense category, color-coded | `PieChart` + `<Cell />` per slice |
| Budget vs Actual | Horizontal bars, budget vs spent | `BarChart layout="vertical"` |
| Category Details | List with icon, amount, progress bar | `data.catData.map(...)` |
| Export | Text file download | `Blob` + `URL.createObjectURL` |
| Empty state | When no transactions in selected month | `<EmptyState />` |
