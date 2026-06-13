import GroupCard from './GroupCard.jsx';
import { GROUP_LETTERS } from '../data/tournamentData.js';

export default function GroupStage({ groupPicks, onPick, readOnly }) {
  const completed = GROUP_LETTERS.filter(l => groupPicks[l]?.length >= 2).length;
  const pct = Math.round((completed / 12) * 100);

  return (
    <div>
      {!readOnly && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-emerald-400">Pick 2 qualifiers per group</span>
            <span className="text-grass-400 font-semibold">{completed}/12 groups done</span>
          </div>
          <p className="text-xs text-emerald-700 mb-3">
            Click once to pick <span className="text-gold-400 font-semibold">1st place</span>, click again for <span className="text-slate-400 font-semibold">2nd place</span>. Order matters — it determines your Round of 32 matchups. After all groups, you'll choose which 8 third-place teams qualify.
          </p>
          <div className="h-1.5 rounded-full bg-pitch-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-grass-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {GROUP_LETTERS.map(letter => (
          <GroupCard
            key={letter}
            letter={letter}
            picks={groupPicks[letter] ?? []}
            onPick={onPick}
            readOnly={readOnly}
          />
        ))}
      </div>

    </div>
  );
}
