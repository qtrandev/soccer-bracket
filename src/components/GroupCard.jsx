import TeamFlag from './TeamFlag.jsx';
import { GROUPS, GROUP_MATCHES, VENUES } from '../data/tournamentData.js';
import { STRENGTHS } from '../data/teamStrengths.js';
import StrengthStars from './StrengthStars.jsx';
import { formatMatchDate, formatMatchTime } from '../utils/bracket.js';

const POSITION_LABELS = ['1st', '2nd', '3rd', '4th'];
const POSITION_COLORS = [
  'text-gold-400 border-gold-500/50 bg-gold-500/10',
  'text-slate-300 border-slate-400/40 bg-slate-400/8',
  'text-emerald-600',
  'text-emerald-800',
];

export default function GroupCard({ letter, picks, onPick, readOnly }) {
  const teams = GROUPS[letter].teams;
  const games = GROUP_MATCHES[letter] ?? [];

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
          {Math.min(picks.length, 2)}/2 picked
        </span>
      </div>

      <div className="space-y-1">
        {teams.map(code => {
          const pos = getPosition(code);
          const isPicked = pos === 0 || pos === 1;
          const isFirst = pos === 0;
          const isSecond = pos === 1;
          const isEliminated = picks.length >= 2 && (pos < 0 || pos > 1);

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

      {picks.length >= 2 && (
        <div className="mt-2 pt-2 border-t border-emerald-900/30 flex gap-2 text-xs text-emerald-600">
          <span>↑ Advancing:</span>
          {picks.slice(0, 2).map((c, i) => (
            <span key={c} className={i === 0 ? 'text-gold-500' : 'text-slate-400'}>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Per-game schedule */}
      {games.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-900/30">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">Schedule</div>
          {[0, 1, 2].map(md => (
            <div key={md} className={md > 0 ? 'mt-2.5 pt-2.5 border-t border-emerald-900/20' : ''}>
              <div className="text-[9px] text-emerald-800 mb-1.5">Matchday {md + 1}</div>
              {games.slice(md * 2, md * 2 + 2).map(game => (
                <div key={game.id} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-1 text-[10px] min-w-0">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <TeamFlag code={game.home} size="xs" />
                      <span className="text-emerald-600 flex-shrink-0">{game.home}</span>
                    </div>
                    <span className="text-emerald-700 flex-shrink-0">vs</span>
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <TeamFlag code={game.away} size="xs" />
                      <span className="text-emerald-600 flex-shrink-0">{game.away}</span>
                    </div>
                    <span className="text-[9px] text-emerald-700 flex-shrink-0 ml-1">{formatMatchTime(game.date, game.time)}</span>
                  </div>
                  <div className="text-[9px] text-emerald-800 mt-0.5 truncate">
                    📍 {VENUES[game.venue].name}, {VENUES[game.venue].city} · {formatMatchDate(game.date, game.time)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
