import { useState } from "react";
import { Plus, Target, Trash2, Minus, Edit3, Check, X } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { formatMoney, prettyDate } from "../lib/format";
import { uid } from "../lib/storage";

export default function Goals({ goals, setGoals, currency, toaster }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  function addGoal(goal) {
    setGoals((prev) => [{ id: uid(), saved: 0, createdAt: new Date().toISOString(), ...goal }, ...prev]);
    setShowForm(false);
    toaster.show("Goal created", "success");
  }

  function deleteGoal(id) {
    if (!confirm("Delete this goal?")) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toaster.show("Goal deleted", "info");
  }

  function adjustSaved(id, delta) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, saved: Math.max(0, Number(g.saved) + delta) } : g)),
    );
  }

  function updateGoal(id, patch) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    setEditing(null);
    toaster.show("Goal updated", "success");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Savings Goals</h2>
          <p className="text-sm text-slate-500">Track progress toward what matters</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {showForm && <GoalForm onAdd={addGoal} onCancel={() => setShowForm(false)} />}

      {goals.length === 0 && !showForm ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Set a target — emergency fund, vacation, new laptop — and watch your progress."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                Create your first goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            const remaining = Math.max(0, g.target - g.saved);
            const complete = pct >= 100;
            const deadline = g.deadline ? new Date(g.deadline) : null;
            const daysLeft = deadline
              ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <div key={g.id} className="card relative overflow-hidden">
                {complete && (
                  <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                    Complete 🎉
                  </div>
                )}
                {editing === g.id ? (
                  <GoalEditForm
                    goal={g}
                    onSave={(patch) => updateGoal(g.id, patch)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="text-3xl mb-2">{g.emoji || "🎯"}</div>
                    <h3 className="font-bold text-slate-900 text-lg">{g.name}</h3>
                    {g.note ? <p className="text-xs text-slate-500 mt-0.5">{g.note}</p> : null}

                    <div className="mt-4">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xl font-bold text-slate-900 tabular-nums">
                          {formatMoney(g.saved, currency)}
                        </span>
                        <span className="text-sm text-slate-500 tabular-nums">
                          / {formatMoney(g.target, currency)}
                        </span>
                      </div>
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
                      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                        <span>{pct.toFixed(0)}% saved</span>
                        <span>{formatMoney(remaining, currency)} to go</span>
                      </div>
                    </div>

                    {deadline && (
                      <div className="mt-3 text-xs text-slate-500">
                        Target date: {prettyDate(g.deadline)}{" "}
                        {daysLeft !== null && daysLeft >= 0 && (
                          <span className="text-slate-700 font-medium">
                            • {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                          </span>
                        )}
                        {daysLeft !== null && daysLeft < 0 && !complete && (
                          <span className="text-rose-600 font-medium">• Overdue</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <ContributeButton onContribute={(amt) => adjustSaved(g.id, amt)} />
                      <button
                        onClick={() => adjustSaved(g.id, -10)}
                        className="btn-ghost p-2"
                        title="-10"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditing(g.id)}
                        className="btn-ghost p-2"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="btn-danger p-2 ml-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContributeButton({ onContribute }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex-1">
        <Plus className="w-4 h-4" />
        Add Funds
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-1">
      <input
        type="number"
        step="0.01"
        min="0"
        autoFocus
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
        placeholder="Amount"
        className="input flex-1 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const n = parseFloat(amt);
            if (n > 0) onContribute(n);
            setAmt("");
            setOpen(false);
          }
          if (e.key === "Escape") {
            setOpen(false);
            setAmt("");
          }
        }}
      />
      <button
        onClick={() => {
          const n = parseFloat(amt);
          if (n > 0) onContribute(n);
          setAmt("");
          setOpen(false);
        }}
        className="p-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100"
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}

function GoalForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    onAdd({
      name: name.trim(),
      target: parseFloat(target),
      emoji,
      deadline: deadline || null,
      note: note.trim(),
    });
  }

  const emojis = ["🎯", "✈️", "🏠", "🚗", "💍", "🎓", "💻", "📱", "🏖️", "💰", "🎁", "🎮"];

  return (
    <form onSubmit={submit} className="card">
      <h3 className="font-semibold text-slate-900 mb-4">New Savings Goal</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Goal name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Emergency Fund"
            className="input"
          />
        </div>
        <div>
          <label className="label">Target amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="5000"
            className="input"
          />
        </div>
        <div>
          <label className="label">Target date (optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Icon</label>
          <div className="flex flex-wrap gap-1">
            {emojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg transition ${
                  emoji === e ? "bg-brand-100 ring-2 ring-brand-500" : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            className="input"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="btn-primary flex-1">
          Create Goal
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

function GoalEditForm({ goal, onSave, onCancel }) {
  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(goal.target);
  const [saved, setSaved] = useState(goal.saved);
  const [deadline, setDeadline] = useState(goal.deadline || "");

  return (
    <div className="space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Saved</label>
          <input
            type="number"
            step="0.01"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Target</label>
          <input
            type="number"
            step="0.01"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="input"
          />
        </div>
      </div>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="input"
      />
      <div className="flex gap-2">
        <button
          onClick={() =>
            onSave({
              name: name.trim(),
              target: parseFloat(target),
              saved: parseFloat(saved),
              deadline: deadline || null,
            })
          }
          className="btn-primary flex-1"
        >
          Save
        </button>
        <button onClick={onCancel} className="btn-ghost">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
