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
          <div className="h-1.5 rounded-full bg-pitch-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-grass-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {!readOnly && completed === 12 && (
        <div className="mt-6 text-center animate-fade-in">
          <p className="text-grass-400 font-semibold text-lg">
            ✓ All groups complete! Move to the knockout bracket →
          </p>
        </div>
      )}
    </div>
  );
}
