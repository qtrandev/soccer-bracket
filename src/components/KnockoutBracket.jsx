import BracketMatch from './BracketMatch.jsx';
import TeamFlag from './TeamFlag.jsx';
import { buildBracket } from '../utils/bracket.js';
import { ROUND_LABELS } from '../data/tournamentData.js';

const ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'];

// Heights per round for vertical spacing
const ROUND_ITEM_HEIGHT = {
  r32: 88,
  r16: 176,
  qf: 352,
  sf: 704,
  final: 704,
};

function RoundColumn({ label, matches, onPick, readOnly, round }) {
  const itemH = ROUND_ITEM_HEIGHT[round] ?? 88;
  const isLast = round === 'final';

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 192 }}>
      <div className="text-center mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 px-2 py-1 rounded border border-emerald-900/40">
          {label}
        </span>
      </div>

      <div className="relative flex flex-col">
        {(Array.isArray(matches) ? matches : [matches]).map((match, i) => (
          <div
            key={match.id}
            className="flex items-center"
            style={{ height: itemH, position: 'relative' }}
          >
            {/* Connector lines */}
            {!isLast && (
              <>
                {/* Horizontal arm right */}
                <div
                  style={{
                    position: 'absolute',
                    right: -24,
                    top: '50%',
                    width: 24,
                    height: 2,
                    background: 'rgba(34,197,94,0.25)',
                  }}
                />
                {/* Vertical bar (top half connects down, bottom half connects up) */}
                {i % 2 === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -24,
                      top: '50%',
                      height: itemH,
                      width: 2,
                      background: 'rgba(34,197,94,0.25)',
                    }}
                  />
                )}
              </>
            )}

            <BracketMatch
              match={match}
              onPick={onPick}
              readOnly={readOnly}
              isCompact={round === 'r32' || round === 'r16'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnockoutBracket({ groupPicks, wildcards, knockoutPicks, onPick, readOnly }) {
  const bracket = buildBracket(groupPicks, knockoutPicks, wildcards);
  const champion = knockoutPicks?.final;

  const totalMatches = 31;
  const pickedMatches = Object.values(knockoutPicks ?? {}).filter(Boolean).length;

  return (
    <div>
      {!readOnly && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-emerald-400">
            Click a team to advance them. Picks auto-propagate forward.
          </p>
          <span className="text-sm text-grass-400 font-semibold">
            {pickedMatches}/{totalMatches} matches picked
          </span>
        </div>
      )}

      {champion && (
        <div className="mb-6 p-4 rounded-xl border border-gold-500/40 bg-gold-500/10 text-center animate-fade-in">
          <p className="text-xs text-gold-400 uppercase tracking-widest mb-1">Your Champion</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🏆</span>
            <TeamFlag code={champion} size="lg" showName />
            <span className="text-2xl">🏆</span>
          </div>
        </div>
      )}

      {/* Scrollable bracket */}
      <div className="overflow-x-auto pb-6">
        <div
          className="flex gap-6 min-w-max"
          style={{ paddingBottom: 24 }}
        >
          {/* Left half: r32 1-8, r16 1-4, qf 1-2, sf-1 */}
          <RoundColumn
            label="Round of 32"
            round="r32"
            matches={bracket.r32.slice(0, 8)}
            onPick={onPick}
            readOnly={readOnly}
          />
          <RoundColumn
            label="Round of 16"
            round="r16"
            matches={bracket.r16.slice(0, 4)}
            onPick={onPick}
            readOnly={readOnly}
          />
          <RoundColumn
            label="Quarterfinals"
            round="qf"
            matches={bracket.qf.slice(0, 2)}
            onPick={onPick}
            readOnly={readOnly}
          />
          <RoundColumn
            label="Semifinals"
            round="sf"
            matches={[bracket.sf[0]]}
            onPick={onPick}
            readOnly={readOnly}
          />

          {/* Final in center */}
          <div className="flex flex-col flex-shrink-0" style={{ width: 192 }}>
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-500 px-2 py-1 rounded border border-gold-500/40">
                🏆 Final
              </span>
            </div>
            <div className="flex items-center" style={{ height: 704 }}>
              <BracketMatch
                match={bracket.final}
                onPick={onPick}
                readOnly={readOnly}
                isCompact={false}
              />
            </div>
          </div>

          {/* Right half: sf-2, qf 3-4, r16 5-8, r32 9-16 */}
          <RoundColumn
            label="Semifinals"
            round="sf"
            matches={[bracket.sf[1]]}
            onPick={onPick}
            readOnly={readOnly}
          />
          <RoundColumn
            label="Quarterfinals"
            round="qf"
            matches={bracket.qf.slice(2, 4)}
            onPick={onPick}
            readOnly={readOnly}
          />
          <RoundColumn
            label="Round of 16"
            round="r16"
            matches={bracket.r16.slice(4, 8)}
            onPick={onPick}
            readOnly={readOnly}
          />
          <RoundColumn
            label="Round of 32"
            round="r32"
            matches={bracket.r32.slice(8, 16)}
            onPick={onPick}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
