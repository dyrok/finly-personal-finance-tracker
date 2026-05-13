import { Target, CheckCircle2 } from "lucide-react";

export default function WeeklyChallengeCard({ challenge, progress, onAccept, onComplete }) {
  if (!challenge) {
    return (
      <div className="card bg-stone-50">
        <div className="text-sm text-stone-500 text-center">No active challenge this week</div>
      </div>
    );
  }

  return (
    <div className={`card ${progress?.complete ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-brand-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Weekly Challenge</span>
      </div>

      <div className="text-lg font-bold text-stone-900">{challenge.title}</div>
      <div className="text-sm text-stone-500 mt-1">{challenge.description}</div>

      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress.complete ? "bg-emerald-500" : "bg-brand-500"
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-medium text-brand-600">
          +{challenge.reward} points reward
        </div>
        {!onComplete ? (
          <button onClick={onAccept} className="btn-primary text-sm py-1.5">
            Accept Challenge
          </button>
        ) : (
          <button
            onClick={onComplete}
            disabled={!progress?.complete}
            className="btn-primary text-sm py-1.5 flex items-center gap-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </button>
        )}
      </div>
    </div>
  );
}