# Finly — React Viva Q&A Guide

> Project: Personal Finance Tracker built with React, Tailwind CSS, Recharts, and localStorage.
> Repo: https://github.com/dyrok/finly-personal-finance-tracker

---

## Section 1 — React Hooks

---

### Q1. What is `useState` and how is it used in this project?

`useState` is a Hook that lets a function component own local state. It returns `[currentValue, setter]`.

**Example from `App.jsx:40`:**
```jsx
const [tab, setTab] = useState("dashboard");
```
`tab` drives which page renders. Calling `setTab("transactions")` re-renders `App` with the new value.

**Example from `Goals.jsx:8-9`:**
```jsx
const [showForm, setShowForm] = useState(false);
const [editing, setEditing] = useState(null);
```
`showForm` toggles the new-goal form. `editing` holds the `id` of whichever goal card is in edit mode — `null` means none.

---

### Q2. What is `useEffect` and what are its dependency rules?

`useEffect` runs a side-effect after the component paints. The second argument is the dependency array:

| Dependency array | When it runs |
|---|---|
| `[]` | Once on mount only |
| `[dep]` | Whenever `dep` changes |
| Omitted | After every render |

**Example from `App.jsx:52-61`:**
```jsx
useEffect(() => {
  if (recurring.length === 0) return;
  const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
  if (newTx.length > 0) {
    setTransactions((prev) => [...newTx, ...prev]);
    setRecurring(updatedRecurring);
  }
}, []); // ← empty array: run once on mount
```
This checks whether any recurring rules have missed dates since the last visit and auto-creates transactions for them. The empty array prevents it from running on every re-render. The `eslint-disable` comment suppresses the exhaustive-deps warning deliberately — we only want this on first load.

**Example from `storage.js:14-20`:**
```jsx
useEffect(() => {
  localStorage.setItem(key, JSON.stringify(value));
}, [key, value]);
```
Every time `value` or `key` changes, this syncs it to `localStorage`.

---

### Q3. What is `useMemo` and why is it used instead of computing inside the render?

`useMemo` caches the result of a pure computation and only recomputes when its dependencies change. It prevents expensive calculations from running on every render caused by unrelated state changes.

**Example from `App.jsx:63-72`:**
```jsx
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
```
This iterates every transaction to build the category-spending map. Without `useMemo` it would run every time `tab` changes, even though `transactions` hasn't changed.

**Example from `Dashboard.jsx:53-73`:**
```jsx
const last6Months = useMemo(() => {
  // builds 6-month income/expense buckets
}, [transactions]);
```
Only recomputes when the `transactions` array changes.

---

### Q4. What is `useCallback` and where is it used?

`useCallback` memoizes a function reference so it stays the same between renders. Useful when passing callbacks to child components that use reference equality to decide whether to re-render.

**Example from `Toaster.jsx:7-13`:**
```jsx
const show = useCallback((message, level = "info", duration = 3500) => {
  const id = Math.random().toString(36).slice(2, 9);
  setItems((prev) => [...prev, { id, message, level }]);
  setTimeout(() => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, duration);
}, []);
```
`show` has an empty dependency array so it is created once. If `App` passed a new function reference on every render, any component receiving it would be forced to re-render unnecessarily.

---

### Q5. What is a custom Hook? Write one and explain it.

A custom Hook is a function whose name starts with `use` that calls other Hooks. It lets you extract and reuse stateful logic across components.

**`useLocalStorage` from `storage.js:3-23`:**
```jsx
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
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```
It wraps `useState` + `useEffect` to give any component a `[value, setValue]` pair that automatically persists to and reads from `localStorage`. Used 5 times in `App.jsx` (transactions, goals, recurring, budgets, settings).

**`useToaster` from `Toaster.jsx:4-19`:** manages the toast queue (an array of `{id, message, level}`), exposes `show()` and `dismiss()`, and auto-removes after a timeout.

---

### Q6. What is a lazy initializer in `useState` and why does `useLocalStorage` use one?

You can pass a *function* to `useState(() => expensiveComputation())`. React calls it only once (during mount). If you pass a value directly, it is evaluated on every render even though only the first evaluation matters.

```jsx
// ✅ Lazy initializer — function form (runs once):
const [value, setValue] = useState(() => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : initial;
});

// ❌ Without lazy init — runs on every render (wasteful):
const raw = localStorage.getItem(key);
const [value, setValue] = useState(raw ? JSON.parse(raw) : initial);
```

---

## Section 2 — Routing (Tab-Based Navigation)

---

### Q7. This project doesn't use React Router — how is navigation implemented?

Navigation is done with a single `tab` state string in `App.jsx` and conditional rendering:

```jsx
const [tab, setTab] = useState("dashboard");

// In JSX:
{tab === "dashboard"   && <Dashboard ... />}
{tab === "transactions" && <Transactions ... />}
{tab === "goals"       && <Goals ... />}
```

Each tab button calls `setTab(t.id)`. React unmounts the old page and mounts the new one. This is a **Single-Page Application (SPA) without a router** — it keeps everything in memory, which is fine since all data is in `localStorage`.

**What would you lose without React Router?**
- The URL never changes → users can't bookmark a specific page
- Browser back/forward buttons don't work
- Deep-linking (e.g. sharing `/goals`) is impossible

---

### Q8. How does the active tab get its highlighted style?

```jsx
// App.jsx:169-186
{TABS.map((t) => {
  const active = tab === t.id;
  return (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      className={`... ${
        active
          ? "text-brand-700 border-brand-600 bg-brand-50/60"
          : "text-slate-600 border-transparent hover:bg-slate-100"
      }`}
    >
```

Ternary conditional class selection: when `tab === t.id` is `true`, the active styles are applied; otherwise the inactive styles. Tailwind resolves these as static utility classes at build time.

---

## Section 3 — Component Architecture & Props

---

### Q9. What is the difference between props and state?

| | State | Props |
|---|---|---|
| Owned by | The component itself | Parent component |
| Mutable by | The component (via setter) | Read-only |
| Example | `const [tab, setTab] = useState(...)` | `<Dashboard alerts={alerts} />` |

In this project, `App` owns all data state (`transactions`, `goals`, etc.) and passes it down as props. Child pages never own data — they call callbacks like `onAdd`, `onDelete` passed from `App`.

---

### Q10. What is "lifting state up" and where does this project do it?

When two sibling components need to share state, you move it to their closest common ancestor. The ancestor owns the state and passes it down via props.

**Example:** Both `Dashboard` and `Transactions` need the `transactions` array. Instead of duplicating it, `App` owns it and passes it to both. When `Transactions` calls `onAdd(tx)`, `App`'s `addTransaction` runs, updating the single source of truth, and `Dashboard` automatically re-renders with the new data.

```jsx
// App.jsx owns state:
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);

// Passed to both pages:
<Dashboard transactions={transactions} onAddTransaction={addTransaction} />
<Transactions transactions={transactions} onAdd={addTransaction} />
```

---

### Q11. What is a controlled component?

A controlled component is a form element whose value is driven by React state — React is the "single source of truth" for the input value.

**Example from `TransactionForm.jsx`:**
```jsx
const [amount, setAmount] = useState("");

<input
  type="number"
  value={amount}                               // controlled: state → input
  onChange={(e) => setAmount(e.target.value)}  // input → state
/>
```

Every keystroke updates state; state drives the display. The opposite — an *uncontrolled* component — would use a `ref` and let the DOM own the value.

---

### Q12. What is conditional rendering and give three patterns used in this project?

**Pattern 1 — Short-circuit (`&&`):**
```jsx
// Goals.jsx:76-80
{complete && (
  <div className="...">Complete 🎉</div>
)}
```

**Pattern 2 — Ternary (`? :`):**
```jsx
// Goals.jsx:50-63
{goals.length === 0 && !showForm ? (
  <EmptyState ... />
) : (
  <div className="grid ...">...</div>
)}
```

**Pattern 3 — Equality check for page routing:**
```jsx
// App.jsx:192-235
{tab === "dashboard" && <Dashboard ... />}
{tab === "report"    && <Report ... />}
```

---

### Q13. What is the `key` prop and why does it matter?

`key` is a special prop that helps React identify which list items have changed, been added, or removed. React uses it to reconcile the virtual DOM efficiently.

**Example from `App.jsx:173`:**
```jsx
{TABS.map((t) => (
  <button key={t.id} ...>
```

**Example from `Toaster.jsx:48`:**
```jsx
{items.map((it) => (
  <div key={it.id} ...>
```

Using the unique `id` (not the array index) means React can correctly match old and new DOM nodes even when items are removed from the middle of the list. Using index as key would cause toast animations to glitch when a toast is dismissed from the middle of the stack.

---

## Section 4 — Data Flow & Immutability

---

### Q14. Why does the code always spread (`...`) or create new arrays instead of mutating directly?

React state updates must replace the reference, not mutate it. If you mutate an array/object in place, React sees the same reference and skips the re-render.

**Example from `Goals.jsx:24-27`:**
```jsx
function adjustSaved(id, delta) {
  setGoals((prev) =>
    prev.map((g) => g.id === id
      ? { ...g, saved: Math.max(0, Number(g.saved) + delta) }  // ✅ new object
      : g
    )
  );
}
```
`prev.map(...)` creates a new array. `{ ...g, saved: ... }` creates a new goal object. The old array and objects are untouched.

**Wrong (mutation — silently breaks React):**
```js
const goal = goals.find(g => g.id === id);
goal.saved += delta;   // ❌ mutates existing object
setGoals(goals);       // same array reference → React skips update
```

---

### Q15. What is a functional updater form of `setState` and when should you use it?

When the new state depends on the old state, pass a function to the setter instead of a value. This guarantees you get the latest state even in async/batched scenarios.

**Example from `App.jsx:90`:**
```jsx
setTransactions((prev) => [full, ...prev]);
```
`prev` is guaranteed to be the latest transactions array at the time of execution.

```js
// ❌ Risky — snapshot could be stale after batched updates:
setTransactions([newTx, ...transactions]);

// ✅ Safe — always uses latest state:
setTransactions((prev) => [newTx, ...prev]);
```

---

## Section 5 — Performance & Architecture

---

### Q16. What is component composition and how is it used in this project?

Composition means building complex UIs by combining smaller, focused components.

| Component | Where reused |
|---|---|
| `EmptyState` | Dashboard, Transactions, Goals, Recurring, Report |
| `StatCard` | Dashboard (Income, Expenses, Balance, Savings Rate) |
| `TransactionForm` | Dashboard quick-add panel + full Transactions page |

`EmptyState` accepts an `action` slot (render prop pattern), making it fully generic:
```jsx
<EmptyState
  icon={Target}
  title="No savings goals yet"
  action={
    <button onClick={() => setShowForm(true)}>
      Create your first goal
    </button>
  }
/>
```

---

### Q17. What is prop drilling and is it a problem in this project?

Prop drilling is passing props through intermediate components that don't use them, just to get data deeper in the tree.

In this project `toaster` is passed as a prop from `App` through to `Goals`, `Recurring`, and `Settings`. In a larger app this would be solved with the **Context API** (`createContext` + `useContext`) to provide the toaster globally:

```jsx
// Instead of:
<Goals toaster={toaster} />

// You would create:
const ToasterContext = createContext();
// Then in any child:
const toaster = useContext(ToasterContext);
```

---

### Q18. What is the Virtual DOM and how does React use it?

React keeps a lightweight JavaScript copy of the DOM (the *virtual DOM*). When state changes, React:
1. Builds a new virtual DOM tree
2. Diffs it against the previous one (reconciliation)
3. Computes the minimal set of real DOM mutations
4. Applies only those changes to the actual DOM

For example, when you add a transaction in Finly, only the stat card numbers, the chart, and the recent transaction list update — React doesn't repaint the entire page.

---

## Section 6 — JavaScript & Modern Patterns

---

### Q19. What is destructuring and where is it used?

```js
// Array destructuring (useState):
const [tab, setTab] = useState("dashboard");

// Object destructuring (props):
export default function Dashboard({ transactions, budgets, goals, alerts }) { ... }

// Object destructuring from function return (App.jsx:54):
const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
```

---

### Q20. What is the spread operator and how does it help with immutability?

```js
// Merge/override object properties — Goals.jsx:25:
{ ...g, saved: Math.max(0, Number(g.saved) + delta) }

// Prepend to array — App.jsx:90:
[full, ...prev]

// Shallow clone + update settings — Settings.jsx:42:
setSettings({ ...settings, currency: e.target.value })
```

---

### Q21. What is `Array.filter`, `Array.map`, and `Array.reduce` as used in the project?

```js
// filter — delete a transaction (App.jsx:115):
setTransactions((prev) => prev.filter((t) => t.id !== id));

// map — update one item in place (App.jsx:111):
setTransactions((prev) =>
  prev.map((t) => t.id === id ? { ...t, ...patch } : t)
);

// reduce equivalent — sum budget totals (Settings.jsx):
Object.values(draft).reduce((a, b) => a + (parseFloat(b) || 0), 0)
```

---

### Q22. Explain the `uid()` function and why a custom ID is used instead of array index.

```js
// storage.js:26
export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
```

Combines a random base-36 string with a timestamp base-36 suffix for collision resistance. Used as transaction/goal IDs.

**Why not array index?**
Array index fails when items are deleted — index `2` could refer to different items at different times. A stable unique ID means:
- `key={t.id}` in lists is always correct
- Edit state (`editing === id`) survives reorders
- Recurring transactions can reference their parent rule via `recurringId`

---

## Section 7 — Quick-Fire Questions

| Question | Answer |
|---|---|
| `useMemo` vs `useCallback`? | `useMemo` returns a memoized **value**; `useCallback` returns a memoized **function** |
| `==` vs `===`? | `===` is strict (no type coercion). Project uses `===` everywhere e.g. `tab === "dashboard"` |
| What does `e.preventDefault()` do in a form? | Stops the browser's default page-reload submission. Every `<form onSubmit>` calls it first |
| Why is `localStorage` in try/catch? | It throws in Safari private mode and when quota is exceeded. The catch silently falls back to the initial value |
| What is `Intl.NumberFormat` used for? | Locale-aware currency formatting: `new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(1234.5)` → `"$1,234.50"` |
| What are React fragments? | `<>...</>` groups elements without adding a DOM node. Useful when a component must return one root but you don't want an extra `<div>` |
| What is a side effect in React? | Anything that reaches outside the component — `localStorage`, `setTimeout`, API calls, subscriptions. All go in `useEffect` |

---

*Generated for the Finly project — https://github.com/dyrok/finly-personal-finance-tracker*
