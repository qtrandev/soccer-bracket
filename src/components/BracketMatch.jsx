import TeamFlag from './TeamFlag.jsx';
import { VENUES } from '../data/tournamentData.js';
import { STRENGTHS } from '../data/teamStrengths.js';
import { formatMatchDate, formatMatchTime } from '../utils/bracket.js';
import StrengthStars from './StrengthStars.jsx';

export default function BracketMatch({ match, onPick, readOnly, isCompact, isFinal }) {
  const { id, team1, team2, winner, venue, date, time } = match;
  const venueInfo = venue ? VENUES[venue] : null;

  const canPick = !readOnly && team1 && team2;

  function handlePick(teamCode) {
    if (!canPick) return;
    onPick?.(id, teamCode);
  }

  return (
    <div className={isFinal ? 'bracket-card-final group' : 'bracket-card group'} title={venueInfo ? `${venueInfo.name} · ${venueInfo.city}` : undefined}>
      {/* Match info tooltip row */}
      {!isCompact && venueInfo && (
        <div className="px-3 pt-1.5 pb-0.5 text-[10px] text-emerald-700 border-b border-emerald-900/20">
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">{venueInfo.city}</span>
            {date && <span className="ml-auto flex-shrink-0">{formatMatchDate(date, time)}</span>}
          </div>
          <div className="truncate text-emerald-800 text-right">{venueInfo.name}</div>
        </div>
      )}

      {/* Team rows */}
      {[team1, team2].map((teamCode, i) => {
        const isTbd = !teamCode;
        const isWinner = winner && winner === teamCode;
        const isLoser = winner && teamCode && winner !== teamCode;

        let rowClass = 'bracket-team-row';
        if (isTbd) rowClass += ' tbd';
        else if (isWinner) rowClass += ' winner';
        else if (isLoser) rowClass += ' opacity-40';

        return (
          <div
            key={i}
            className={rowClass}
            onClick={() => teamCode && handlePick(teamCode)}
            title={canPick && teamCode ? `Pick ${teamCode} to advance` : undefined}
          >
            {isTbd ? (
              <span className="text-xs text-emerald-800">TBD</span>
            ) : (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <TeamFlag code={teamCode} size="xs" showName />
                    {isWinner && <span className="ml-auto text-xs">✓</span>}
                    {!winner && canPick && (
                      <span className="ml-auto text-emerald-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        pick
                      </span>
                    )}
                  </div>
                  <StrengthStars strength={STRENGTHS[teamCode]} className="text-[10px] mt-0.5" />
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Time row */}
      {!isCompact && date && time && (
        <div className="px-3 py-1 text-[10px] text-emerald-800 border-t border-emerald-900/20">
          {formatMatchTime(date, time)}
        </div>
      )}
    </div>
  );
}
