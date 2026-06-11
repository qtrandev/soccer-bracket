import BracketMatch from './BracketMatch.jsx';
import TeamFlag from './TeamFlag.jsx';
import { buildBracket } from '../utils/bracket.js';
import { ROUND_LABELS, FINAL_MATCH } from '../data/tournamentData.js';

const ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'];

// Heights per round for vertical spacing (each round doubles the previous).
// r32 is sized to just fit a full card (venue + 2 team rows with stars + time).
const ROUND_ITEM_HEIGHT = {
  r32: 148,
  r16: 296,
  qf: 592,
  sf: 1184,
  final: 1184,
};

function RoundColumn({ label, matches, onPick, readOnly, round, mirror = false }) {
  const itemH = ROUND_ITEM_HEIGHT[round] ?? 88;
  const isLast = round === 'final';
  const matchArray = Array.isArray(matches) ? matches : [matches];

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 176 }}>
      <div className="text-center mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 px-2 py-1 rounded border border-emerald-900/40">
          {label}
        </span>
      </div>

      <div className="relative flex flex-col">
        {matchArray.map((match, i) => (
          <div
            key={match.id}
            className="flex items-center"
            style={{ height: itemH, position: 'relative' }}
          >
            {!isLast && (
              <>
                {/* Horizontal arm toward next round */}
                <div
                  style={{
                    position: 'absolute',
                    [mirror ? 'left' : 'right']: -24,
                    top: '50%',
                    width: 24,
                    height: 2,
                    background: 'rgba(34,197,94,0.25)',
                  }}
                />
                {/* Vertical bar pairs even+odd matches — only when there are 2+ matches */}
                {i % 2 === 0 && matchArray.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      [mirror ? 'left' : 'right']: -24,
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
              isCompact={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnockoutBracket({ groupPicks, wildcards, knockoutPicks, onPick, readOnly }) {
  const bracket = buildBracket(groupPicks, knockoutPicks, wildcards);
  const champion = knockoutPicks?.[FINAL_MATCH.id];

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

          {/* Final in center — same flex-col structure as RoundColumn so the card
              center aligns with the SF horizontal arms at top:50% of sf slot */}
          <div className="flex flex-col flex-shrink-0" style={{ width: 208 }}>
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-400 px-2 py-1 rounded border border-gold-500/60 bg-gold-500/10">
                🏆 Final
              </span>
            </div>
            <div
              className="relative flex items-center justify-center rounded-2xl"
              style={{
                height: ROUND_ITEM_HEIGHT.sf,
                background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)',
                boxShadow: '0 0 60px rgba(245,158,11,0.07)',
              }}
            >
              {/* Incoming connector arms from both SF columns */}
              <div style={{ position: 'absolute', left: -24, top: '50%', width: 24, height: 2, background: 'rgba(34,197,94,0.25)' }} />
              <div style={{ position: 'absolute', right: -24, top: '50%', width: 24, height: 2, background: 'rgba(34,197,94,0.25)' }} />
              <BracketMatch
                match={bracket.final}
                onPick={onPick}
                readOnly={readOnly}
                isCompact={false}
                isFinal
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
            mirror
          />
          <RoundColumn
            label="Quarterfinals"
            round="qf"
            matches={bracket.qf.slice(2, 4)}
            onPick={onPick}
            readOnly={readOnly}
            mirror
          />
          <RoundColumn
            label="Round of 16"
            round="r16"
            matches={bracket.r16.slice(4, 8)}
            onPick={onPick}
            readOnly={readOnly}
            mirror
          />
          <RoundColumn
            label="Round of 32"
            round="r32"
            matches={bracket.r32.slice(8, 16)}
            onPick={onPick}
            readOnly={readOnly}
            mirror
          />
        </div>
      </div>
    </div>
  );
}
