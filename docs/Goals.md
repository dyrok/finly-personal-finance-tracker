# Savings Goals

**Owner:** Biswajeet
**File:** `src/pages/Goals.jsx`

This page lets the user create savings targets like "Emergency Fund: ₹50,000 by December" and track how much they've put aside so far. Each goal shows a progress bar that fills as the user adds funds.

Goals are kept separate from regular transactions on purpose. Adding money to a goal does **not** count as income or expense — it's just a number that goes up. The "wallet" (the dashboard balance) stays unaffected.

---

## What a goal looks like

```js
{
  id: "g7h2k9",
  name: "Emergency Fund",
  emoji: "🎯",
  target: 5000,
  saved: 1200,
  deadline: "2026-12-31",   // optional
  note: "6 months expenses",
  createdAt: "2026-01-01T00:00:00.000Z"
}
```

Each one has an id, a name, an emoji icon picked from a small set, a target amount, a `saved` amount that starts at zero, an optional deadline, and a free-form note.

All goals are stored in an array, persisted to localStorage under the key `ft.goals`.

---

## How a goal affects the wallet — short answer: it doesn't

This is a common point of confusion. Adding ₹500 to a savings goal does **not** subtract ₹500 from the dashboard balance. The dashboard balance is calculated only from transactions (Income − Expense). Goals are a separate, parallel tracker.

If the user wants their goal to actually move money out of their wallet, they should also log an expense for it on the Transactions tab (or set up a recurring rule). That's a workflow choice the user makes — the app does not auto-link them, because that would force one interpretation on everyone.

So in short:

| Action | Wallet (Dashboard balance) | Goal progress |
|---|---|---|
| Add ₹500 to goal | No change | +₹500 |
| Log ₹500 expense | −₹500 | No change |
| Both | −₹500 | +₹500 |

---

## The four main user actions

### 1. Create a new goal

The user clicks the "New Goal" button at the top. We flip a state flag:

```jsx
const [showForm, setShowForm] = useState(false);
// ...
<button onClick={() => setShowForm((s) => !s)} className="btn-primary">
  <Plus className="w-4 h-4" />
  New Goal
</button>
```

When `showForm` is true, the `<GoalForm />` component appears. It has fields for name, target amount, emoji, deadline, and note. When the user submits, it calls `addGoal(...)`:

```jsx
function addGoal(goal) {
  setGoals((prev) => [
    { id: uid(), saved: 0, createdAt: new Date().toISOString(), ...goal },
    ...prev,
  ]);
  setShowForm(false);
  toaster.show("Goal created", "success");
}
```

What's happening here:
- `uid()` generates a random id for the new goal
- `saved: 0` — every goal starts at zero
- `...goal` spreads the form fields (name, target, emoji, deadline, note) into the object
- `[newGoal, ...prev]` builds a new array with the goal at the front
- `toaster.show(...)` pops a green success toast at the bottom of the screen

We then hide the form by setting `showForm` back to false.

### 2. Add funds to a goal

Each goal card has an "Add Funds" button. Clicking it expands into a small input field. The user types an amount, presses Enter (or clicks the green check), and the goal updates.

```jsx
function adjustSaved(id, delta) {
  setGoals((prev) =>
    prev.map((g) => (g.id === id ? { ...g, saved: Math.max(0, Number(g.saved) + delta) } : g)),
  );
}
```

This is one function that handles both adding and removing money. `delta` is positive when adding, negative when subtracting. The `Math.max(0, ...)` makes sure `saved` never goes below zero.

There's also a small minus button next to "Add Funds" that subtracts ₹10 — a quick way to undo a mistake.

The expand-on-click behavior is handled inside an inner component called `ContributeButton`. It keeps its own `open` state so each goal card can be independently open or closed:

```jsx
function ContributeButton({ onContribute }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState("");

  if (!open) {
    return <button onClick={() => setOpen(true)}>Add Funds</button>;
  }
  return <input ... />;
}
```

The pattern here — a button that swaps into an input — is called **progressive disclosure**. We don't show the input until the user signals they want it.

### 3. Edit a goal

Each card has an edit (pencil) button. Clicking it sets `editing` to that goal's id. Inside the card render, we check:

```jsx
{editing === g.id ? (
  <GoalEditForm goal={g} onSave={(patch) => updateGoal(g.id, patch)} onCancel={() => setEditing(null)} />
) : (
  <>{/* normal card view */}</>
)}
```

This is the **conditional rendering** pattern: same card, two layouts depending on whether we're in edit mode.

`GoalEditForm` is a small inner component with its own local state for the fields. When the user clicks Save, it calls `onSave(patch)` which goes back up to:

```jsx
function updateGoal(id, patch) {
  setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  setEditing(null);
  toaster.show("Goal updated", "success");
}
```

Same map-and-spread pattern as `adjustSaved`. For the goal with the matching id, return a new object that's the old goal overwritten with the new fields. Everything else is returned unchanged.

`setEditing(null)` closes the edit form.

### 4. Delete a goal

Trash icon → confirm popup → remove from array.

```jsx
function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;
  setGoals((prev) => prev.filter((g) => g.id !== id));
  toaster.show("Goal deleted", "info");
}
```

`confirm(...)` is the browser's built-in yes/no dialog. If the user cancels, we return early. Otherwise, we filter the goal out and toast.

We use a confirm here (but not for transaction delete) because losing a goal is more costly — the user may have spent weeks or months building up `saved`.

---

## The progress bar

For every goal we calculate:

```jsx
const pct = Math.min(100, (g.saved / g.target) * 100);
const remaining = Math.max(0, g.target - g.saved);
const complete = pct >= 100;
```

`pct` is capped at 100 so the bar doesn't overflow if the user oversaves. `Math.min(100, ...)` returns whichever is smaller.

The bar itself is two `<div>`s — a gray track and a colored fill whose width is `${pct}%`:

```jsx
<div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
  <div
    className={`h-full transition-all ${complete ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-brand-500 to-brand-700"}`}
    style={{ width: `${pct}%` }}
  />
</div>
```

When the goal hits 100%, the bar switches from brand (indigo) to emerald gradient, and a "Complete 🎉" pill appears in the top-right corner.

---

## Deadline and days left

If the goal has a deadline, we compute how many days are left:

```jsx
const deadline = g.deadline ? new Date(g.deadline) : null;
const daysLeft = deadline
  ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
  : null;
```

JavaScript dates can be subtracted — the result is in milliseconds. We divide by `1000 * 60 * 60 * 24` to convert milliseconds → seconds → minutes → hours → days. `Math.ceil` rounds up so a partial day still counts.

If `daysLeft < 0` and the goal isn't complete, we show an "Overdue" badge in rose.

---

## Why inner components?

This file has three components defined inside it:
- `Goals` — the main page
- `ContributeButton` — the expanding "Add Funds" control
- `GoalForm` — the new-goal form
- `GoalEditForm` — the inline edit form

We keep them in one file because they're tightly tied to this page and nobody else uses them. Splitting them out would mean four files instead of one, and you'd hop between them constantly. When components only make sense in one place, leaving them local keeps the code easier to read.

---

## Core Concepts Used

| Concept | What it means | Where to see it |
|---|---|---|
| **useState** | Component memory — for form fields, edit-mode flag, expand-on-click flag | `showForm`, `editing`, fields inside `GoalForm` |
| **Function updater form** | `setX(prev => ...)` instead of `setX(newValue)`. Safer when the new value depends on the old | `setGoals((prev) => [...])` |
| **Conditional rendering** | Show one thing or another depending on a value | `{editing === g.id ? <Edit /> : <View />}` |
| **Array.map** | Transform every item, used to update one goal among many | `prev.map(g => g.id === id ? {...g, ...patch} : g)` |
| **Array.filter** | Keep only items that pass a test | `prev.filter(g => g.id !== id)` (delete) |
| **Immutability** | Never edit objects in place — always create new ones | `{ ...g, saved: ... }` everywhere |
| **Inner components** | Small components defined in the same file because they're tightly tied to it | `ContributeButton`, `GoalForm`, `GoalEditForm` |
| **Progressive disclosure** | Don't show a control until the user signals they want it | `Add Funds` button → input field |
| **Date arithmetic** | Subtract two Date objects to get milliseconds | `(deadline - new Date()) / (1000*60*60*24)` |

---

## My contribution

_(Fill in: what part of the form, the progress bar, the edit flow, or the deadline UI you worked on.)_

---

## Summary Table

| Feature | What it does | Key function |
|---|---|---|
| Create goal | Opens form, builds new object, prepends to array | `addGoal(goal)` |
| Add funds | `saved + delta`, clamped to ≥ 0 | `adjustSaved(id, delta)` |
| Subtract ₹10 | Same `adjustSaved`, passes negative delta | `adjustSaved(id, -10)` |
| Edit goal | Swap card to edit form, save patches the goal | `updateGoal(id, patch)` |
| Delete goal | Confirm dialog, then filter array | `deleteGoal(id)` |
| Progress bar | Width based on saved / target, capped at 100% | inline `style={{ width: `${pct}%` }}` |
| Deadline | Days-left badge, "Overdue" if past | `Math.ceil((deadline - now) / ms_per_day)` |
| Effect on wallet | None — goals and transactions are parallel ledgers | (intentional design choice) |
