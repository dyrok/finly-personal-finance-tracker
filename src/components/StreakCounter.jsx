import { Flame } from "lucide-react";
import { STREAK_MILESTONES, getNextMilestone } from "../lib/streak";

export default function StreakCounter({ streak, longestStreak }) {
  const nextMilestone = getNextMilestone(streak);
  const progress = nextMilestone
    ? Math.min(100, (streak / nextMilestone) * 100)
    : 100;

  const isMilestone = STREAK_MILESTONES.includes(streak);

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
            streak > 0
              ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          {streak > 0 ? <Flame className="w-7 h-7" /> : <span>{streak}</span>}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Daily Streak</div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums">{streak} {streak === 1 ? "day" : "days"}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>Progress to {nextMilestone} days</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              isMilestone ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-brand-400 to-brand-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {longestStreak > 0 && (
        <div className="mt-2 text-xs text-stone-400">
          Longest streak: <span className="font-medium text-stone-600">{longestStreak} days</span>
        </div>
      )}
    </div>
  );
}