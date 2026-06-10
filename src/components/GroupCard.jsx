import TeamFlag from './TeamFlag.jsx';
import { GROUPS } from '../data/tournamentData.js';
import { STRENGTHS } from '../data/teamStrengths.js';
import StrengthStars from './StrengthStars.jsx';

const POSITION_LABELS = ['1st', '2nd', '3rd', '4th'];
const POSITION_COLORS = [
  'text-gold-400 border-gold-500/50 bg-gold-500/10',
  'text-slate-300 border-slate-400/40 bg-slate-400/8',
  'text-emerald-600',
  'text-emerald-800',
];

export default function GroupCard({ letter, picks, onPick, readOnly }) {
  const teams = GROUPS[letter].teams;

  function getPosition(code) {
    return picks.indexOf(code); // -1 = not picked, 0 = 1st, 1 = 2nd
  }

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base text-emerald-100">
          Group <span className="text-grass-400">{letter}</span>
        </h3>
        <span className="text-xs text-emerald-700">
          {picks.length}/2 picked
        </span>
      </div>

      <div className="space-y-1">
        {teams.map(code => {
          const pos = getPosition(code);
          const isPicked = pos >= 0;
          const isFirst = pos === 0;
          const isSecond = pos === 1;
          const isEliminated = picks.length >= 2 && !isPicked;

          let pillClass = 'team-pill';
          if (isFirst) pillClass += ' selected-1st';
          else if (isSecond) pillClass += ' selected-2nd';
          else if (isEliminated) pillClass += ' eliminated';

          return (
            <div
              key={code}
              className={pillClass}
              onClick={() => !readOnly && onPick(letter, code)}
              title={readOnly ? undefined : isPicked ? 'Click to deselect' : 'Click to pick as qualifier'}
            >
              <span className="w-6 text-center flex-shrink-0">
                {isPicked ? (
                  <span className={`text-xs font-bold ${isFirst ? 'text-gold-400' : 'text-slate-400'}`}>
                    {isFirst ? '🥇' : '🥈'}
                  </span>
                ) : (
                  <span className="text-xs text-emerald-800">·</span>
                )}
              </span>
              <TeamFlag code={code} size="sm" showName />
              <StrengthStars strength={STRENGTHS[code]} className="ml-auto text-xs flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {picks.length === 2 && (
        <div className="mt-2 pt-2 border-t border-emerald-900/30 flex gap-2 text-xs text-emerald-600">
          <span>↑ Advancing:</span>
          {picks.slice(0, 2).map((c, i) => (
            <span key={c} className={i === 0 ? 'text-gold-500' : 'text-slate-400'}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
