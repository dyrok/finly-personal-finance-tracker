import { useState, useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import AchievementBadge from "./AchievementBadge";
import { ACHIEVEMENT_DEFINITIONS, CATEGORIES, useAchievements } from "../lib/achievements";

export default function AchievementsPage({ transactions, goals, recurring, budgets, toaster }) {
  const { unlocked, checkAndUnlock } = useAchievements(transactions, goals, recurring, budgets);
  const [filter, setFilter] = useState("all");
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const prevUnlockedRef = useRef([]);

  useEffect(() => {
    const prevIds = new Set(prevUnlockedRef.current.map((a) => a.id));
    const newOnes = unlocked.filter((a) => !prevIds.has(a.id));
    if (newOnes.length > 0) {
      setNewlyUnlocked((prev) => [...prev, ...newOnes]);
      for (const a of newOnes) {
        toaster?.show(`Achievement unlocked: ${a.title}`, "success");
      }
      prevUnlockedRef.current = unlocked;
    }
  }, [unlocked, toaster]);

  useEffect(() => {
    checkAndUnlock();
  }, [checkAndUnlock]);

  const filtered =
    filter === "all"
      ? ACHIEVEMENT_DEFINITIONS
      : ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-600" />
          <h2 className="text-xl font-bold text-stone-900">Achievements</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-semibold">
            {unlocked.length}/{ACHIEVEMENT_DEFINITIONS.length}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
            filter === "all" ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition ${
              filter === cat ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((def) => {
          const earned = unlocked.find((a) => a.id === def.id);
          return <AchievementBadge key={def.id} achievement={earned} lockedDef={!earned ? def : null} />;
        })}
      </div>

      {newlyUnlocked.length > 0 && (
        <div className="card border-emerald-200 bg-emerald-50/50">
          <h3 className="font-semibold text-emerald-800 mb-2">New Achievements Unlocked!</h3>
          <div className="space-y-2">
            {newlyUnlocked.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-emerald-700">
                <span>{a.icon}</span>
                <span className="font-medium">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}