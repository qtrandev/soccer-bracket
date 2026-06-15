import TeamFlag from './TeamFlag.jsx';
import StrengthStars from './StrengthStars.jsx';
import { STRENGTHS, STRENGTH_RANKS } from '../data/teamStrengths.js';

export default function ThirdPlaceSelector({ candidates, wildcards, onToggle, readOnly }) {
  const selectedCount = wildcards.length;
  const isComplete = selectedCount === 8;

  return (
    <div className="mt-8 animate-fade-in">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-emerald-100">Pick 8 Third-Place Qualifiers</h2>
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
            isComplete
              ? 'text-grass-400 bg-grass-500/10 border-grass-500/30'
              : 'text-emerald-500 bg-emerald-900/20 border-emerald-800/40'
          }`}>
            {selectedCount}/8
          </span>
        </div>
        <p className="text-xs text-emerald-600 mb-4">
          The top 2 teams from each group advance automatically. FIFA also sends the 8 best
          third-place teams to the Round of 32.{!readOnly && ' Pick which ones qualify.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
          {candidates.map(({ group, team }) => {
            const isSelected = wildcards.includes(team);
            const isDisabled = !readOnly && !isSelected && selectedCount >= 8;

            return (
              <button
                key={`${group}-${team}`}
                onClick={() => !readOnly && !isDisabled && onToggle(team)}
                disabled={isDisabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left w-full ${
                  isSelected
                    ? 'border-grass-500/60 bg-grass-500/15 text-emerald-100'
                    : isDisabled
                    ? 'border-emerald-900/20 bg-pitch-900/20 text-emerald-800 opacity-40 cursor-not-allowed'
                    : 'border-emerald-800/40 bg-pitch-800/30 text-emerald-400 hover:border-emerald-600/60 hover:bg-emerald-900/20 cursor-pointer'
                }`}
              >
                <span className="text-[10px] text-emerald-700 font-bold w-3 flex-shrink-0">{group}</span>
                <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-500 px-1 py-0.5 rounded flex-shrink-0">
                  #{STRENGTH_RANKS[team]}
                </span>
                <TeamFlag code={team} size="sm" showName showCode />
                <span className="ml-auto flex-shrink-0 flex items-center gap-1">
                  <StrengthStars strength={STRENGTHS[team]} className="text-[10px]" />
                  {isSelected && <span className="text-grass-400 text-xs font-bold">✓</span>}
                </span>
              </button>
            );
          })}
        </div>

        {isComplete && !readOnly && (
          <p className="mt-4 text-sm text-grass-400 font-semibold animate-fade-in">
            ✓ 8 third-place qualifiers selected — you're ready for the knockout bracket!
          </p>
        )}
      </div>
    </div>
  );
}
