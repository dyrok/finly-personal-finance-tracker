import { Lock } from "lucide-react";

export default function AchievementBadge({ achievement, lockedDef }) {
  if (achievement) {
    return (
      <div className="bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl">
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-stone-900">{achievement.title}</div>
            <div className="text-xs text-stone-500 mt-0.5">{achievement.description}</div>
            <div className="text-xs text-stone-400 mt-1">
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lockedDef) {
    return (
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 opacity-60">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-stone-600">???</div>
            <div className="text-xs text-stone-400 mt-0.5">Keep using Finly to unlock</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}