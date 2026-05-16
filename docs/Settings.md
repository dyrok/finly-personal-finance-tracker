# Settings

**Owner:** Manthan
**Files:**
- `src/pages/Settings.jsx` — the page itself
- `src/lib/dummy.js` — the sample data generator used by the "Load Sample Data" button

This page is where the user configures the app:

- Pick their currency (USD, EUR, INR, etc.)
- Choose when budget alerts should fire
- Set monthly spending limits for each category
- Back up or restore all their data
- Load a realistic sample dataset (useful for demos and first-run)
- Wipe everything and start over

Settings doesn't affect transactions or goals directly — it changes how the rest of the app interprets the data.

---

## How the data is organized

There are three different things being managed on this page, and each is stored separately:

```js
// ft.settings — preferences
{ currency: "USD", alertThreshold: 0.8 }

// ft.budgets — per-category spending limits
{ "Food & Dining": 400, "Groceries": 350, ... }

// other localStorage keys — read for export/import only
```

`alertThreshold` is a number between 0 and 1. `0.8` means "warn the user when they've spent 80% of a category budget".

---

## The "draft" pattern

Settings uses a slightly different state pattern than the rest of the app. Instead of every keystroke immediately updating the saved budgets, we keep a local **draft** copy. The user edits the draft. Only when they hit "Save Changes" does the draft replace the real budgets.

```jsx
const [draft, setDraft] = useState({ ...budgets });
const [threshold, setThreshold] = useState(Math.round(settings.alertThreshold * 100));
```

When the user types in a budget input, `draft` updates immediately. When they hit Save:

```jsx
function saveBudgets() {
  const cleaned = {};
  for (const [k, v] of Object.entries(draft)) {
    const n = parseFloat(v);
    if (n > 0) cleaned[k] = n;
  }
  setBudgets(cleaned);
  setSettings({ ...settings, alertThreshold: threshold / 100 });
  toaster.show("Settings saved", "success");
}
```

We loop through the draft, convert each value to a number, drop anything zero or invalid, and replace the real budgets in one shot. The threshold is divided by 100 because the UI uses 0–100, but the stored value is 0–1.

Why draft instead of live? Two reasons:
1. The user can experiment with budget values without committing them. They can hit "back" or close the tab and the old budgets stay.
2. Currency and threshold *do* save immediately on change — they're peripheral. Budgets are the heavy decision, so we make the user confirm.

---

## Section 1: Preferences

### Currency

Just a `<select>` dropdown with a hardcoded list of currencies:

```jsx
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "CNY", "BRL"];
```

When the user picks one, we update settings directly:

```jsx
<select
  value={settings.currency}
  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
>
  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
</select>
```

This propagates everywhere — `formatMoney(amount, currency)` is the helper used across the app, and it uses the browser's `Intl.NumberFormat` to render the right currency symbol and decimal style.

### Alert threshold slider

```jsx
<input
  type="range"
  min="50"
  max="100"
  step="5"
  value={threshold}
  onChange={(e) => setThreshold(Number(e.target.value))}
/>
```

A range input from 50% to 100% in steps of 5%. The label above the slider updates live ("Budget alert threshold: 80%"). When the user hits Save, the threshold/100 is stored in settings.

The threshold drives the alerts on the dashboard. In `App.jsx`:

```jsx
if (ratio >= 1) list.push({ category: cat, level: "over", ... });
else if (ratio >= settings.alertThreshold)
  list.push({ category: cat, level: "warn", ... });
```

If you're over budget → red "over" alert. If you're past the threshold but not yet over → amber "warn" alert.

---

## Section 2: Monthly Budgets

A list of categories with a number input next to each, plus a trash icon to remove that category's budget entirely.

### Adding a category

Below the list is a row of pill buttons for categories that don't yet have a budget. Clicking one adds it to the draft:

```jsx
function addCategory(catName) {
  setDraft((d) => ({ ...d, [catName]: d[catName] ?? 100 }));
}
```

`d[catName] ?? 100` means "use the existing value if there is one, otherwise default to 100". The `??` operator is "nullish coalescing" — it's like `||` but only falls back when the left side is `null` or `undefined`, not when it's `0` or empty string.

The `[catName]` part is **computed property** syntax. It lets us use a variable as an object key. Without it we'd just be setting a key literally named `"catName"`.

### Editing a budget

```jsx
<input
  type="number"
  value={draft[cat]}
  onChange={(e) => setDraft({ ...draft, [cat]: e.target.value })}
/>
```

Spread the existing draft, override the one category being edited. New object reference → React detects the change → re-renders.

### Removing a category

The trash icon next to each row:

```jsx
function removeCategory(catName) {
  setDraft((d) => {
    const next = { ...d };
    delete next[catName];
    return next;
  });
}
```

We make a copy of the draft, `delete` the key, and return the new object. Note that `delete next[catName]` mutates `next` — but `next` is our private copy, so that's OK. We don't mutate the React state directly.

This only removes the category from the draft. The change goes live when the user hits Save.

### Total budget readout

Below the list, we sum all the draft budgets:

```jsx
{formatMoney(
  Object.values(draft).reduce((a, b) => a + (parseFloat(b) || 0), 0),
  settings.currency,
)}
```

`Object.values(draft)` gives `[400, 350, 200, ...]`. `.reduce(...)` adds them up. `parseFloat(b) || 0` handles the case where a value is `""` or invalid.

---

## Section 3: Data (Backup, Restore, Sample, Reset)

This is the danger zone. The user can:

### Load Sample Data

A "Load Sample Data" button (sparkles icon) generates a realistic dataset and replaces whatever's currently in localStorage. Useful for demoing the app, screenshots, or showing the dashboard to someone without spending an hour logging fake transactions by hand.

```jsx
function populateDummy() {
  if (
    !confirm(
      "Replace ALL current data with sample data?\n\nThis is great for demoing the app but will overwrite anything you have. You can Export Backup first if you want to keep your current data.",
    )
  )
    return;
  const data = generateDummyData();
  localStorage.setItem("ft.transactions", JSON.stringify(data.transactions));
  localStorage.setItem("ft.goals", JSON.stringify(data.goals));
  localStorage.setItem("ft.recurring", JSON.stringify(data.recurring));
  localStorage.setItem("ft.budgets", JSON.stringify(data.budgets));
  toaster.show("Sample data loaded — reloading", "success");
  setTimeout(() => location.reload(), 800);
}
```

The actual data generator lives in `src/lib/dummy.js`. It builds:

| What | How much |
|---|---|
| Transactions | ~30–40 expenses + 6 salary income entries spread across the last 6 months |
| Goals | 3 sample goals (Emergency Fund partial, Trip partial w/ deadline, Laptop complete) |
| Recurring rules | Salary monthly + Netflix monthly + Rent monthly |
| Budgets | A sensible 7-category default |

The numbers and dates are randomized inside fixed ranges each time you click, so two presses produce different-looking data (good for testing edge cases). Recurring `nextDate` is set to **next month** so the materialize engine doesn't immediately fire and re-create transactions on top of the seeded ones.

The flow is the same as Import / Reset:
1. Confirm the destructive action
2. Write each section to localStorage
3. Toast + reload — the app boots fresh and `useLocalStorage` picks up the new values

The "Settings" preferences are intentionally **not** touched (so your currency and threshold survive a sample-load).

### Export Backup

Generates a single JSON file with everything in localStorage:

```jsx
function exportAll() {
  const data = {
    transactions: JSON.parse(localStorage.getItem("ft.transactions") || "[]"),
    goals: JSON.parse(localStorage.getItem("ft.goals") || "[]"),
    recurring: JSON.parse(localStorage.getItem("ft.recurring") || "[]"),
    budgets: JSON.parse(localStorage.getItem("ft.budgets") || "{}"),
    settings: JSON.parse(localStorage.getItem("ft.settings") || "{}"),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finly-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

We read each localStorage key directly here (instead of going through the React state) so the backup is always exactly what's stored. The fallback `|| "[]"` / `|| "{}"` handles the case where the key doesn't exist yet.

`JSON.stringify(data, null, 2)` formats the JSON with 2-space indentation so the file is human-readable.

Same Blob → URL → download pattern used by CSV export and report export.

### Import Backup

A hidden file input wrapped in a label so it looks like a button:

```jsx
<label className="btn-ghost cursor-pointer">
  Import Backup
  <input type="file" accept="application/json" onChange={importAll} className="hidden" />
</label>
```

When the user picks a JSON file, `importAll` runs:

```jsx
function importAll(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.transactions) localStorage.setItem("ft.transactions", JSON.stringify(data.transactions));
      if (data.goals) localStorage.setItem("ft.goals", JSON.stringify(data.goals));
      if (data.recurring) localStorage.setItem("ft.recurring", JSON.stringify(data.recurring));
      if (data.budgets) localStorage.setItem("ft.budgets", JSON.stringify(data.budgets));
      if (data.settings) localStorage.setItem("ft.settings", JSON.stringify(data.settings));
      toaster.show("Backup restored — reloading", "success");
      setTimeout(() => location.reload(), 800);
    } catch {
      toaster.show("Invalid backup file", "error");
    }
  };
  reader.readAsText(file);
}
```

How it works:
1. `e.target.files?.[0]` — get the first file the user picked (the `?.` is optional chaining; it's safe if `files` is empty)
2. `FileReader` is a browser API for reading file contents. We set `onload` to a function that runs when the read is done
3. `readAsText(file)` starts the read. When it finishes, `onload` fires with `ev.target.result` containing the file's text
4. `JSON.parse` turns the text back into an object. Wrapped in `try / catch` because invalid JSON would throw
5. For each section, we write to localStorage directly
6. After a short delay (so the toast appears), `location.reload()` refreshes the page. The new data loads from localStorage via the `useLocalStorage` hook

We don't try to merge — import replaces. The user should treat backup files as full snapshots.

### Reset All Data

The big red button. Calls `onReset` (a prop). In `App.jsx`:

```jsx
function resetAll() {
  if (!confirm("Erase ALL data? This cannot be undone.")) return;
  ["ft.transactions", "ft.goals", "ft.recurring", "ft.budgets", "ft.settings"].forEach((k) =>
    localStorage.removeItem(k),
  );
  location.reload();
}
```

Browser `confirm` dialog. If yes, wipe all five keys and reload. After reload, the `useLocalStorage` hook sees nothing in localStorage and falls back to the default values.

---

## Why some changes save immediately and some don't

| Change | When it saves |
|---|---|
| Currency dropdown | Immediately (`setSettings({...})`) |
| Budget value | When "Save Changes" is clicked |
| Threshold slider | When "Save Changes" is clicked |
| Add / remove category | Stays in draft until Save |
| Export / Import / Reset / Load Sample | Acts on localStorage directly, immediately |

Budgets and threshold are batched because they often go together — the user might tweak the threshold AND a few budgets at once. Forcing them to save individually would be annoying.

Currency is independent of budgets — flipping from USD to INR doesn't change any budget number, just how it's displayed. So saving immediately is fine.

---

## Core Concepts Used

| Concept | What it means | Where to see it |
|---|---|---|
| **useState** | Local "draft" state separate from saved state | `const [draft, setDraft] = useState({...budgets})` |
| **Draft pattern** | Edit a copy, commit on Save. Lets the user experiment without committing | `draft` for budgets, real save in `saveBudgets()` |
| **Computed properties** | `{[varName]: value}` — use a variable as an object key | `setDraft({ ...draft, [cat]: ... })` |
| **Nullish coalescing `??`** | Fallback only on null/undefined, unlike `||` which also catches 0 and "" | `d[catName] ?? 100` |
| **Object.entries / Object.values** | Iterate over an object's keys/values | `Object.entries(draft)`, `Object.values(draft)` |
| **Array.reduce** | Combine an array into a single value (total budget) | `.reduce((a, b) => a + b, 0)` |
| **Direct localStorage access** | Skipping the React layer for backup/import — read/write the source of truth | inside `exportAll`, `importAll` |
| **FileReader API** | Read user-uploaded file contents in JavaScript | `new FileReader().readAsText(file)` |
| **Blob + URL.createObjectURL** | Build a file in memory and trigger download | `exportAll` |
| **location.reload()** | After replacing localStorage from outside React, simplest way to re-init the app | After import or reset |
| **confirm()** | Native yes/no dialog for destructive actions | inside `resetAll` |

---

## My contribution

_(Fill in: which sections (preferences, budgets, data backup/import), or specific bug fixes you wrote.)_

---

## Summary Table

| Feature | Lives where | What it does |
|---|---|---|
| Currency | `Preferences` card | Updates `settings.currency` immediately, affects all money formatting app-wide |
| Alert threshold | range slider, batched | When categories pass this % of their budget, alerts fire on the Dashboard |
| Edit budget | draft pattern | Type the new limit, save commits draft → real budgets |
| Add category to budget | pill row below the list | Adds with default 100, then user edits |
| Remove budget | trash icon | Removes from draft, save commits |
| Export backup | `exportAll()` | Builds JSON of all 5 localStorage keys, downloads as file |
| Import backup | `importAll()` | Reads JSON file, writes each section to localStorage, reloads page |
| Load Sample Data | `populateDummy()` + `lib/dummy.js` | Confirms, generates 6 months of randomized transactions + 3 goals + 3 recurring rules, writes to localStorage, reloads |
| Reset all data | `onReset` → App.jsx | Confirm dialog, wipe all 5 keys, reload. Falls back to defaults |
