import TeamFlag from './TeamFlag.jsx';
import { GROUPS, GROUP_MATCHES, VENUES, TEAMS } from '../data/tournamentData.js';
import { STRENGTHS, STRENGTH_RANKS } from '../data/teamStrengths.js';
import StrengthStars from './StrengthStars.jsx';
import { formatMatchDate, formatMatchTime } from '../utils/bracket.js';

const POSITION_LABELS = ['1st', '2nd', '3rd', '4th'];
const POSITION_COLORS = [
  'text-gold-400 border-gold-500/50 bg-gold-500/10',
  'text-slate-300 border-slate-400/40 bg-slate-400/8',
  'text-emerald-600',
  'text-emerald-800',
];

export default function GroupCard({ letter, picks, onPick, onThirdPick = () => {}, readOnly, wildcard = null, wildcardsFull = false, id, standings = {} }) {
  const teams = GROUPS[letter].teams;
  const games = GROUP_MATCHES[letter] ?? [];

  function getPosition(code) {
    return picks.indexOf(code); // -1 = not picked, 0 = 1st, 1 = 2nd
  }

  return (
    <div id={id} className="glass-card p-4 animate-fade-in">
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
          const isThirdPick = picks.length >= 2 && !isPicked && code === wildcard;
          const isLocked = picks.length >= 2 && !isPicked && !isThirdPick && wildcardsFull;
          const isEliminated = picks.length >= 2 && !isPicked && !isThirdPick && !isLocked;

          let pillClass = 'team-pill';
          if (isFirst) pillClass += ' selected-1st';
          else if (isSecond) pillClass += ' selected-2nd';
          else if (isThirdPick) pillClass += ' selected-3rd';
          else if (isLocked) pillClass += ' eliminated cursor-not-allowed';
          else if (isEliminated) pillClass += ' eliminated';

          const handleClick = () => {
            if (readOnly || isLocked) return;
            if (picks.length >= 2 && !isPicked) onThirdPick(code);
            else onPick(letter, code);
          };

          const tooltipText = readOnly ? undefined
            : isPicked ? 'Click to deselect'
            : isThirdPick ? 'Click to remove 3rd place pick'
            : isLocked ? '8 wildcards already picked — deselect another group first'
            : picks.length >= 2 ? 'Click to pick as 3rd place wildcard'
            : 'Click to pick as qualifier';

          return (
            <div
              key={code}
              className={pillClass}
              onClick={handleClick}
              title={tooltipText}
            >
              <span className="w-6 text-center flex-shrink-0">
                {isPicked ? (
                  <span className={`text-xs font-bold ${isFirst ? 'text-gold-400' : 'text-slate-400'}`}>
                    {isFirst ? '🥇' : '🥈'}
                  </span>
                ) : isThirdPick ? (
                  <span className="text-xs font-bold text-amber-500">🥉</span>
                ) : (
                  <span className="text-xs text-emerald-800">·</span>
                )}
              </span>
              <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-500 px-1 py-0.5 rounded flex-shrink-0">
                #{STRENGTH_RANKS[code]}
              </span>
              <TeamFlag code={code} size="sm" showName showCode />
              {standings[code]?.gp > 0 && (
                <span className="text-[10px] text-emerald-600 flex-shrink-0 whitespace-nowrap">
                  · {standings[code].pts}pts GD{standings[code].gd > 0 ? '+' : ''}{standings[code].gd}
                </span>
              )}
              <StrengthStars strength={STRENGTHS[code]} className="ml-auto text-xs flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {picks.length >= 2 && (
        <div className="mt-2 pt-2 border-t border-emerald-900/30 flex gap-2 text-xs text-emerald-600 flex-wrap">
          <span>↑ Advancing:</span>
          {picks.slice(0, 2).map((c, i) => (
            <span key={c} className={i === 0 ? 'text-gold-500' : 'text-slate-400'}>
              {c}
            </span>
          ))}
          {wildcard && (
            <>
              <span>·</span>
              <button
                onClick={() => !readOnly && onThirdPick(wildcard)}
                className={`flex items-center gap-1 ${readOnly ? '' : 'hover:opacity-75 transition-opacity'}`}
                title={readOnly ? undefined : 'Click to remove 3rd place pick'}
              >
                <span className="text-amber-600 font-semibold">[3RD]</span>
                <span className="text-amber-500">{wildcard}</span>
                {!readOnly && <span className="text-red-500 font-bold text-sm leading-none">×</span>}
              </button>
            </>
          )}
        </div>
      )}

      {/* Per-game schedule */}
      {games.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-900/30">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">Schedule</div>
          {[0, 1, 2].map(md => (
            <div key={md} className={md > 0 ? 'mt-2.5 pt-2.5 border-t border-emerald-900/20' : ''}>
              <div className="text-[9px] text-emerald-800 mb-1.5">Matchday {md + 1}</div>
              {games.slice(md * 2, md * 2 + 2).map(game => {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${TEAMS[game.home].name} vs ${TEAMS[game.away].name} 2026 FIFA World Cup`)}`;
                return (
                  <a
                    key={game.id}
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-2 last:mb-0 rounded hover:bg-emerald-900/20 transition-colors -mx-1 px-1 py-0.5"
                  >
                    <div className="flex items-center gap-1 text-[10px] min-w-0">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <TeamFlag code={game.home} size="xs" />
                      </div>
                      <span className="text-emerald-700 flex-shrink-0">vs</span>
                      <div className="flex items-center gap-1 flex-1 min-w-0 ml-1">
                        <TeamFlag code={game.away} size="xs" />
                      </div>
                      <div className="flex-shrink-0 text-right ml-1">
                        <div className="text-[9px] text-emerald-700">{formatMatchTime(game.date, game.time)}</div>
                        <div className="text-[9px] text-emerald-800">{formatMatchDate(game.date, game.time)}</div>
                      </div>
                      <span className="text-[9px] text-emerald-800 ml-0.5">↗</span>
                    </div>
                    <div className="text-[9px] text-emerald-800 mt-0.5 truncate">
                      📍 {VENUES[game.venue].name}, {VENUES[game.venue].city}
                    </div>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
