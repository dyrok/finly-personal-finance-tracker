# Recurring Transactions

**Owner:** Biswajeet
**Files:**
- `src/pages/Recurring.jsx` — the page where the user manages rules
- `src/lib/recurring.js` — the engine that turns rules into transactions on schedule

This page lets the user set up things like "Netflix charges ₹299 on the 11th of every month" once, and then the app automatically logs that as a transaction every month — no need to remember.

The user sees these as "rules". Each rule is a template that produces transactions on a schedule.

---

## What a recurring rule looks like

```js
{
  id: "r4m5n6",
  type: "expense",          // or "income"
  name: "Netflix",
  amount: 15.99,
  category: "Subscriptions",
  frequency: "monthly",     // daily | weekly | biweekly | monthly | yearly
  startDate: "2026-01-11",
  nextDate: "2026-06-11",   // the next date that needs to be auto-logged
  active: true              // false when paused
}
```

`nextDate` is the key field. It tells the auto-logger when the next transaction is due. Every time we log one, we move `nextDate` forward by the frequency.

All rules are stored as an array in localStorage under the key `ft.recurring`.

---

## The engine — `materializeRecurring`

This is the function that does the real work. It lives in `src/lib/recurring.js` and runs once when the app first opens.

```js
export function materializeRecurring(recurring, transactions) {
  const today = new Date().toISOString().slice(0, 10);
  const newTx = [];
  const updatedRecurring = recurring.map((r) => {
    if (!r.active) return r;
    let next = r.nextDate;
    while (next <= today) {
      const exists = transactions.some(
        (t) => t.recurringId === r.id && t.date === next,
      );
      if (!exists) {
        newTx.push({
          id: uid(),
          type: r.type,
          amount: Number(r.amount),
          category: r.category,
          note: r.note || r.name,
          date: next,
          recurringId: r.id,
        });
      }
      next = nextDate(next, r.frequency);
    }
    return { ...r, nextDate: next };
  });
  return { newTx, updatedRecurring };
}
```

Let's walk through what it does:

1. **Get today's date** as an ISO string like `"2026-05-16"`. Because ISO dates are alphabetically the same order as actual dates, we can compare them as strings.
2. **Loop over every rule.** If the rule is paused (`active: false`), skip it — return it unchanged.
3. **For each active rule, fast-forward** by running a `while` loop: as long as `next <= today`, we're behind. Log a transaction for `next` and advance to the next scheduled date.
4. **Deduplicate** — before logging, check if a transaction with this `recurringId` already exists for this date. If we somehow already logged it, skip. (This prevents duplicates if the user opens the app twice in one day.)
5. **Update the rule** with the new `nextDate` so we don't try to log it again next time.

The helper `nextDate(date, frequency)` advances a date by the right amount:

```js
export function nextDate(dateISO, frequency) {
  const d = new Date(dateISO);
  switch (frequency) {
    case "daily":     d.setDate(d.getDate() + 1); break;
    case "weekly":    d.setDate(d.getDate() + 7); break;
    case "biweekly":  d.setDate(d.getDate() + 14); break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "yearly":    d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
}
```

JavaScript dates are smart about overflow — `setMonth(12)` becomes January of next year, `setDate(32)` becomes the first of next month. So we don't need to handle month boundaries ourselves.

---

## When does the engine run?

Only once, when the user opens the app. In `App.jsx`:

```jsx
useEffect(() => {
  if (recurring.length === 0) return;
  const { newTx, updatedRecurring } = materializeRecurring(recurring, transactions);
  if (newTx.length > 0) {
    setTransactions((prev) => [...newTx, ...prev]);
    setRecurring(updatedRecurring);
    toaster.show(`Added ${newTx.length} recurring transaction(s)`, "info");
  }
}, []);
```

`useEffect` with an empty array `[]` at the end means "run this once, after the first render, never again". This is the React way of saying "do something when the page first loads".

Three things happen here:
1. **Run the engine.** It gives us back a list of new transactions and the updated rules.
2. **If anything is new**, prepend the new transactions to the existing list and save the updated rules.
3. **Toast the user** so they know transactions appeared "magically".

If the user keeps the tab open for several days, the engine won't fire again. That's a known limitation — to catch up, the user has to refresh or reopen the app. For a personal-use app this is fine.

---

## The page UI

The page shows two states:

### No rules yet

An empty state with a centered icon, a friendly message, and a big "Add a recurring rule" button. Clicking it opens the form.

### Rules exist

A grid of cards (1, 2, or 3 columns depending on screen width). Each card shows:

- Category icon with tinted background
- Name + category
- The amount in bold (green for income, slate for expense) and the frequency below it
- The next scheduled date
- Pause / Resume button
- Delete button (rose)

If the rule is paused, the whole card gets `opacity-60` so it visually fades out. Useful signal that the rule is "off" without removing it.

---

## Pause / Resume

The button at the bottom of each card flips the `active` field:

```jsx
function toggle(id) {
  setRecurring((prev) =>
    prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
  );
}
```

When `active` is false, the engine skips the rule the next time the app opens. The button text changes between "Pause" and "Resume" based on the current state:

```jsx
{r.active ? (
  <><Pause className="w-4 h-4" /> Pause</>
) : (
  <><Play className="w-4 h-4" /> Resume</>
)}
```

This is the same `<X ? A : B>` conditional we've used elsewhere, but applied to the button's contents.

Why not just delete the rule instead of pausing? Because the user might want to use it again later, and creating a new one each time is annoying. Pause keeps the rule but stops it from generating new transactions.

---

## Delete

The trash icon opens a confirm dialog before deleting:

```jsx
function remove(id) {
  if (!confirm("Delete this recurring rule? Existing transactions stay.")) return;
  setRecurring((prev) => prev.filter((r) => r.id !== id));
  toaster.show("Recurring rule deleted", "info");
}
```

Important detail: **the transactions that this rule already created stay in the transaction history.** Only the rule itself disappears. So if Netflix has charged you for 12 months and you delete the rule, those 12 transactions are still there. The confirm message tells the user this so they don't expect a wipe.

---

## The new-rule form

`RecurringForm` is an inner component in the same file. It has fields for:

- **Type** (Expense / Income — pill toggle)
- **Name** (e.g., "Netflix")
- **Amount**
- **Frequency** (dropdown — daily / weekly / biweekly / monthly / yearly)
- **Category**
- **Start date** (defaults to today)

On submit:

```jsx
function addRecurring(r) {
  setRecurring((prev) => [
    { id: uid(), active: true, ...r, nextDate: r.startDate },
    ...prev,
  ]);
  setShowForm(false);
  toaster.show("Recurring rule created", "success");
}
```

The new rule starts active, with `nextDate` set to the start date the user chose. If the user picks today's date as the start, the engine will run on the next app open and log the first transaction right away.

---

## Edge cases worth knowing

**What if the user changes their system date?** Date is read from `new Date()` so the engine trusts the system clock. If the user time-travels backward, no harm — the loop simply won't run because `next > today`.

**What if the user creates a rule with a start date 6 months in the past?** When they next open the app, the engine will log 6 months' worth of transactions in one shot. This is intentional — it's "catching up".

**Why `recurringId` on transactions?** It links each auto-generated transaction back to the rule that made it. The dedup check uses this. The Transactions list also shows a small "RECURRING" badge on these transactions so the user can tell.

---

## Core Concepts Used

| Concept | What it means | Where to see it |
|---|---|---|
| **useEffect with `[]`** | "Run this once after the first render" — used to materialize rules on app load | `App.jsx`, inside the recurring effect |
| **`while` loop** | Keep advancing the date until we're caught up to today | `materializeRecurring` |
| **Pure function** | `materializeRecurring` doesn't touch React state, doesn't talk to localStorage. It takes inputs and returns outputs. Easier to test and reason about | `src/lib/recurring.js` |
| **Date manipulation** | JavaScript `Date` object — `setMonth(+1)`, ISO string comparisons | `nextDate(...)` |
| **Array.some** | "Does any item match this condition?" Returns true/false | `transactions.some(t => t.recurringId === r.id ...)` |
| **Deduplication by id + date** | Check before adding so we never log a recurring transaction twice for the same day | inside the `while` loop |
| **Immutability** | Always return a new object/array, never mutate. React only re-renders on identity change | `prev.map(...)`, `{...r, active: !r.active}` |
| **Toggle pattern** | One boolean field flipped by one function | `toggle(id)` → `active: !active` |
| **confirm()** | Browser's blocking yes/no popup. Cheap way to add a safety net for destructive actions | inside `remove(id)` |

---

## My contribution

_(Fill in: which parts of the materialize engine, the pause/resume UI, or the form you worked on.)_

---

## Summary Table

| Feature | Where | What it does |
|---|---|---|
| Create rule | `RecurringForm` | Type, name, amount, frequency, category, start date |
| Auto-log transactions | `lib/recurring.js` | On app load, generates any missed transactions and updates `nextDate` |
| Dedup | inside materialize | Skip if a transaction with same `recurringId + date` already exists |
| Pause | `toggle(id)` | Flips `active` to false; engine skips it next time |
| Resume | same `toggle(id)` | Flips `active` back to true |
| Delete | `remove(id)` | Confirms, then removes the rule. Past transactions stay |
| "RECURRING" badge | `Transactions.jsx` | Tells the user which transactions came from a rule |
