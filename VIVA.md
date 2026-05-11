# Finly — React Viva Q&A Guide

> Project: Personal Finance Tracker — React 19, Tailwind CSS 3, Recharts, localStorage
> Repo: https://github.com/dyrok/finly-personal-finance-tracker

---

## Table of Contents

1. [React Hooks](#section-1--react-hooks)
2. [JSX & The Virtual DOM](#section-2--jsx--the-virtual-dom)
3. [Routing & Navigation](#section-3--routing--navigation)
4. [Component Architecture & Props](#section-4--component-architecture--props)
5. [Data Flow & Immutability](#section-5--data-flow--immutability)
6. [Performance & Memoization](#section-6--performance--memoization)
7. [JavaScript Patterns Used](#section-7--javascript-patterns-used)
8. [Quick-Fire Questions](#section-8--quick-fire-questions)

---

## Section 1 — React Hooks

---

### Q1. What is `useState`? Explain it deeply.

**Theory**

`useState` is the most fundamental Hook in React. It gives a functional component the ability to hold a piece of mutable data that, when changed, causes the component to re-render with the new value. Before hooks (React < 16.8), only class components could hold state. `useState` closed that gap completely.

Internally, React maintains a linked list of "hook slots" for each component instance. Every time you call `useState`, React reads the next slot in that list. This is why **Hooks must be called at the top level** — if you call them inside conditions or loops, the slot order changes between renders and React reads the wrong value.

**Signature:**
```js
const [value, setValue] = useState(initialValue);
```

- `value` — the current state (read-only; never mutate directly)
- `setValue` — the setter function; calling it schedules a re-render
- `initialValue` — used only on the first render; ignored after that

**Calling the setter:**
```js
// Replace with a direct value:
setValue(42);

// Replace using the previous value (functional update — safer for derived state):
setValue(prev => prev + 1);
```

---

**In this project — `App.jsx:39-48`:**
```jsx
const [tab, setTab] = useState("dashboard");
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);
const [goals, setGoals]               = useLocalStorage("ft.goals", []);
const [recurring, setRecurring]       = useLocalStorage("ft.recurring", []);
const [budgets, setBudgets]           = useLocalStorage("ft.budgets", DEFAULT_BUDGETS);
const [settings, setSettings]         = useLocalStorage("ft.settings", { currency: "USD", alertThreshold: 0.8 });
```

`tab` is plain `useState`; the rest use the custom `useLocalStorage` hook which wraps `useState` internally.

**In `Goals.jsx:8-9`:**
```jsx
const [showForm, setShowForm] = useState(false);
const [editing, setEditing]   = useState(null);
```
`showForm` is a boolean gate — toggling it mounts/unmounts the `<GoalForm>`. `editing` holds the `id` string of the goal currently being edited, or `null` when none are.

**Common mistake:**
```js
// WRONG — mutation, React never sees the change:
transactions.push(newTx);
setTransactions(transactions); // same array reference → no re-render

// CORRECT — new array reference:
setTransactions(prev => [newTx, ...prev]);
```

---

### Q2. What is `useEffect`? Explain when it runs and the dependency array rules.

**Theory**

`useEffect` is the Hook for **side effects** — anything that reaches outside React's rendering world: reading/writing `localStorage`, network requests, subscriptions, timers, or direct DOM manipulation.

React's rendering must be **pure** — given the same props and state, the output must be identical, with no observable outside effects. `useEffect` is the designated escape hatch for impure operations.

**Execution timing:**
1. React renders (runs the function component body)
2. React commits the result to the real DOM
3. **After** the DOM is painted, React runs the `useEffect` callback

This means effects never block the browser from painting, which keeps the UI responsive.

**Dependency array rules:**

```js
useEffect(() => { /* ... */ });
// No array → runs after EVERY render. Rarely what you want.

useEffect(() => { /* ... */ }, []);
// Empty array → runs ONCE on mount. Equivalent to componentDidMount.

useEffect(() => { /* ... */ }, [a, b]);
// Runs on mount AND whenever `a` or `b` change (shallow comparison).
```

**Cleanup function:**
If your effect sets up something that needs tearing down (timer, subscription), return a cleanup function:
```js
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // ← cleanup: runs before next effect or on unmount
}, []);
```

---

**In this project — `App.jsx:52-61` (runs once on mount):**
```jsx
useEffect(() => {
  if (recurring.length === 0) return;
  const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
  if (newTx.length > 0) {
    setTransactions((prev) => [...newTx, ...prev]);
    setRecurring(updatedRecurring);
    toaster.show(`Added ${newTx.length} recurring transaction(s)`, "info");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ← intentionally empty
```

**What this does:** On first load, it checks every active recurring rule. If `nextDate <= today`, it creates a transaction for each missed date and advances `nextDate`. The empty dependency array means it only fires once — if it re-ran on every render it would create duplicate transactions.

**Why the eslint-disable comment?** The `react-hooks/exhaustive-deps` rule would normally warn that `recurring` and `transactions` are not listed as dependencies. The disable is intentional because we *want* a snapshot of the values at mount time only.

---

**In `storage.js:14-20` (syncs state to localStorage):**
```jsx
useEffect(() => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}, [key, value]);
```

Every time `value` or `key` changes, this serialises the new value to `localStorage`. The try/catch handles Safari private-browsing mode (which throws on `localStorage.setItem`) and storage quota exceeded errors.

---

### Q3. What is `useMemo`? When should you use it vs not?

**Theory**

`useMemo` memoizes (caches) the result of a computation. It takes a factory function and a dependency array. React calls the factory once and caches the return value. On subsequent renders it only re-runs the factory if a dependency has changed; otherwise it returns the cached result.

```js
const result = useMemo(() => expensiveComputation(a, b), [a, b]);
```

**When to use it:**
- The computation is genuinely expensive (iterating thousands of items, heavy sorting/filtering)
- The result is used as a prop or dependency in another Hook and you need referential stability

**When NOT to use it:**
- Simple calculations (adding two numbers, accessing an array index) — the overhead of `useMemo` itself costs more than the computation
- Every value "just in case" — premature optimisation hides intent

---

**In this project — `App.jsx:63-72` (category spending map):**
```jsx
const monthlyByCategory = useMemo(() => {
  const m = ym(new Date()); // e.g. "2026-05"
  const map = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (ym(t.date) !== m) continue;
    map[t.category] = (map[t.category] || 0) + Number(t.amount);
  }
  return map;
}, [transactions]);
// Result: { "Food & Dining": 120, "Transport": 45, ... }
```

This loops every transaction (potentially hundreds) to build a category→amount map. Without `useMemo`, this would re-run every time `tab` changes even though `transactions` is unchanged. With `useMemo`, it only re-runs when the `transactions` array changes.

**In `App.jsx:74-86` (budget alerts — depends on previous memo):**
```jsx
const alerts = useMemo(() => {
  const list = [];
  for (const [cat, limit] of Object.entries(budgets)) {
    const spent = monthlyByCategory[cat] || 0;
    if (limit > 0) {
      const ratio = spent / limit;
      if (ratio >= 1)
        list.push({ category: cat, level: "over", spent, limit, ratio });
      else if (ratio >= settings.alertThreshold)
        list.push({ category: cat, level: "warn", spent, limit, ratio });
    }
  }
  return list;
}, [budgets, monthlyByCategory, settings.alertThreshold]);
```

`alerts` depends on `monthlyByCategory` (another memo). React only recomputes `alerts` when `budgets`, `monthlyByCategory`, or the threshold changes.

**In `Dashboard.jsx:35-51` (monthly pie data):**
```jsx
const monthData = useMemo(() => {
  const txs = transactions.filter(t => ym(t.date) === currentMonth);
  // ... build income, expense, pieData
  return { income, expense, pieData, count: txs.length };
}, [transactions, currentMonth]);
```

---

### Q4. What is `useCallback`? How is it different from `useMemo`?

**Theory**

`useCallback` is a specialised version of `useMemo` for functions. It returns a memoized function reference that only changes when its dependencies change.

```js
// These two are equivalent:
const fn = useCallback(() => doSomething(a), [a]);
const fn = useMemo(() => () => doSomething(a), [a]);
```

**Why it matters:** In JavaScript, every function literal creates a new object at every call site. If you define a function inside a component body, it is a new reference on every render. When that function is passed as a prop to a child component, the child sees a "new" prop on every parent render and re-renders unnecessarily — even if nothing functionally changed.

---

**In this project — `Toaster.jsx:7-17`:**
```jsx
export function useToaster() {
  const [items, setItems] = useState([]);

  const show = useCallback((message, level = "info", duration = 3500) => {
    const id = Math.random().toString(36).slice(2, 9);
    setItems((prev) => [...prev, { id, message, level }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, duration);
  }, []); // ← no deps: created once, reference never changes

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, show, dismiss };
}
```

Both `show` and `dismiss` use functional updater form (`prev => ...`) so they don't need `items` in their dependency arrays — they never close over the stale `items` value. The empty `[]` means the same function object is returned every render.

**Note the closure inside `show`:** The `id` captured by the `setTimeout` callback is the specific `id` generated at the moment `show` was called. When the timeout fires 3.5 seconds later, it uses that exact `id` to filter out only that one toast — even if other toasts were added in the meantime. This is a **closure** in action.

---

### Q5. What is a custom Hook? Why are they powerful?

**Theory**

A custom Hook is a JavaScript function whose name begins with `use` that calls one or more built-in React Hooks. Custom Hooks let you **extract stateful logic** out of components so it can be shared and tested in isolation. The component doesn't need to know how the logic works — it just calls the hook and gets back values and setters.

Custom Hooks are not a new API — they are a convention. The `use` prefix is how React's linter knows to apply the rules of hooks to your function.

---

**Custom Hook 1 — `useLocalStorage` (`storage.js:3-23`):**

```jsx
export function useLocalStorage(key, initial) {
  // Step 1: Initialise state from localStorage (lazy initializer runs once)
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return typeof initial === "function" ? initial() : initial;
      return JSON.parse(raw);
    } catch {
      return typeof initial === "function" ? initial() : initial;
    }
  });

  // Step 2: Keep localStorage in sync whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore quota errors */ }
  }, [key, value]);

  // Step 3: Expose the same API as useState
  return [value, setValue];
}
```

**What it encapsulates:**
- Read from `localStorage` on first mount (lazy initializer)
- Gracefully handle `JSON.parse` failures and private-browsing restrictions
- Automatically write back on every change
- Support both value and function forms of `initial` (mirrors `useState`)

**Used 5 times in `App.jsx`:**
```jsx
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);
const [goals, setGoals]               = useLocalStorage("ft.goals", []);
const [recurring, setRecurring]       = useLocalStorage("ft.recurring", []);
const [budgets, setBudgets]           = useLocalStorage("ft.budgets", DEFAULT_BUDGETS);
const [settings, setSettings]         = useLocalStorage("ft.settings", { currency: "USD", alertThreshold: 0.8 });
```

Each call gets its own independent state slot and its own `useEffect` listener.

---

**Custom Hook 2 — `useToaster` (`Toaster.jsx:4-19`):**

```jsx
export function useToaster() {
  const [items, setItems] = useState([]);

  const show = useCallback((message, level = "info", duration = 3500) => {
    const id = Math.random().toString(36).slice(2, 9);
    setItems(prev => [...prev, { id, message, level }]);
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  return { items, show, dismiss };
}
```

`App` calls `const toaster = useToaster()` and then:
- Passes `toaster.items` and `toaster.dismiss` to the `<Toaster>` display component
- Passes the whole `toaster` object as a prop to pages that need to show notifications

This separates the **state logic** (hook) from the **display** (component), which makes both easier to reason about and test.

---

### Q6. What is a lazy initializer in `useState` and why is it critical here?

**Theory**

`useState(initialValue)` evaluates `initialValue` on *every render* but only uses it on the first render. If `initialValue` involves an expensive operation — reading from `localStorage`, parsing JSON, running a loop — you are paying that cost on every render for no benefit.

The solution: pass a **function** instead of a value. React calls it once on mount and ignores it after that.

```js
// BAD — localStorage.getItem runs on every render:
const raw = localStorage.getItem("key");
const [value] = useState(JSON.parse(raw));

// GOOD — runs only on mount:
const [value] = useState(() => JSON.parse(localStorage.getItem("key")));
```

---

**In `storage.js:4-12`:**
```jsx
const [value, setValue] = useState(() => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return typeof initial === "function" ? initial() : initial;
    return JSON.parse(raw);
  } catch {
    return typeof initial === "function" ? initial() : initial;
  }
});
```

The arrow function passed to `useState` is the lazy initializer. It:
1. Reads `localStorage` (an I/O operation, synchronous but non-trivial)
2. Calls `JSON.parse` (CPU cost proportional to data size)
3. Falls back to `initial` if there is no stored value or parsing fails

Without the lazy form, `localStorage.getItem` and `JSON.parse` would run on every render — for `App` which has 5 `useLocalStorage` calls, that's 10 I/O+parse operations per re-render that are completely wasted.

Also notice: `typeof initial === "function" ? initial() : initial` — this supports the case where the caller passes their own lazy initializer as the `initial` argument, mirroring exactly how `useState` itself works.

---

### Q7. What are the Rules of Hooks and why do they exist?

**The two rules:**

1. **Only call Hooks at the top level** — never inside if/else, for loops, or nested functions.
2. **Only call Hooks from React function components or other custom Hooks** — never from regular JS functions.

**Why rule #1 exists:**

React stores all hook state in an ordered list attached to the component instance. Each call to a hook corresponds to a specific position (index) in that list. React identifies *which* state belongs to *which* `useState` call purely by the call order.

```jsx
// CORRECT — hooks always called in same order:
function Component() {
  const [a] = useState(0); // slot 0
  const [b] = useState(""); // slot 1
  const [c] = useState([]); // slot 2
}

// BROKEN — call order changes between renders:
function Component({ flag }) {
  if (flag) {
    const [a] = useState(0); // slot 0 when flag=true, MISSING when flag=false
  }
  const [b] = useState(""); // slot 0 when flag=false, slot 1 when flag=true → WRONG VALUE
}
```

**In this project** every hook call is at the top level of the component, never inside conditions:
```jsx
// App.jsx — all at top level, never conditional
const [tab, setTab] = useState("dashboard");
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);
// etc.
```

---

## Section 2 — JSX & The Virtual DOM

---

### Q8. What is JSX and what does it compile to?

**Theory**

JSX (JavaScript XML) is a syntax extension that lets you write HTML-like markup inside JavaScript. It is **not** HTML — it is syntactic sugar that Babel/Vite transforms into `React.createElement()` calls at build time.

```jsx
// What you write:
const el = <button className="btn" onClick={handleClick}>Click me</button>;

// What it compiles to (React 17+ automatic transform):
import { jsx } from "react/jsx-runtime";
const el = jsx("button", {
  className: "btn",
  onClick: handleClick,
  children: "Click me"
});
```

The result is a plain JavaScript object called a **React element** — a lightweight description of what should be in the DOM:
```js
{
  type: "button",
  props: { className: "btn", onClick: handleClick, children: "Click me" },
  key: null,
  ref: null
}
```

React elements are **not** DOM nodes. They're cheap to create. React uses them to build the virtual DOM tree and then decides which real DOM mutations to apply.

---

**JSX expressions in this project — `App.jsx:154-163`:**
```jsx
<div className={`font-bold ${totals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
  {new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: 0,
  }).format(totals.balance)}
</div>
```

Curly braces `{}` escape from JSX back into JavaScript. Any expression is valid — ternaries, function calls, template literals. The className changes dynamically based on whether the balance is positive or negative.

---

### Q9. What is the Virtual DOM and how does React use it?

**Theory**

The Virtual DOM (VDOM) is a lightweight in-memory representation of the actual DOM, stored as a tree of React elements. React uses a three-phase process:

**Phase 1 — Render:** React calls your component functions to produce a new VDOM tree.

**Phase 2 — Reconciliation (Diffing):** React compares the new tree against the previous tree using its diffing algorithm:
- Elements of different types → tear down the old subtree entirely, build the new one
- Same element type → update only the changed props
- Lists → use `key` to match old and new items

**Phase 3 — Commit:** React applies the minimal set of DOM operations (insertions, deletions, updates) to the real DOM.

**Why this matters:** Direct DOM manipulation is expensive. Browsers must recalculate layout, repaint, and recomposite after DOM changes. By batching all changes into a minimal diff and applying them in one commit, React makes UI updates much cheaper.

---

**In this project:** When you add a transaction via the Quick Add form:
1. `addTransaction()` calls `setTransactions(prev => [full, ...prev])`
2. React schedules a re-render of `App`
3. `App` re-renders → new VDOM tree for `Dashboard`
4. React diffs: stat card values changed, area chart data changed, recent transactions list changed — but the nav bar, header, and Quick Add form are unchanged
5. React updates only those changed DOM nodes — the majority of the page is untouched

---

### Q10. What is the `key` prop and why does using array index as key cause bugs?

**Theory**

When React diffs a list, it needs to know which old item corresponds to which new item. Without `key`, React assumes items at the same index are the same — leading to wrong state, broken animations, and input value glitches.

With `key`, React matches by the key value, not position. If item `"a3f8b2c1"` was at index 2 before and index 0 after (because a newer item was prepended), React correctly identifies it as the same element and reuses its DOM node.

**Why array index fails:**
```jsx
// Transactions list — if you delete the item at index 1:
// Before: [tx-A (idx 0), tx-B (idx 1), tx-C (idx 2)]
// After:  [tx-A (idx 0), tx-C (idx 1)]   ← React thinks idx 1 is still tx-B
//         React tries to UPDATE tx-B to become tx-C → animation glitch, wrong state
```

**Why unique id works:**
```jsx
// App.jsx:173
{TABS.map((t) => (
  <button key={t.id} onClick={() => setTab(t.id)}>
    {t.label}
  </button>
))}

// Toaster.jsx:48
{items.map((it) => (
  <div key={it.id} className={`... animate-[slideIn_200ms_ease-out]`}>
    ...
  </div>
))}
```

For toasts, if you dismiss the middle one, React matches the remaining toasts by `id`, finds their existing DOM nodes, and leaves them intact — the slide-in animation only plays for genuinely new toasts.

---

## Section 3 — Routing & Navigation

---

### Q11. How does tab-based routing work in this project? What are the trade-offs vs React Router?

**How it works — `App.jsx`:**

Navigation is a single string in state:
```jsx
const [tab, setTab] = useState("dashboard");
```

The nav renders from a static array:
```jsx
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ListPlus },
  // ...
];

{TABS.map((t) => (
  <button key={t.id} onClick={() => setTab(t.id)}>
    {t.label}
  </button>
))}
```

The active page mounts via conditional rendering:
```jsx
{tab === "dashboard"    && <Dashboard ... />}
{tab === "transactions" && <Transactions ... />}
{tab === "goals"        && <Goals ... />}
{tab === "recurring"    && <Recurring ... />}
{tab === "report"       && <Report ... />}
{tab === "settings"     && <SettingsPanel ... />}
```

When `tab` changes, the old page **unmounts** (all its local state is lost) and the new page **mounts** fresh. This is intentional — search query, edit mode, and form inputs reset when you leave the page.

---

**Trade-off table:**

| | Tab-based (this project) | React Router |
|---|---|---|
| URL changes | No | Yes |
| Browser back/forward | No | Yes |
| Deep-linking / bookmarking | No | Yes |
| Bundle size | Zero extra | ~6 KB gzip |
| Setup complexity | None | Route config needed |
| Good for | Local tools, no sharing | Public apps, multiple URLs |

Since Finly is a local tool that never shares URLs, the tab approach is the right trade-off.

---

### Q12. How does the active tab get its visual indicator?

The active state is computed at render time from the `tab` state:

```jsx
// App.jsx:169-187
{TABS.map((t) => {
  const Icon = t.icon;
  const active = tab === t.id;  // boolean derived from state
  return (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium
        rounded-t-lg whitespace-nowrap transition border-b-2 ${
        active
          ? "text-brand-700 border-brand-600 bg-brand-50/60"   // active styles
          : "text-slate-600 border-transparent hover:bg-slate-100" // inactive styles
      }`}
    >
      <Icon className="w-4 h-4" />
      {t.label}
    </button>
  );
})}
```

This is a **ternary in a template literal inside JSX** — three layers of expression nesting. Each layer is valid because:
- Template literals `${}` accept any JS expression
- JSX `{}` accepts any JS expression
- Ternary `condition ? a : b` is an expression (not a statement)

---

## Section 4 — Component Architecture & Props

---

### Q13. What is the difference between props and state?

**State** is data owned and managed by a component. It is private and can only be changed by the component itself through its setter function.

**Props** are data passed into a component by its parent. They are read-only from the child's perspective — a child should never mutate its own props.

| | State | Props |
|---|---|---|
| Owned by | The component | The parent |
| Changed by | The component (via setter) | The parent (re-renders with new value) |
| Read-only in child? | No | Yes |
| Triggers re-render? | Yes (via setter) | Yes (when parent re-renders with new props) |
| Example | `const [tab, setTab] = useState(...)` | `<Dashboard alerts={alerts} />` |

**In this project:** `App` owns all data state and passes it as props to pages. Child pages only receive props — they call callback props (`onAdd`, `onDelete`) to ask the parent to change the data.

```jsx
// App.jsx — state owned here:
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);

// Passed down as props:
<Transactions
  transactions={transactions}    // data prop
  onAdd={addTransaction}         // callback prop
  onUpdate={updateTransaction}   // callback prop
  onDelete={deleteTransaction}   // callback prop
  currency={settings.currency}   // derived prop
/>
```

---

### Q14. What is "lifting state up" and where is it applied?

**Theory**

When two or more sibling components need to share or synchronise state, you "lift" that state to their nearest common ancestor. The ancestor owns the state and passes it down to both children. Changes in one child bubble up through a callback prop, updating the shared state, which flows back down to both children.

**In this project:** `Dashboard` shows a summary of this month's transactions (stat cards, pie chart, recent list). `Transactions` shows the full list with edit/delete. Both need the same `transactions` array.

If each page owned its own copy of transactions, editing a transaction in `Transactions` would not update `Dashboard`'s chart. By lifting to `App`, both pages always see the same authoritative data:

```
                App (owns transactions[])
               /          |          \
       Dashboard    Transactions    Report
      (reads it)  (reads + mutates) (reads it)
```

```jsx
// App.jsx — single source of truth:
const [transactions, setTransactions] = useLocalStorage("ft.transactions", []);

function addTransaction(tx) {
  setTransactions(prev => [{ id: uid(), ...tx }, ...prev]);
}

// Both pages receive the same array:
<Dashboard transactions={transactions} onAddTransaction={addTransaction} />
<Transactions transactions={transactions} onAdd={addTransaction} onDelete={deleteTransaction} />
```

---

### Q15. What is a controlled component vs an uncontrolled component?

**Controlled component:** React state is the single source of truth for the input's value. Every keystroke updates state; state updates drive the displayed value. React fully controls the input.

**Uncontrolled component:** The DOM manages the input's value internally. React reads it via a `ref` when needed (e.g. on form submit).

---

**Controlled example — `TransactionForm.jsx`:**
```jsx
const [amount, setAmount] = useState("");

<input
  type="number"
  step="0.01"
  min="0"
  required
  value={amount}                              // state → DOM (controlled)
  onChange={(e) => setAmount(e.target.value)} // DOM → state
  placeholder="0.00"
  className="input pl-7 text-lg font-semibold"
/>
```

Flow: user types → `onChange` fires → `setAmount` runs → state updates → component re-renders → input shows new value.

**Controlled advantages:**
- Input value is always accessible in state (no need for `ref`)
- Easy validation — can block invalid characters in `onChange`
- Resetting is trivial: `setAmount("")`
- Can derive/format values before display

**Uncontrolled would look like:**
```jsx
const inputRef = useRef();
// Read value only on submit:
function handleSubmit() {
  const val = inputRef.current.value;
}
<input ref={inputRef} defaultValue="" />
```

---

### Q16. What is component composition and the `children` prop?

**Theory**

Composition is building complex UIs by combining smaller, focused components. React's primary composition primitive is the `children` prop — whatever JSX you nest inside a component tag is available as `props.children`.

---

**`EmptyState` component — `components/EmptyState.jsx`:**
```jsx
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon ? (
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <Icon className="w-7 h-7 text-slate-400" />
        </div>
      ) : null}
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description ? <p className="text-sm text-slate-500 mt-1">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

The `action` prop is a **render prop** — it accepts a React element (JSX) as a value and renders it in a specific slot. This makes `EmptyState` completely generic: each usage provides its own button without `EmptyState` needing to know anything about buttons.

Used in 5 different pages:
```jsx
// Goals.jsx — action is a button that opens the form
<EmptyState
  icon={Target}
  title="No savings goals yet"
  description="Set a target..."
  action={
    <button onClick={() => setShowForm(true)} className="btn-primary">
      <Plus className="w-4 h-4" />
      Create your first goal
    </button>
  }
/>

// Transactions.jsx — no action prop (omitted entirely)
<EmptyState
  icon={Inbox}
  title="No transactions"
  description="Add your first transaction to get started"
/>
```

---

### Q17. What is prop drilling and how would you fix it with Context?

**Prop drilling** is passing a prop through multiple component layers just to get it to a deeply nested consumer. The intermediate components don't use the prop — they only forward it.

**In this project — `toaster` prop:**
```
App (creates toaster)
  ↓ toaster prop
Goals (uses toaster.show)
  ↓ toaster prop
GoalForm (doesn't use it)   ← drilling happens here if GoalForm needed it
```

**The Context API fix:**
```jsx
// 1. Create the context:
const ToasterContext = createContext(null);

// 2. Provide it at the top level:
function App() {
  const toaster = useToaster();
  return (
    <ToasterContext.Provider value={toaster}>
      {/* All children can access toaster without prop drilling */}
      <Goals goals={goals} setGoals={setGoals} currency={currency} />
    </ToasterContext.Provider>
  );
}

// 3. Consume anywhere in the tree — no intermediate props needed:
function Goals({ goals, setGoals, currency }) {
  const toaster = useContext(ToasterContext);
  // No need to pass toaster down further
}
```

For this app's size, prop drilling is acceptable. Context would be warranted if `toaster` needed to go 4+ levels deep or into many unrelated branches.

---

## Section 5 — Data Flow & Immutability

---

### Q18. Why must React state be immutable? What breaks if you mutate?

**Theory**

React determines whether to re-render by checking if the state reference has changed. For objects and arrays, this is a **shallow reference check** (`===`), not a deep value comparison. Mutating an existing object does not change its reference.

```js
const arr = [1, 2, 3];
arr.push(4);        // mutates in place
arr === arr;        // true — same reference
// React sees the same reference → thinks nothing changed → no re-render
```

**In this project — correct immutable patterns:**

```jsx
// Delete — filter creates a new array:
setTransactions(prev => prev.filter(t => t.id !== id));

// Update — map creates a new array, spread creates a new object:
setTransactions(prev => prev.map(t =>
  t.id === id ? { ...t, ...patch } : t
));

// Add — spread creates a new array:
setTransactions(prev => [{ id: uid(), ...tx }, ...prev]);

// Goal saved adjustment — Goals.jsx:23-27:
setGoals(prev =>
  prev.map(g => g.id === id
    ? { ...g, saved: Math.max(0, Number(g.saved) + delta) }
    : g
  )
);
```

Every operation returns a **new reference** at both the array level and the modified item level. React detects the change and re-renders.

**What actually breaks with mutation:**
1. Re-render doesn't happen → UI shows stale data
2. `useMemo` dependencies don't change → stale computed values
3. `useEffect` dependencies don't change → effects don't re-run
4. React DevTools time-travel debugging breaks (previous states are corrupted)

---

### Q19. What is the functional updater form and when is it essential?

**Theory**

```js
// Direct value form:
setState(newValue);

// Functional updater form:
setState(prev => computeNewValue(prev));
```

React batches state updates for performance. Between the time you read `transactions` and the time React processes your `setState` call, other state updates may have run. The functional form guarantees you get the **latest committed state** as `prev`.

---

**Critical example — `App.jsx:52-61` (recurring materialisation on mount):**
```jsx
useEffect(() => {
  const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
  if (newTx.length > 0) {
    setTransactions((prev) => [...newTx, ...prev]); // ← functional form
    setRecurring(updatedRecurring);
    toaster.show(`Added ${newTx.length} recurring transaction(s)`, "info");
  }
}, []);
```

Both `setTransactions` and `setRecurring` are called synchronously in the same effect. React batches them. If `setTransactions` used the direct form `setTransactions([...newTx, ...transactions])`, the `transactions` snapshot captured in the closure could be stale if another update had already queued. The functional form `prev => [...]` always operates on the freshest state.

---

### Q20. How does `materializeRecurring` work? Walk through the logic.

**`lib/recurring.js`:**
```js
export function materializeRecurring(recurring, transactions) {
  const today = new Date().toISOString().slice(0, 10); // e.g. "2026-05-11"
  const newTx = [];

  const updatedRecurring = recurring.map((r) => {
    if (!r.active) return r; // skip paused rules

    let next = r.nextDate;
    while (next <= today) {
      // Check if this exact (rule, date) pair was already created
      const exists = transactions.some(
        (t) => t.recurringId === r.id && t.date === next
      );
      if (!exists) {
        newTx.push({
          id: uid(),
          type: r.type,
          amount: Number(r.amount),
          category: r.category,
          note: r.note || r.name,
          date: next,
          recurringId: r.id, // ← links back to the rule for deduplication
        });
      }
      next = nextDate(next, r.frequency); // advance to next occurrence
    }
    return { ...r, nextDate: next }; // update rule with new nextDate
  });

  return { newTx, updatedRecurring };
}
```

**Scenario:** User has a monthly "Netflix" rule starting 2026-03-11. They haven't opened the app in 3 months. Today is 2026-05-11.

1. `next = "2026-03-11"`, today = `"2026-05-11"`
2. `"2026-03-11" <= "2026-05-11"` → true → create tx for March 11 (if not exists)
3. `next = nextDate("2026-03-11", "monthly")` → `"2026-04-11"`
4. `"2026-04-11" <= "2026-05-11"` → true → create tx for April 11
5. `next = "2026-05-11"`
6. `"2026-05-11" <= "2026-05-11"` → true → create tx for May 11
7. `next = "2026-06-11"`
8. `"2026-06-11" <= "2026-05-11"` → false → exit loop
9. Return rule with `nextDate: "2026-06-11"`

The deduplication check (`recurringId === r.id && date === next`) prevents duplicate creation if the app is opened twice quickly or if the effect fires multiple times.

---

## Section 6 — Performance & Memoization

---

### Q21. When does React re-render a component?

A component re-renders when:
1. Its own state changes (via a setter)
2. Its parent re-renders (and passes new props or the same props but new references)
3. A context it subscribes to changes

**In this project:** `App` re-renders whenever any of its 6 state values change. Every page (`Dashboard`, `Transactions`, etc.) re-renders whenever `App` re-renders, because they receive props from `App`. This is why `useMemo` is important — it prevents expensive computations inside child components from re-running unnecessarily.

---

### Q22. What is `React.memo` and is it used in this project?

`React.memo` is a HOC (Higher-Order Component) that wraps a component and makes it only re-render if its props actually changed (shallow comparison). Without it, a child re-renders every time its parent re-renders, even if the props are identical.

```jsx
const StatCard = React.memo(function StatCard({ label, value, tone }) {
  // Only re-renders if label, value, or tone changed
});
```

This project does **not** use `React.memo` explicitly — the app is small enough that re-rendering all pages is not a performance problem. In a production app with complex charts and large lists, you would wrap `StatCard`, `EmptyState`, and the chart components in `React.memo`.

---

## Section 7 — JavaScript Patterns Used

---

### Q23. What is destructuring and what are its forms?

**Theory**

Destructuring is a syntax that extracts values from arrays or properties from objects into distinct variables. It makes code terser and more readable.

**Array destructuring (order-based):**
```js
// useState returns [value, setter]:
const [tab, setTab] = useState("dashboard");
const [a, b, c] = [1, 2, 3];
const [first, ...rest] = [1, 2, 3, 4]; // rest = [2, 3, 4]
```

**Object destructuring (name-based):**
```js
// Function parameters — TransactionForm.jsx:
export default function TransactionForm({ onAdd, compact = false }) { ... }

// Return values — App.jsx:54:
const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);

// With rename:
const { Settings: SettingsIcon } = require("lucide-react");
// import { Settings as SettingsIcon } from "lucide-react"; // App.jsx:8
```

**Nested destructuring:**
```js
const { type, amount, category } = transaction;
// Equivalent to:
const type = transaction.type;
const amount = transaction.amount;
const category = transaction.category;
```

---

### Q24. What is the spread operator and what problems does it solve?

**Theory**

The spread operator `...` "unpacks" an iterable (array, object, string) into individual elements. In the context of React and immutability, it is the primary tool for creating new objects/arrays that copy existing data.

**Object spread — creating updated copies:**
```js
// Goals.jsx:25 — update `saved` while keeping all other properties:
{ ...g, saved: Math.max(0, Number(g.saved) + delta) }

// Settings.jsx:42 — update one setting:
setSettings({ ...settings, currency: e.target.value });

// App.jsx:111 — apply a patch object to a transaction:
{ ...t, ...patch }
// If t = { id: "a", amount: 10, note: "old" }
// and patch = { note: "new" }
// Result: { id: "a", amount: 10, note: "new" }  ← later properties win
```

**Array spread — creating updated copies:**
```js
// Prepend new transaction to list:
[{ id: uid(), ...tx }, ...prev]
// If prev = [tx2, tx3], result = [newTx, tx2, tx3]

// Merge two arrays:
[...newTx, ...existingTx]
```

**Why spread instead of `Object.assign`:**
```js
// Spread (modern, readable):
{ ...obj, key: value }

// Object.assign (older equivalent):
Object.assign({}, obj, { key: value })
```

Both create a **shallow copy** — nested objects are still references to the same objects. For this app's flat data model (transactions don't contain nested objects), shallow copy is sufficient.

---

### Q25. Explain `Array.map`, `Array.filter`, and `Array.reduce` with examples from the code.

**`Array.map`** — transforms every element, returns a new array of the same length.

```js
// App.jsx:111 — update one transaction:
setTransactions(prev =>
  prev.map(t => t.id === id ? { ...t, ...patch } : t)
);
// For every transaction: if it's the target → return patched copy, else → return as-is
// Result: same length array, one element changed

// Dashboard.jsx:47-49 — transform byCat object into Recharts-ready array:
const pieData = Object.entries(byCat)
  .map(([name, value]) => ({ name, value, color: categoryMeta(name).color }))
  .sort((a, b) => b.value - a.value);
```

**`Array.filter`** — keeps elements matching a predicate, returns a shorter (or equal) new array.

```js
// App.jsx:115 — delete a transaction:
setTransactions(prev => prev.filter(t => t.id !== id));
// Keeps all transactions whose id is NOT the deleted one

// Transactions.jsx — search + filter:
const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();
  return transactions.filter(t => {
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

**`Array.reduce`** — accumulates a single value from all elements.

```js
// Settings.jsx — sum all budget limits:
Object.values(draft).reduce((acc, b) => acc + (parseFloat(b) || 0), 0)
// Initial value: 0
// Each step: acc + current budget value
// Result: total budget amount
```

---

### Q26. What are closures and how do they appear in this codebase?

**Theory**

A closure is a function that "closes over" (captures) variables from its surrounding lexical scope. Even after the outer function has returned, the inner function still has access to those variables.

**Example 1 — Toast auto-dismiss in `Toaster.jsx:7-13`:**
```jsx
const show = useCallback((message, level = "info", duration = 3500) => {
  const id = Math.random().toString(36).slice(2, 9); // created here
  setItems(prev => [...prev, { id, message, level }]);
  setTimeout(() => {
    setItems(prev => prev.filter(i => i.id !== id)); // closes over `id`
  }, duration);
}, []);
```

`id` is a local variable inside `show`. The `setTimeout` callback is a closure over `id`. When the timeout fires 3.5 seconds later — long after `show` has returned — the callback still has access to that exact `id`. This allows it to remove only *that specific toast*, even if 10 other toasts were shown in the meantime.

**Example 2 — Event handlers close over state:**
```jsx
// App.jsx:88-108 — addTransaction closes over budgets and settings:
function addTransaction(tx) {
  // `budgets` and `settings` are from the outer App scope
  if (tx.type === "expense" && budgets[tx.category]) {
    const limit = budgets[tx.category]; // closed over
    if (spentNow >= limit) {
      toaster.show(`Budget exceeded for ${tx.category}!`, "error");
    }
  }
}
```

Because `addTransaction` is redefined on every render, it always closes over the *current* values of `budgets` and `settings` — never stale values.

---

### Q27. What is `e.preventDefault()` and where is it used?

**Theory**

HTML forms have a default behaviour: when submitted, the browser serializes the form fields and sends an HTTP request to the server (or reloads the page for `action=""`). In a React SPA, you never want this — you handle submission in JavaScript.

`e.preventDefault()` tells the browser to skip its default handler. The `e` is the native DOM `SubmitEvent` passed to the `onSubmit` handler.

---

**In this project — `TransactionForm.jsx`:**
```jsx
function handleSubmit(e) {
  e.preventDefault(); // stop page reload
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) return; // guard: empty or negative amount
  onAdd({
    type,
    amount: amt,
    category,
    note: note.trim(),
    date,
  });
  setAmount(""); // reset form
  setNote("");
}

<form onSubmit={handleSubmit}>
  ...
  <button type="submit">Add Expense</button>
</form>
```

If `e.preventDefault()` were missing, clicking "Add Expense" would:
1. Call `handleSubmit`
2. Immediately reload the page
3. Clear all state
4. Show an empty app — all the local state is gone (though `localStorage` would restore it on reload)

---

### Q28. What is `Intl.NumberFormat` and why is it used for currency?

**Theory**

`Intl.NumberFormat` is a browser-native API for locale-aware number formatting, part of the ECMAScript Internationalization API. It handles:
- Decimal separators (`.` in US, `,` in Germany)
- Thousands separators (`,` in US, `.` in Germany, `'` in Switzerland)
- Currency symbols and placement
- Correct rounding for currencies with no cents (JPY)

---

**In this project — `lib/format.js`:**
```js
export function formatMoney(n, currency = "USD") {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,           // e.g. "USD", "EUR", "INR"
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `$${v.toFixed(2)}`; // fallback for invalid currency codes
  }
}
```

- `undefined` as locale → use the browser's locale (user's OS setting)
- `style: "currency"` → formats as currency with symbol
- `currency` → ISO 4217 code (USD, EUR, GBP, INR, JPY…)

**Results:**
```js
formatMoney(1234.5, "USD")  // "$1,234.50"   (en-US locale)
formatMoney(1234.5, "EUR")  // "€1,234.50"   or "1.234,50 €" depending on locale
formatMoney(1234.5, "INR")  // "₹1,234.50"
formatMoney(1234.5, "JPY")  // "¥1,235"      (no decimals for JPY)
```

The user can change the currency in Settings, and every `formatMoney` call across the app updates — because `currency` comes from `settings.currency` state.

---

## Section 8 — Quick-Fire Questions

| Question | Answer |
|---|---|
| `useMemo` vs `useCallback`? | `useMemo` memoizes a **value** (result of a function). `useCallback` memoizes a **function** (the function itself). `useCallback(fn, deps)` === `useMemo(() => fn, deps)` |
| `==` vs `===`? | `==` coerces types before comparing (`"1" == 1` → true). `===` requires same type and value (`"1" === 1` → false). Always use `===` in React code |
| What does `&&` do in JSX? | Short-circuit: `{condition && <Component />}` renders `<Component />` if `condition` is truthy, renders nothing if falsy. Beware: `{0 && <X />}` renders `0` (use `{!!0 && <X />}` or a ternary) |
| What is a React Fragment? | `<>...</>` or `<React.Fragment>` groups elements without adding a DOM node. Used when a component must return one root without adding a wrapper `<div>` |
| What is a side effect? | Anything that reaches outside React's render — localStorage, fetch, setTimeout, direct DOM mutation. All go in `useEffect` |
| What does `Array.some()` do? | Returns `true` if at least one element passes the test. Used in `recurring.js:34`: `transactions.some(t => t.recurringId === r.id && t.date === next)` — checks if a transaction already exists |
| What does `Object.entries()` do? | Returns `[[key, value], ...]` pairs. Used in `App.jsx:76`: `Object.entries(budgets)` to iterate budget categories and their limits |
| Why `Number(t.amount)` everywhere? | `localStorage` stores everything as JSON strings. When read back, numeric values could be strings (`"42.5"`). `Number("42.5")` → `42.5` ensures arithmetic works correctly |
| What is `toISOString().slice(0, 10)`? | Converts a `Date` to `"YYYY-MM-DD"` format. ISO 8601 strings compare lexicographically — `"2026-05-11" <= "2026-05-12"` works correctly as a string comparison, which is how `recurring.js` checks dates |
| What is prop spreading? | `<Component {...obj} />` passes all properties of `obj` as individual props. Not used in this project (explicit props are clearer), but common in component libraries |
| What is `useRef`? | Returns a mutable object `{ current: value }` that persists across renders without causing re-renders. Used for DOM node references and storing values that shouldn't trigger re-renders |
| What is reconciliation? | React's diffing algorithm that compares old and new virtual DOM trees to find the minimal set of real DOM changes needed |

---

*Generated for the Finly project — https://github.com/dyrok/finly-personal-finance-tracker*
