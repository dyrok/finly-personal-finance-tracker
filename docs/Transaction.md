# Transactions

**Owner:** Neel
**Files:**
- `src/pages/Transactions.jsx` — the page that lists every transaction
- `src/components/TransactionForm.jsx` — the Quick Add form (used on Dashboard and Transactions page)
- `src/lib/storage.js` — the custom hook that saves transactions to the browser

This is where the user logs money in and money out. Everything else in the app — the dashboard numbers, the charts, the reports — is computed from the list of transactions stored here.

---

## What a transaction looks like

A single transaction is just a plain JavaScript object:

```js
{
  id: "a3f8b2c1",
  type: "expense",          // "expense" or "income"
  amount: 42.50,
  category: "Food & Dining",
  note: "lunch with sam",
  date: "2026-05-11",
  recurringId: "x9z1"       // only present if it came from a recurring rule
}
```

All transactions sit in an array. The newest one is at index `0`.

---

## Where the data lives — localStorage

There is no backend. No database. No server. The list is saved in the browser's `localStorage`, which is a small key-value store that survives page refreshes.

We don't talk to `localStorage` directly all over the code. Instead, we built a custom hook called `useLocalStorage` that wraps React's `useState` and adds save/load.

```jsx
// src/lib/storage.js
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return typeof initial === "function" ? initial() : initial;
      return JSON.parse(raw);
    } catch {
      return typeof initial === "function" ? initial() : initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  }, [key, value]);

  return [value, setValue];
}
```

What this is doing:

1. **On first load**, look up the saved value under `key`. If it exists, parse it from JSON. If not, use the default.
2. **Whenever the value changes**, save it back to `localStorage` as a JSON string. The `useEffect` runs after every render where `value` changed.
3. The `try / catch` blocks are there because Safari's private mode and full disks can throw errors when writing to localStorage. We swallow those instead of crashing.

In `App.jsx`, we use it like this:

```jsx
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);
```

Same shape as `useState` — `transactions` is the current list, `setTransactions` updates it. The hook makes the save-and-load disappear into the background.

The keys used by the app:

| Key | Holds |
|---|---|
| `ft.transactions` | The list of all transactions |
| `ft.goals` | Savings goals |
| `ft.recurring` | Recurring rules |
| `ft.budgets` | Budget limits per category |
| `ft.settings` | Currency and alert threshold |

---

## Adding a transaction (Quick Add form)

The form lives in `src/components/TransactionForm.jsx`. It's used in two places:
- On the Dashboard, in a sidebar card (called with `compact={true}`)
- On the Transactions page, in the right column (called without `compact`)

### The form's state

Every field is "controlled" — meaning React holds the current value and updates it on every keystroke.

```jsx
const [type, setType] = useState("expense");
const [amount, setAmount] = useState("");
const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
const [note, setNote] = useState("");
const [date, setDate] = useState(todayISO());
```

Then in the JSX, the input reads `value` from state and writes back through `onChange`:

```jsx
<input
  type="number"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
/>
```

This pattern means React is always the source of truth for what's in the form. If you needed to clear the form, you'd just call `setAmount("")` and React would update the DOM.

### Expense vs Income toggle

There are two buttons at the top — Expense (rose) and Income (emerald). Clicking one calls `switchType(...)`. The active button has a colored underline that slides between them using a CSS transition.

```jsx
function switchType(next) {
  setType(next);
  setCategory(
    (next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].name,
  );
}
```

When the user switches type, we also reset the category to the first one in the new list, because expense categories and income categories are different.

### The submit

When the user clicks "Add Expense" (or "Add Income"), the form runs:

```jsx
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
```

- `e.preventDefault()` stops the browser from reloading the page (the default behavior for `<form>` submit)
- We parse the amount as a number and bail out if it's empty or zero
- `onAdd(...)` is a function the parent gave us as a prop. The form does not save anything itself — it just hands the data up
- Then we clear the form for the next entry
- `justAdded` flips to `true` for 1.2 seconds, changing the button to say "Added ✓"

### Where does `onAdd` go?

Up in `App.jsx`:

```jsx
function addTransaction(tx) {
  const full = { id: uid(), ...tx };
  setTransactions((prev) => [full, ...prev]);
  // ... budget alert logic
}
```

`uid()` is a small helper that returns a random string like `a3f8b2c1`. We tack on an id, then put the new transaction at the start of the array. The `useLocalStorage` hook notices the change and saves it back to the browser.

We use the spread syntax (`...prev`) to create a new array instead of mutating the old one. React only re-renders if the array reference changes — so always-new-array is the rule.

---

## The Transactions page

This is the full list. It has:

- **Search box** — filters as you type
- **Type filter** — All / Expense / Income
- **Category filter** — All or one specific category
- **Summary row** — count + totals for the filtered list
- **CSV export** button
- **The list itself** — each row shows icon, title, date, amount, and edit/delete buttons that appear on hover
- **The Add form** in a sticky sidebar on the right

### Filtering

All the filtering happens inside one `useMemo`:

```jsx
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
```

For each transaction, we check the type filter, then the category filter, then the search query. The search is a "does any of these fields contain the query" check — note, category, date, and amount are mashed together into one lowercase string (`hay`) and we look for the query in it.

`useMemo` makes sure we only re-filter when one of the inputs changes (the four things in the dependency array). If you type a single character, only `query` changes, so we re-run. If you click on the donut on the Dashboard, nothing on this tab re-runs.

### Editing a row

Each row has hidden edit and delete buttons that fade in when you hover. Clicking the pencil sets `editing = transaction.id`. When we render the list, the row matching that id gets replaced with `<TxEditRow />`:

```jsx
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
```

`TxEditRow` is its own small component. It has its own state for the editable fields. When the user clicks the green checkmark, it calls `onSave(...)` with just the changed fields. The actual update happens up in `App.jsx`:

```jsx
function updateTransaction(id, patch) {
  setTransactions((prev) =>
    prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  );
}
```

We map over every transaction. For the one with the matching id, we return a new object that's the old transaction plus the patched fields. For everyone else, we return them unchanged.

### Deleting

The trash icon just calls `onDelete(t.id)` which up in App.jsx is:

```jsx
function deleteTransaction(id) {
  setTransactions((prev) => prev.filter((t) => t.id !== id));
}
```

`.filter()` returns a new array with everything except the one we want to remove. No confirmation popup here — the small button + the fact that it's hidden until hover make accidental deletes unlikely.

### CSV export

When you click the download icon, we build a CSV string in memory and trigger a file download:

```jsx
function exportCSV() {
  const header = ["Date", "Type", "Category", "Note", "Amount"];
  const rows = filtered.map((t) => [t.date, t.type, t.category, t.note, t.amount]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

The trick:
1. Build the CSV text — each row's cells wrapped in quotes, joined by commas; rows joined by newlines
2. Wrap it in a `Blob` (think: a file-shaped object in memory)
3. Generate a fake URL for that blob using `URL.createObjectURL`
4. Create an `<a>` tag, set its `href` to that URL and `download` to the file name, click it programmatically
5. Free the URL so the browser can garbage-collect the blob

We export only the **filtered** list, so the user can search/filter to a subset and export just that.

---

## Why the form lives in App.jsx

You'll notice that `TransactionForm` doesn't actually save anything by itself. It calls `onAdd(...)`, and the function that does the real work is in `App.jsx`. This is on purpose.

If the form saved transactions itself, the Dashboard would have no way to know a new transaction was added — its KPI numbers, charts, and recent list would go stale. By keeping the array of transactions in `App.jsx` and passing it down to every page that needs it, every page automatically shows the latest data the moment it changes. This pattern is called **lifting state up**.

---

## Core Concepts Used

| Concept | What it means | Where to see it |
|---|---|---|
| **useState** | Stores a value (form field, search query, edit-mode flag) that the component "remembers" | Every input has its own `useState` |
| **useEffect** | Runs code after the component renders, used here to save to localStorage | Inside `useLocalStorage` |
| **Custom hook** | A function starting with `use` that wraps React hooks. Reusable logic in one place | `useLocalStorage` |
| **Controlled inputs** | The `<input>`'s value comes from state, and changes go through `setState` | All inputs in `TransactionForm` and `TxEditRow` |
| **Lifting state up** | Data lives in the parent, child components ask the parent to change it | `App.jsx` owns `transactions`; pages call `onAdd`, `onUpdate`, `onDelete` |
| **Spread syntax `...`** | Copies an array or object so we don't mutate the original | `[full, ...prev]`, `{ ...t, ...patch }` |
| **Array methods** | `.map`, `.filter`, `.reduce` build new arrays from old ones | `.map` in update, `.filter` in delete |
| **localStorage** | Browser's built-in key/value storage. Strings only — we use `JSON.stringify` / `JSON.parse` | Inside `useLocalStorage` |
| **Blob + URL.createObjectURL** | Browser APIs for building a downloadable file in JavaScript | `exportCSV` |
| **e.preventDefault()** | Stops the browser's default behavior (form submit refreshes the page) | Top of `handleSubmit` |

---

## My contribution

_(Fill in: which form fields, validation, filtering improvements, or bug fixes you wrote.)_

---

## Summary Table

| Feature | Where | What it does |
|---|---|---|
| Add transaction | `TransactionForm.jsx` | Picks type, amount, category, date, note. Calls `onAdd()` |
| Save to browser | `lib/storage.js` | `useLocalStorage` hook persists every change |
| Show list | `Transactions.jsx` | Renders the array as rows, hover reveals edit/delete |
| Search & filter | `Transactions.jsx` | `useMemo` filters by query + type + category |
| Edit row | `TxEditRow` | Inline form with its own state, calls `onUpdate()` |
| Delete row | trash icon | Calls `onDelete()` → `.filter()` removes from array |
| CSV export | `exportCSV()` | Builds blob in memory, triggers download |
