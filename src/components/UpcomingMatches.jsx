import { useState, useEffect, useRef, useMemo } from 'react';
import { TEAMS, GROUPS, GROUP_MATCHES, VENUES, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../data/tournamentData.js';
import { formatMatchTime } from '../utils/bracket.js';
import { STRENGTHS, STRENGTH_RANKS } from '../data/teamStrengths.js';
import StrengthStars from './StrengthStars.jsx';
import { useStandings } from '../hooks/useStandings.js';

function useScores() {
  const [scores, setScores] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    function scheduleNext(data) {
      clearInterval(timerRef.current);
      const hasLive = Object.values(data).some(s => s.state === 'in');
      timerRef.current = setInterval(load, hasLive ? 3000 : 10000);
    }

    async function load() {
      try {
        const res = await fetch('/.netlify/functions/scores');
        if (res.ok) {
          const data = await res.json();
          setScores(data);
          scheduleNext(data);
        }
      } catch {}
    }

    function stopPolling() { clearInterval(timerRef.current); }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load();
      else stopPolling();
    };
    const handlePageShow = (e) => { if (e.persisted) load(); };
    const handleFocus = () => load();

    load();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return scores;
}

const ALL_MATCHES = [
  ...Object.entries(GROUP_MATCHES).flatMap(([group, matches]) =>
    matches.map(m => ({ ...m, badge: group, type: 'group' }))
  ),
  ...R32_MATCHES.map(m => ({ ...m, badge: 'R32', type: 'knockout' })),
  ...R16_MATCHES.map(m => ({ ...m, badge: 'R16', type: 'knockout' })),
  ...QF_MATCHES.map(m => ({ ...m, badge: 'QF', type: 'knockout' })),
  ...SF_MATCHES.map(m => ({ ...m, badge: 'SF', type: 'knockout' })),
  { ...FINAL_MATCH, badge: '🏆', type: 'knockout' },
].sort((a, b) => new Date(`${a.date}T${a.time}:00-04:00`) - new Date(`${b.date}T${b.time}:00-04:00`));

const CANONICAL_KEYS = new Set(ALL_MATCHES.map(m => `${m.home}-${m.away}`));

const PAID_CHANNELS = new Set(['FS1', 'FS2', 'ESPN', 'ESPN2', 'ESPN+']);

const WINDOW_DAYS = 10;
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Resolve a slot like 'A1' or 'B2' to a team code using live standings.
// Returns null if the slot is '3RD', the group hasn't finished, or standings are missing.
function resolveSlotFromStandings(slot, standings) {
  if (!slot) return null;
  const m = slot.match(/^([A-L])([12])$/);
  if (!m) return null;
  const [, letter, pos] = m;
  const group = GROUPS[letter];
  if (!group) return null;
  if (group.teams.some(t => (standings[t]?.gp ?? 0) < 3)) return null;
  const sorted = [...group.teams].sort((a, b) => {
    const sa = standings[a] ?? { pts: 0, gd: 0 };
    const sb = standings[b] ?? { pts: 0, gd: 0 };
    if (sb.pts !== sa.pts) return sb.pts - sa.pts;
    return sb.gd - sa.gd;
  });
  return sorted[Number(pos) - 1] ?? null;
}

function localDateKey(dt) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(dt);
}

function localDateLabel(dt) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric',
  }).format(dt);
}

const CARD_Y = '#fde047';
const CARD_R = '#ef4444';
const cardShape = (color, key, sc = 1) => (
  <span key={key} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: `${10 * sc}px`, height: `${14 * sc}px`, background: color, borderRadius: `${1.5 * sc}px`, verticalAlign: 'middle', margin: `0 ${0.5 * sc}px`, flexShrink: 0, overflow: 'hidden', paddingTop: `${sc}px` }}>
    <span style={{ fontSize: `${3.5 * sc}px`, fontWeight: 800, color: 'rgba(0,0,0,0.45)', lineHeight: 1, display: 'block', width: '100%', textAlign: 'center', transform: 'scaleX(1.3)', transformOrigin: 'center', padding: `0 ${sc}px`, boxSizing: 'border-box' }}>FIFA</span>
  </span>
);

function CardIcons({ yellows, reds, compact, scale = 1 }) {
  if (yellows === 0 && reds === 0) return null;
  const cardGroup = (color, prefix, count) => {
    if (count <= 0) return null;
    if (count <= 5) return Array.from({ length: count }, (_, i) => cardShape(color, `${prefix}${i}`, scale));
    return <>{cardShape(color, prefix, scale)}<span style={{ fontSize: `${8 * scale}px` }}>×{count}</span></>;
  };
  if (compact) return (
    <span className="inline-flex items-center gap-0.5">
      {cardGroup(CARD_Y, 'y', yellows)}
      {cardGroup(CARD_R, 'r', reds)}
    </span>
  );
  return (
    <span className="inline-flex items-center">
      {Array.from({ length: yellows }, (_, i) => cardShape(CARD_Y, `y${i}`, scale))}
      {Array.from({ length: reds },    (_, i) => cardShape(CARD_R, `r${i}`, scale))}
    </span>
  );
}

function parseOdds(detail) {
  if (!detail) return null;
  const m = detail.match(/^([A-Z]+)\s+([+-]?\d+)$/);
  if (!m) return null;
  const odds = Number(m[2]);
  const pct = odds < 0
    ? Math.round((-odds) / (-odds + 100) * 100)
    : Math.round(100 / (odds + 100) * 100);
  return { team: m[1], pct, line: m[2] };
}

function isCardInView(matchKey) {
  const el = document.getElementById(`match-${matchKey}`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

function JerseyIcon({ color, dark, size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0, display: 'block', marginTop: size > 20 ? 0 : '-3px' }}>
      <path
        d="M9,2 Q12,6 15,2 L19,4 L21,9 L17,11 L17,22 L7,22 L7,11 L3,9 L5,4 Z"
        fill={color}
        stroke={dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubOverlay({ side, kitColor, iso2, teamName, on, off, min, matchKey, cardInView, onDismiss }) {
  function handleTap() {
    document.getElementById(`match-${matchKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onDismiss?.();
  }
  const jersey = col => <JerseyIcon color={col ?? '#555'} dark size={72} />;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer select-none"
      style={{ background: 'rgba(2,6,10,0.95)', backdropFilter: 'blur(6px)', animation: 'subOverlayLifecycle 4s ease-out forwards' }}
      onClick={handleTap}
    >
      <div className="relative text-center px-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2" style={{ animation: 'subOverlayLifecycle 4s ease-out forwards' }}>
          {iso2 && <img src={`https://flagcdn.com/w40/${iso2}.png`} alt="" style={{ height: '18px', width: 'auto', borderRadius: '3px' }} />}
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.15rem' }}>
            {teamName?.toUpperCase()}{min ? ` — ${min}` : ''}
          </span>
        </div>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.5rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.75rem', animation: 'subOverlayLifecycle 4s ease-out forwards' }}>
          SUBSTITUTION
        </div>

        {/* Jersey swap row */}
        <div className="flex items-center justify-center gap-8">
          {/* OFF jersey */}
          <div style={{ textAlign: 'center', animation: 'subJerseyOff 4s ease-out forwards' }}>
            <div style={{ filter: 'grayscale(50%) brightness(0.7)' }}>{jersey(kitColor)}</div>
            <div style={{ marginTop: '0.5rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12rem' }}>OUT</div>
            {off && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.1rem', maxWidth: '90px' }}>{off}</div>}
          </div>

          {/* Arrow */}
          <div style={{ fontSize: '2.25rem', color: 'rgba(255,255,255,0.45)', animation: 'subArrow 4s ease-out forwards' }}>→</div>

          {/* ON jersey */}
          <div style={{ textAlign: 'center', animation: 'subJerseyOn 4s ease-out forwards' }}>
            {jersey(kitColor)}
            <div style={{ marginTop: '0.5rem', color: 'rgba(74,222,128,0.9)', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12rem' }}>IN</div>
            {on && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.1rem', maxWidth: '90px' }}>{on}</div>}
          </div>
        </div>
      </div>
      <button
        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/15 transition-colors text-4xl font-thin leading-none"
        onClick={e => { e.stopPropagation(); onDismiss?.(); }}
        aria-label="Dismiss"
      >×</button>
      {!cardInView && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/30 text-sm font-semibold animate-pulse tracking-wide pointer-events-none">
          Tap to view match →
        </div>
      )}
    </div>
  );
}

function VAROverlay({ iso2, min, matchKey, cardInView, onDismiss }) {
  function handleTap() {
    document.getElementById(`match-${matchKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onDismiss?.();
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer select-none overflow-hidden"
      style={{ background: 'rgba(0,4,20,0.96)', backdropFilter: 'blur(6px)', animation: 'varOverlayLifecycle 4.5s ease-out forwards' }}
      onClick={handleTap}
    >
      <div className="absolute pointer-events-none" style={{
        left: 0, right: 0, height: '3px', top: 0,
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.7), rgba(147,197,253,1), rgba(59,130,246,0.7), transparent)',
        boxShadow: '0 0 28px rgba(59,130,246,0.9), 0 0 60px rgba(59,130,246,0.4)',
        animation: 'varScanLine 4.5s linear forwards',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(59,130,246,0.025) 3px, rgba(59,130,246,0.025) 4px)',
      }} />
      <div className="relative text-center px-6">
        <div style={{ fontSize: '4.5rem', lineHeight: 1, marginBottom: '0.75rem', animation: 'varOverlayLifecycle 4.5s ease-out forwards' }}>📺</div>
        <div style={{
          fontSize: '7rem', fontWeight: 900, color: '#fff',
          fontFamily: 'monospace',
          animation: 'varTextIn 4.5s ease-out forwards',
          textShadow: '0 0 40px rgba(59,130,246,1), 0 0 80px rgba(59,130,246,0.6), 0 0 160px rgba(59,130,246,0.25)',
        }}>VAR</div>
        <div style={{
          fontSize: '1rem', letterSpacing: '0.5rem', fontWeight: 700,
          color: 'rgba(147,197,253,0.9)', fontFamily: 'monospace',
          marginTop: '-0.25rem',
          animation: 'varOverlayLifecycle 4.5s ease-out forwards',
        }}>VIDEO REVIEW{min ? <span style={{ letterSpacing: '0.1rem', opacity: 0.7, marginLeft: '0.5rem' }}>— {min}</span> : ''}</div>
        {iso2 && (
          <div style={{ marginTop: '1.5rem', animation: 'varFlagIn 4.5s ease-out forwards' }}>
            <img
              src={`https://flagcdn.com/w80/${iso2}.png`} alt=""
              style={{ borderRadius: '6px', height: '48px', width: 'auto', boxShadow: '0 0 30px rgba(59,130,246,0.7), 0 2px 12px rgba(0,0,0,0.6)' }}
            />
          </div>
        )}
      </div>
      <button
        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full text-blue-200/60 hover:text-blue-100 hover:bg-blue-400/20 transition-colors text-4xl font-thin leading-none"
        onClick={e => { e.stopPropagation(); onDismiss?.(); }}
        aria-label="Dismiss"
      >×</button>
      {!cardInView && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-blue-400 text-sm font-semibold animate-pulse tracking-wide pointer-events-none">
          Tap to view match →
        </div>
      )}
    </div>
  );
}

function GoalOverlay({ iso2, teamCode, scorer, minute, matchKey, cardInView, onDismiss }) {
  const pieces = useMemo(() =>
    Array.from({ length: 34 }, (_, i) => ({
      id: i,
      left: `${(i * 11 + 4) % 100}%`,
      delay: (i * 0.08).toFixed(2),
      color: ['#22c55e','#4ade80','#fbbf24','#f59e0b','#ffffff','#86efac','#34d399','#a3e635'][i % 8],
      size: 6 + (i % 5) * 2,
      dur: (1.5 + (i % 5) * 0.32).toFixed(2),
    }))
  , []);

  function handleTap() {
    document.getElementById(`match-${matchKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onDismiss?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-950/90 backdrop-blur-sm animate-overlay-lifecycle cursor-pointer select-none"
         onClick={handleTap}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map(p => (
          <div key={p.id} className="absolute rounded-sm" style={{
            left: p.left, top: '-10px',
            width: `${p.size}px`, height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `confettiFall ${p.dur}s ${p.delay}s linear both`,
          }} />
        ))}
      </div>
      <div className="relative text-center px-6">
        {iso2 && (
          <div className="flex justify-center mb-5 animate-goal-flag-drop">
            <img
              src={`https://flagcdn.com/w160/${iso2}.png`}
              alt={teamCode}
              className="h-28 w-auto rounded-xl"
              style={{ boxShadow: '0 0 60px rgba(34,197,94,0.6), 0 0 120px rgba(34,197,94,0.25)' }}
            />
          </div>
        )}
        <div className="animate-goal-text-in">
          <div className="text-7xl sm:text-8xl font-black text-white leading-none tracking-tight"
               style={{ textShadow: '0 0 40px rgba(34,197,94,1), 0 0 100px rgba(34,197,94,0.5)' }}>
            ⚽ GOAL!
          </div>
          {scorer && (
            <div className="text-2xl font-bold text-grass-400 mt-4">
              {scorer}
              {minute && <span className="text-emerald-600 text-lg ml-2">{minute}</span>}
            </div>
          )}
          <div className="text-sm tracking-widest uppercase text-emerald-700 mt-1 font-semibold">{TEAMS[teamCode]?.name ?? teamCode}</div>
        </div>
      </div>
      <button
        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/15 transition-colors text-4xl font-thin leading-none"
        onClick={e => { e.stopPropagation(); onDismiss?.(); }}
        aria-label="Dismiss"
      >×</button>
      {!cardInView && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-emerald-400 text-sm font-semibold animate-pulse tracking-wide pointer-events-none">
          Tap to view match →
        </div>
      )}
    </div>
  );
}

function FullscreenMatchView({ matchKey, homeCode, awayCode, score, venue: venueProp, badge, matchType, dark: darkProp, onClose,
  goalEvents, varActiveBadges, statBumps, cornerFoulBumps, cornerBumps, foulBumps,
  possStatBumps, shotIconBumps, cardBumps, cardFlashBumps,
  goalOverlay, onDismissGoal, varOverlay, onDismissVar, subOverlay, onDismissSub,
  shotBumpVersion, shotInfo, shotMatchKey }) {
  const overlayRef = useRef(null);
  const [dark, setDark] = useState(darkProp);
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
  const [screenH, setScreenH] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 900);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = e => setPortrait(e.matches);
    mq.addEventListener('change', handler);
    const onResize = () => setScreenH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => { mq.removeEventListener('change', handler); window.removeEventListener('resize', onResize); };
  }, []);
  const home = TEAMS[homeCode];
  const away = TEAMS[awayCode];
  const venueCity = venueProp ? VENUES[venueProp]?.city : null;

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const el = overlayRef.current;
    el?.requestFullscreen?.().catch(() => {});
    const onFsChange = () => { if (!document.fullscreenElement) onCloseRef.current(); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const homeGoals  = score?.goals?.filter(g => g.side === 'home') ?? [];
  const awayGoals  = score?.goals?.filter(g => g.side === 'away') ?? [];
  const homeCards  = score?.cards?.filter(c => c.side === 'home') ?? [];
  const awayCards  = score?.cards?.filter(c => c.side === 'away') ?? [];
  const homeYellows = homeCards.filter(c => c.type === 'yellow').length;
  const homeReds    = homeCards.filter(c => c.type === 'red').length;
  const awayYellows = awayCards.filter(c => c.type === 'yellow').length;
  const awayReds    = awayCards.filter(c => c.type === 'red').length;
  const displayHomeScore = Math.max(score?.homeScore ?? 0, homeGoals.length);
  const displayAwayScore = Math.max(score?.awayScore ?? 0, awayGoals.length);
  const homeGoalAnim = !!goalEvents[`${matchKey}-home`];
  const awayGoalAnim = !!goalEvents[`${matchKey}-away`];
  const anyGoalAnim  = homeGoalAnim || awayGoalAnim;
  const fmtGoal = g => `${g.name} ${g.min}${g.og ? ' (OG)' : g.pk ? ' (P)' : ''}`;
  const st = score?.stats;
  const bumpStyle = key => statBumps.has(`${matchKey}-${key}`) ? { display: 'inline-block', animation: 'statBumpGlow 0.65s ease-out' } : undefined;
  const cfBump    = key => cornerFoulBumps.has(`${matchKey}-${key}`) ? { display: 'inline-block', animation: 'statBumpGlow 0.65s ease-out' } : undefined;

  const bg         = dark ? '#030712' : '#f9fafb';
  const liveClr    = dark ? '#4ade80' : '#16a34a';
  const textClr    = dark ? '#f9fafb' : '#111827';
  const subClr     = dark ? '#6b7280' : '#9ca3af';
  const borderClr  = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const p = portrait || screenH < 520; // compact = portrait OR short landscape (phones)
  const teamBlock = (team, code, kit, altKit, goals, yellows, reds, side) => (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ containerType: 'inline-size' }}>
      <div className={`flex-1 flex flex-col items-center justify-center ${p ? 'gap-2 px-4 py-2' : 'gap-6 px-6 py-4'}`}>
        {team?.iso2 && (
          <img src={`https://flagcdn.com/w160/${team.iso2}.png`} alt={team?.name}
            className="w-auto rounded-2xl shadow-xl object-cover"
            style={{ height: p ? 'clamp(40px, 12vh, 100px)' : 'clamp(80px, min(22vh, 14vw), 200px)', maxWidth: '86%', flexShrink: 1, minHeight: 0 }} />
        )}
        <div className="text-center" style={{ maxWidth: '100%' }}>
          <div className="flex items-center justify-center gap-2" style={{ maxWidth: '100%' }}>
            <div className="font-black leading-tight min-w-0" style={{ color: textClr, fontSize: p ? 'clamp(1.5rem, 7vw, 4rem)' : 'clamp(1rem, 10cqw, 7rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team?.name}</div>
            {STRENGTH_RANKS[code] && (
              <span className="font-bold rounded px-2 py-0.5 flex-shrink-0" style={{ fontSize: p ? '0.75rem' : '1.1rem', background: dark ? 'rgba(74,222,128,0.15)' : 'rgba(0,0,0,0.06)', color: dark ? '#4ade80' : '#6b7280' }}>#{STRENGTH_RANKS[code]}</span>
            )}
          </div>
          <div className={`flex items-center justify-center ${p ? 'gap-2 mt-2' : 'gap-4 mt-5'}`}>
            {side === 'home' && <JerseyIcon color={kit ?? '#ffffff'} dark={dark} size={p ? 24 : 52} />}
            <span className="font-bold rounded" style={{ fontSize: p ? '1.1rem' : '2.6rem', padding: p ? '2px 8px' : '8px 16px', color: dark ? '#10b981' : '#16a34a', boxShadow: `0 0 0 ${p ? 1 : 2}px rgba(128,128,128,0.4)`, background: altKit ?? kit ?? '#ffffff' }}>
              {code}
            </span>
            {side === 'away' && <JerseyIcon color={kit ?? '#ffffff'} dark={dark} size={p ? 24 : 52} />}
          </div>
          <StrengthStars strength={STRENGTHS[code] ?? 50} className={p ? 'mt-1' : 'mt-3'} style={{ fontSize: p ? '1.1rem' : '3rem' }} />
          {(yellows > 0 || reds > 0) && (
            <div className={`flex justify-center ${p ? 'mt-1' : 'mt-4'}`}>
              <CardIcons yellows={yellows} reds={reds} compact scale={p ? 1 : 2} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={overlayRef} className="fixed inset-0 z-40 flex flex-col overflow-hidden" style={{ background: bg }}>
      {/* Header */}
      <div className="flex items-center px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${borderClr}` }}>
        <div className="flex-1">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-3xl font-thin" style={{ color: subClr }}>×</button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black uppercase tracking-widest" style={{ color: liveClr }}>● LIVE</span>
          <span className={`font-black${anyGoalAnim ? '' : ' animate-pulse'}`} style={{ color: liveClr, fontSize: p ? '1.1rem' : '1.5rem' }}>
            {anyGoalAnim ? '⚽ GOAL!' : (score?.detail || '—')}
          </span>
          {(venueCity || badge) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {badge && <span className="text-xs font-bold rounded" style={{ padding: '1px 5px', border: dark ? '1.5px solid rgba(74,222,128,0.4)' : '1.5px solid #9ca3af', background: dark ? 'rgba(74,222,128,0.08)' : 'transparent', color: dark ? '#4ade80' : subClr }}>{badge ? (matchType === 'group' ? `GROUP ${badge}` : badge) : null}</span>}
              {venueCity && <span className="text-xs" style={{ color: subClr }}>📍 {venueCity}</span>}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: subClr }}>{score?.broadcast?.slice(0, 2).join(' · ') || ''}</span>
            <button
              onClick={() => setDark(d => !d)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-xl transition-colors"
              style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: dark ? '#fbbf24' : '#6b7280' }}
              title="Toggle dark mode"
            >{dark ? '☀️' : '🌙'}</button>
          </div>
          {(() => {
            const parsedOdds = parseOdds(score?.oddsDetail);
            if (!parsedOdds) return null;
            return (
              <span className="text-xs" style={{ color: subClr }}>
                {parsedOdds && (() => {
                  const isHome = parsedOdds.team === homeCode;
                  const pillBg = isHome ? (score?.homeAltKit ?? score?.homeKit ?? '#6b7280') : (score?.awayAltKit ?? score?.awayKit ?? '#6b7280');
                  return <>⚖️ <span className="font-bold rounded" style={{ fontSize: '0.7rem', padding: '1px 5px', background: pillBg, color: dark ? '#10b981' : '#16a34a', border: dark ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid #9ca3af' }}>{parsedOdds.team}</span> {parsedOdds.pct}%</>;
                })()}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Main: portrait = column, landscape = row */}
      <div className="flex-1 flex portrait:flex-col landscape:flex-row overflow-hidden min-h-0">
        {teamBlock(home, homeCode, score?.homeKit, score?.homeAltKit, homeGoals, homeYellows, homeReds, 'home')}

        {/* Score + stats center column */}
        <div className={`flex flex-col items-center justify-center flex-shrink-0 ${p ? 'gap-3 py-3 px-4' : 'gap-4 py-4 px-8'}`}
          style={{ borderLeft: `1px solid ${borderClr}`, borderRight: `1px solid ${borderClr}` }}>
          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            <div className={`flex items-center ${p ? 'gap-4' : 'gap-6'}`}>
              <span key={goalEvents[`${matchKey}-home`] || 'fsh'} className="font-black tabular-nums"
                style={{ color: liveClr, fontSize: p ? 'clamp(3.5rem, 15vw, 6rem)' : 'clamp(4rem, min(18vw, 20vh), 13rem)', lineHeight: 1, ...(homeGoalAnim ? { animation: 'scorePop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' } : {}) }}>
                {displayHomeScore}
              </span>
              <span className="font-thin opacity-20" style={{ color: textClr, fontSize: p ? 'clamp(2rem, 8vw, 4rem)' : 'clamp(2rem, min(10vw, 10vh), 9rem)' }}>—</span>
              <span key={goalEvents[`${matchKey}-away`] || 'fsa'} className="font-black tabular-nums"
                style={{ color: liveClr, fontSize: p ? 'clamp(3.5rem, 15vw, 6rem)' : 'clamp(4rem, min(18vw, 20vh), 13rem)', lineHeight: 1, ...(awayGoalAnim ? { animation: 'scorePop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' } : {}) }}>
                {displayAwayScore}
              </span>
            </div>
            {varActiveBadges.has(matchKey) && Date.now() < varActiveBadges.get(matchKey) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded font-black animate-pulse"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.6)', color: '#ef4444', fontSize: p ? '0.85rem' : '1.1rem', letterSpacing: '0.08em' }}>
                📺 VAR
              </span>
            )}
            {(homeGoals.length > 0 || awayGoals.length > 0) && (
              <div className="flex gap-4 justify-center" style={{ fontSize: p ? '0.85rem' : '1.3rem', color: subClr }}>
                <div className="text-right space-y-0.5">
                  {(p ? homeGoals.slice(-3) : homeGoals).map((g, i) => <div key={i}>⚽ {fmtGoal(g)}</div>)}
                </div>
                {homeGoals.length > 0 && awayGoals.length > 0 && (
                  <div style={{ borderLeft: `1px solid ${borderClr}` }} />
                )}
                <div className="text-left space-y-0.5">
                  {(p ? awayGoals.slice(-3) : awayGoals).map((g, i) => <div key={i}>{fmtGoal(g)} ⚽</div>)}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          {st && (
            <div style={{ width: p ? 'clamp(220px, 88vw, 340px)' : 'clamp(300px, 36vw, 520px)' }} className={p ? 'space-y-2' : 'space-y-4'}>
              <div className="flex justify-between" style={{ color: subClr, fontSize: p ? '1.1rem' : '2.2rem' }}>
                <span>
                  <span style={bumpStyle('home-shots')}>{st.home.shots}</span>{' '}
                  <span style={{ position: 'relative', display: 'inline-block' }}>👟{shotIconBumps?.has(`${matchKey}-home-shots`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: p ? '1.5rem' : '3rem', animation: 'warnPopHome 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>👟</span>}</span>{' '}
                  <span style={bumpStyle('home-sog')}>{st.home.sog}</span>🎯
                </span>
                <span className="self-center" style={{ color: subClr, fontSize: p ? '1rem' : '2rem' }}>shots</span>
                <span>
                  <span style={bumpStyle('away-shots')}>{st.away.shots}</span>{' '}
                  <span style={{ position: 'relative', display: 'inline-block' }}>👟{shotIconBumps?.has(`${matchKey}-away-shots`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: p ? '1.5rem' : '3rem', animation: 'warnPopAway 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>👟</span>}</span>{' '}
                  <span style={bumpStyle('away-sog')}>{st.away.sog}</span>🎯
                </span>
              </div>
              <div className="relative">
                {possStatBumps?.has(`${matchKey}-home-poss`) && home?.iso2 && (
                  <span className="absolute pointer-events-none" style={{ left: 0, bottom: 0, zIndex: 30, animation: 'possHomeFlagFly 2.8s ease-out forwards' }}>
                    <img src={`https://flagcdn.com/w40/${home.iso2}.png`} alt="" className="rounded" style={{ height: p ? '3rem' : '6rem', width: 'auto' }} />
                  </span>
                )}
                {possStatBumps?.has(`${matchKey}-away-poss`) && away?.iso2 && (
                  <span className="absolute pointer-events-none" style={{ right: 0, bottom: 0, zIndex: 30, animation: 'possAwayFlagFly 2.8s ease-out forwards' }}>
                    <img src={`https://flagcdn.com/w40/${away.iso2}.png`} alt="" className="rounded" style={{ height: p ? '3rem' : '6rem', width: 'auto' }} />
                  </span>
                )}
                <div className={`rounded-full ${possStatBumps?.has(`${matchKey}-home-poss`) || possStatBumps?.has(`${matchKey}-away-poss`) ? '' : 'overflow-hidden'}`}
                  style={{ height: p ? '10px' : '24px', background: score?.awayKit ?? (dark ? 'rgba(6,78,59,0.5)' : '#e5e7eb') }}>
                  <div className="h-full rounded-l-full" style={{ width: `${st.home.poss}%`, transition: 'width 1.2s ease-out', background: score?.homeKit ?? (dark ? 'rgba(74,222,128,0.6)' : 'rgba(34,197,94,0.6)') }} />
                </div>
                <div className="flex justify-between mt-1" style={{ color: subClr, fontSize: p ? '1rem' : '2rem' }}>
                  <span style={possStatBumps?.has(`${matchKey}-home-poss`) ? { display: 'inline-block', animation: 'statBumpGlow 0.9s ease-out' } : undefined}>{st.home.poss}%</span>
                  <span>poss</span>
                  <span style={possStatBumps?.has(`${matchKey}-away-poss`) ? { display: 'inline-block', animation: 'statBumpGlow 0.9s ease-out' } : undefined}>{st.away.poss}%</span>
                </div>
              </div>
              {(st.home.corners != null || st.home.fouls != null) && (
                <div className="flex justify-between" style={{ color: subClr, fontSize: p ? '1.1rem' : '2.2rem' }}>
                  <span>
                    <span style={cfBump('home-corners')}>{st.home.corners ?? 0}</span>{' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>⛳{cornerBumps.has(`${matchKey}-home`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '24px', animation: 'warnPopHome 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⛳</span>}</span>
                    {' · '}
                    <span style={cfBump('home-fouls')}>{st.home.fouls ?? 0}</span>{' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>⚠️{foulBumps.has(`${matchKey}-home`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '24px', animation: 'warnPopHome 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⚠️</span>}</span>
                  </span>
                  <span className="text-right">
                    <span style={cfBump('away-corners')}>{st.away.corners ?? 0}</span>{' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>⛳{cornerBumps.has(`${matchKey}-away`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '24px', animation: 'warnPopAway 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⛳</span>}</span>
                    {' · '}
                    <span style={cfBump('away-fouls')}>{st.away.fouls ?? 0}</span>{' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>⚠️{foulBumps.has(`${matchKey}-away`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '24px', animation: 'warnPopAway 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⚠️</span>}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {teamBlock(away, awayCode, score?.awayKit, score?.awayAltKit, awayGoals, awayYellows, awayReds, 'away')}
      </div>

      {/* Overlays rendered inside fullscreen element so they're visible in native fullscreen */}
      {subOverlay && <SubOverlay {...subOverlay} onDismiss={onDismissSub} />}
      {varOverlay && <VAROverlay {...varOverlay} onDismiss={onDismissVar} />}
      {goalOverlay && <GoalOverlay {...goalOverlay} onDismiss={onDismissGoal} />}
      {statBumps.size > 0 && (
        <div key={shotBumpVersion} className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 10 }}>
          {shotInfo?.isOnTarget && (
            <span className="absolute pointer-events-none" style={{ top: '50%', left: 0, fontSize: '9rem', lineHeight: 1, animation: `${shotInfo?.side === 'away' ? 'kickedTargetScreenMoveRTL' : 'kickedTargetScreenMoveLTR'} 3s ease-out forwards` }}>🎯</span>
          )}
          <span className="absolute pointer-events-none" style={{ top: '50%', left: 0, fontSize: '7rem', lineHeight: 1, animation: `${shotInfo?.side === 'away' ? 'shotKickScreenRTL' : 'shotKickScreen'} 3s ease-out forwards` }}>👟</span>
          <span className="absolute pointer-events-none" style={{ top: '50%', left: 0, fontSize: '9rem', lineHeight: 1, animation: `${shotInfo?.side === 'away' ? 'kickedBallScreenMoveRTL' : 'kickedBallScreenMove'} 3s ease-out forwards` }}>
            <span style={{ display: 'inline-block', animation: `${shotInfo?.side === 'away' ? 'ballSpinRTL' : 'ballSpinLTR'} 3s ease-out forwards` }}>⚽</span>
          </span>
          {shotInfo && (
            <div className="absolute left-0 right-0 text-center font-black text-white pointer-events-none"
              style={{ top: 'calc(50% + 6rem)', lineHeight: 1.4, textShadow: '0 0 24px rgba(34,197,94,0.9), 0 2px 8px rgba(0,0,0,0.8)', animation: 'shotLabelPop 3s ease-out forwards' }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {shotInfo.iso2 && <img src={`https://flagcdn.com/w40/${shotInfo.iso2}.png`} alt="" className="h-6 w-auto rounded" />}
                <span style={{ fontSize: '2rem' }}>{shotInfo.name}</span>
                {shotInfo.iso2 && <img src={`https://flagcdn.com/w40/${shotInfo.iso2}.png`} alt="" className="h-6 w-auto rounded" />}
              </div>
              <div style={{ fontSize: '1.6rem' }}>Shots: {shotInfo.shots} · on target: {shotInfo.sog}{shotInfo.isOnTarget ? ' 🎯' : ''}</div>
            </div>
          )}
        </div>
      )}
      {/* Card flash background */}
      {cardFlashBumps?.has(matchKey) && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6, animation: `cardFlash${cardFlashBumps.get(matchKey).type === 'red' ? 'Red' : 'Yellow'} 2.5s ease-out forwards` }} />
      )}
      {/* Flying card + flag animation */}
      {['home', 'away'].map(side => {
        const info = cardBumps?.get(`${matchKey}-${side}`);
        if (!info) return null;
        const cardColor = info.type === 'red' ? CARD_R : CARD_Y;
        const sc = p ? 4 : 8;
        return (
          <div key={side} className="absolute pointer-events-none flex flex-col items-center gap-2"
            style={{ bottom: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, animation: `${side === 'home' ? 'cardBumpFlyHome' : 'cardBumpFlyAway'} 3.2s ease-out forwards` }}>
            <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: `${10 * sc}px`, height: `${14 * sc}px`, background: cardColor, borderRadius: `${1.5 * sc}px`, overflow: 'hidden', paddingTop: `${sc}px` }}>
              <span style={{ fontSize: `${3.5 * sc}px`, fontWeight: 800, color: 'rgba(0,0,0,0.45)', lineHeight: 1, display: 'block', width: '100%', textAlign: 'center', transform: 'scaleX(1.3)', transformOrigin: 'center', padding: `0 ${sc}px`, boxSizing: 'border-box' }}>FIFA</span>
            </span>
            {info.iso2 && <img src={`https://flagcdn.com/w40/${info.iso2}.png`} alt="" style={{ width: `${7 * sc}px`, height: 'auto', borderRadius: `${Math.round(sc * 0.4)}px`, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function UpcomingMatches({ dark = false }) {
  const scores = useScores();
  const standings = useStandings();

  const [goalEvents, setGoalEvents] = useState({});
  const [statBumps, setStatBumps] = useState(new Set());     // shot/sog only → triggers full-screen kick overlay
  const [shotIconBumps, setShotIconBumps] = useState(new Set()); // shot only → in-card shoe bounce (fires first)
  const [cornerFoulBumps, setCornerFoulBumps] = useState(new Set()); // corners/fouls → in-card bump only
  const [foulBumps, setFoulBumps] = useState(new Set());   // fouls → warning pop animation
  const [cornerBumps, setCornerBumps] = useState(new Set()); // corners → corner flag pop animation
  const [possStatBumps, setPossStatBumps] = useState(new Set()); // poss only → animates the bar in-card
  const [minuteBumps, setMinuteBumps] = useState(new Set()); // minute clock ticks
  const [shotBumpVersion, setShotBumpVersion] = useState(0);
  const [shotInfo, setShotInfo] = useState(null);   // { iso2, name, shots, sog }
  const [shotMatchKey, setShotMatchKey] = useState('');
  const [shotCardVisible, setShotCardVisible] = useState(false);
  const [goalOverlay, setGoalOverlay] = useState(null);
  const [cardBumps, setCardBumps] = useState(new Map());      // key → { type, iso2 }
  const [cardFlashBumps, setCardFlashBumps] = useState(new Map()); // matchKey → { type }
  const [varOverlay, setVarOverlay] = useState(null);
  const [varActiveBadges, setVarActiveBadges] = useState(new Map()); // matchKey → expiresAt ms
  const [subOverlay, setSubOverlay] = useState(null);
  const [fullscreenMatch, setFullscreenMatch] = useState(null); // null or { matchKey, homeCode, awayCode }
  const prevScoresRef = useRef(null);
  const didAutoScrollRef = useRef(false);
  const firedGoalAnimsRef = useRef(new Set());
  const firedVARAnimsRef = useRef(new Set());
  const firedSubAnimsRef = useRef(new Set());

  // Reset prevScoresRef on return so stale diffs don't fire a burst of old animations
  useEffect(() => {
    const reset = () => { prevScoresRef.current = null; };
    const onVisibility = () => { if (document.visibilityState === 'visible') reset(); };
    const onPageShow = (e) => { if (e.persisted) reset(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', reset);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', reset);
    };
  }, []);

  // Once scores load, scroll to the first live card (200px above it)
  useEffect(() => {
    if (didAutoScrollRef.current) return;
    const liveEl = document.querySelector('[data-live-game="true"]');
    if (!liveEl) return;
    didAutoScrollRef.current = true;
    const y = liveEl.getBoundingClientRect().top + window.scrollY - 200;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, [scores]);

  useEffect(() => {
    if (prevScoresRef.current === null) { prevScoresRef.current = scores; return; }
    const prev = prevScoresRef.current;
    const newGoals = {};
    const newBumps = new Set();             // shot / sog → shoe+ball overlay
    const newPossBumps = new Set();         // possession → bar animation only
    const newCornerFoulBumps = new Set();   // corners / fouls → in-card bump only
    const newFoulBumps = new Set();         // fouls → warning pop overlay on card
    const newCornerBumps = new Set();       // corners → corner flag pop overlay on card
    const newMinuteBumps = new Set();  // minute clock tick
    const newCardBumps = new Map();    // card given → flag+card fly animation
    let overlayData = null;
    let newVAROverlay = null;
    let newSubOverlay = null;
    const newVARBadges = new Map();
    const expiredVARBadges = new Set();
    for (const [key, score] of Object.entries(scores)) {
      const p = prev[key];
      if (!p || score.state !== 'in') continue;
      // Only process canonical home-away keys from our tournament data.
      // scores.js stores both orderings (ECU-CUW and CUW-ECU); the old TEAMS[] check
      // failed whenever both teams are in TEAMS (e.g. all Group E teams).
      if (!CANONICAL_KEYS.has(key)) continue;
      const [hc, ...acParts] = key.split('-');
      const ac = acParts.join('-');
      const hgc = score.goals?.filter(g => g.side === 'home').length ?? 0;
      const phgc = p.goals?.filter(g => g.side === 'home').length ?? 0;
      const agc = score.goals?.filter(g => g.side === 'away').length ?? 0;
      const pagc = p.goals?.filter(g => g.side === 'away').length ?? 0;
      if ((hgc > phgc || score.homeScore > p.homeScore)) {
        const animKey = `${key}-home-${Math.max(hgc, score.homeScore ?? 0)}`;
        if (!firedGoalAnimsRef.current.has(animKey)) {
          firedGoalAnimsRef.current.add(animKey);
          newGoals[`${key}-home`] = Date.now();
          if (!overlayData) {
            const g = score.goals?.filter(g => g.side === 'home').at(-1);
            overlayData = { iso2: TEAMS[hc]?.iso2 ?? '', teamCode: hc, scorer: g?.name ?? '', minute: g?.min ?? '', matchKey: key, cardInView: isCardInView(key) };
          }
        }
      }
      if ((agc > pagc || score.awayScore > p.awayScore)) {
        const animKey = `${key}-away-${Math.max(agc, score.awayScore ?? 0)}`;
        if (!firedGoalAnimsRef.current.has(animKey)) {
          firedGoalAnimsRef.current.add(animKey);
          newGoals[`${key}-away`] = Date.now();
          if (!overlayData) {
            const g = score.goals?.filter(g => g.side === 'away').at(-1);
            overlayData = { iso2: TEAMS[ac]?.iso2 ?? '', teamCode: ac, scorer: g?.name ?? '', minute: g?.min ?? '', matchKey: key, cardInView: isCardInView(key) };
          }
        }
      }
      if (p.stats && score.stats) {
        if (score.stats.home.shots   !== p.stats.home.shots)   newBumps.add(`${key}-home-shots`);
        if (score.stats.home.sog     !== p.stats.home.sog)     newBumps.add(`${key}-home-sog`);
        if (score.stats.away.shots   !== p.stats.away.shots)   newBumps.add(`${key}-away-shots`);
        if (score.stats.away.sog     !== p.stats.away.sog)     newBumps.add(`${key}-away-sog`);
        if (score.stats.home.poss    > p.stats.home.poss)    newPossBumps.add(`${key}-home-poss`);
        if (score.stats.away.poss    > p.stats.away.poss)    newPossBumps.add(`${key}-away-poss`);
        if (score.stats.home.corners  !== p.stats.home.corners)  { newCornerFoulBumps.add(`${key}-home-corners`); newCornerBumps.add(`${key}-home`); }
        if (score.stats.away.corners  !== p.stats.away.corners)  { newCornerFoulBumps.add(`${key}-away-corners`); newCornerBumps.add(`${key}-away`); }
        if (score.stats.home.fouls    !== p.stats.home.fouls)  { newCornerFoulBumps.add(`${key}-home-fouls`); newFoulBumps.add(`${key}-home`); }
        if (score.stats.away.fouls    !== p.stats.away.fouls)  { newCornerFoulBumps.add(`${key}-away-fouls`); newFoulBumps.add(`${key}-away`); }
      }
      if (score.detail !== p.detail) newMinuteBumps.add(key);
      if (score.cards && p.cards) {
        const pHomeLen = p.cards.filter(c => c.side === 'home').length;
        const sHomeCards = score.cards.filter(c => c.side === 'home');
        const pAwayLen = p.cards.filter(c => c.side === 'away').length;
        const sAwayCards = score.cards.filter(c => c.side === 'away');
        if (sHomeCards.length > pHomeLen)
          newCardBumps.set(`${key}-home`, { type: sHomeCards.at(-1)?.type ?? 'yellow', iso2: TEAMS[hc]?.iso2 ?? '' });
        if (sAwayCards.length > pAwayLen)
          newCardBumps.set(`${key}-away`, { type: sAwayCards.at(-1)?.type ?? 'yellow', iso2: TEAMS[ac]?.iso2 ?? '' });
      }
      if (score.subs && p.subs) {
        const sHomeSubs = score.subs.filter(s => s.side === 'home');
        const pHomeSubs = p.subs.filter(s => s.side === 'home');
        const sAwaySubs = score.subs.filter(s => s.side === 'away');
        const pAwaySubs = p.subs.filter(s => s.side === 'away');
        // Sim cycle reset: count dropped means a new cycle started — clear stale keys so next increase re-fires
        if (sHomeSubs.length < pHomeSubs.length) {
          for (const k of [...firedSubAnimsRef.current]) { if (k.startsWith(`${key}-home-sub-`)) firedSubAnimsRef.current.delete(k); }
        }
        if (sAwaySubs.length < pAwaySubs.length) {
          for (const k of [...firedSubAnimsRef.current]) { if (k.startsWith(`${key}-away-sub-`)) firedSubAnimsRef.current.delete(k); }
        }
        if (sHomeSubs.length > pHomeSubs.length) {
          const sk = `${key}-home-sub-${sHomeSubs.length}`;
          if (!firedSubAnimsRef.current.has(sk)) {
            firedSubAnimsRef.current.add(sk);
            if (!newSubOverlay) {
              const sub = sHomeSubs.at(-1);
              newSubOverlay = { matchKey: key, side: 'home', kitColor: score.homeKit ?? '#555', iso2: TEAMS[hc]?.iso2 ?? '', teamName: TEAMS[hc]?.name ?? hc, on: sub?.on ?? '', off: sub?.off ?? '', min: sub?.min ?? '', cardInView: isCardInView(key) };
            }
          }
        }
        if (sAwaySubs.length > pAwaySubs.length) {
          const sk = `${key}-away-sub-${sAwaySubs.length}`;
          if (!firedSubAnimsRef.current.has(sk)) {
            firedSubAnimsRef.current.add(sk);
            if (!newSubOverlay) {
              const sub = sAwaySubs.at(-1);
              newSubOverlay = { matchKey: key, side: 'away', kitColor: score.awayKit ?? '#555', iso2: TEAMS[ac]?.iso2 ?? '', teamName: TEAMS[ac]?.name ?? ac, on: sub?.on ?? '', off: sub?.off ?? '', min: sub?.min ?? '', cardInView: isCardInView(key) };
            }
          }
        }
      }
      if (score.varReviews && p.varReviews) {
        const totalVAR = score.varReviews.length;
        const prevTotalVAR = p.varReviews.length;
        // Sim cycle reset: count dropped means a new cycle started — clear stale keys
        if (totalVAR < prevTotalVAR) {
          for (const k of [...firedVARAnimsRef.current]) { if (k.startsWith(`${key}-var-`)) firedVARAnimsRef.current.delete(k); }
        }
        // Fire on any total increase. Use last review's side for flag; 'unknown' means ESPN had no team attribution.
        if (totalVAR > prevTotalVAR) {
          const vk = `${key}-var-${totalVAR}`;
          if (!firedVARAnimsRef.current.has(vk)) {
            firedVARAnimsRef.current.add(vk);
            const lastReview = score.varReviews.at(-1);
            const varSide = lastReview?.side;
            const flagCode = varSide === 'home' ? hc : varSide === 'away' ? ac : '';
            if (!newVAROverlay) newVAROverlay = { matchKey: key, iso2: TEAMS[flagCode]?.iso2 ?? '', min: lastReview?.min ?? '', cardInView: isCardInView(key) };
            newVARBadges.set(key, Date.now() + 3 * 60 * 1000);
          }
        }
        // Clear badge if a goal or card landed after VAR was called (decision made), or if expired
        if (varActiveBadges.has(key)) {
          const expired = Date.now() > varActiveBadges.get(key);
          const goalAdded = score.goals.length > p.goals.length;
          const cardAdded = score.cards.length > p.cards.length;
          if (expired || goalAdded || cardAdded) expiredVARBadges.add(key);
        }
      }
    }
    prevScoresRef.current = scores;
    if (Object.keys(newGoals).length > 0) {
      setGoalEvents(g => ({ ...g, ...newGoals }));
      setTimeout(() => setGoalEvents(g => { const n = { ...g }; for (const k of Object.keys(newGoals)) delete n[k]; return n; }), 3500);
    }
    if (newBumps.size > 0) {
      let info = null;
      let bumpMatchKey = '';
      for (const bump of newBumps) {
        for (const [side, stat] of [['home','shots'],['away','shots'],['home','sog'],['away','sog']]) {
          const suffix = `-${side}-${stat}`;
          if (bump.endsWith(suffix)) {
            const mk = bump.slice(0, -suffix.length);
            const tc = side === 'home' ? mk.split('-')[0] : mk.slice(mk.indexOf('-') + 1);
            const sc = scores[mk];
            if (sc?.stats) {
              info = { iso2: TEAMS[tc]?.iso2 ?? '', name: TEAMS[tc]?.name ?? tc, shots: sc.stats[side].shots, sog: sc.stats[side].sog, kitColor: (side === 'home' ? sc.homeKit : sc.awayKit) ?? null, isOnTarget: newBumps.has(`${mk}-${side}-sog`), side };
              bumpMatchKey = mk;
            }
            break;
          }
        }
        if (info) break;
      }
      if (bumpMatchKey) {
        // Step 1: in-card shoe bounce immediately
        setShotIconBumps(b => new Set([...b, ...newBumps]));
        setTimeout(() => setShotIconBumps(b => { const n = new Set(b); for (const k of newBumps) n.delete(k); return n; }), 2200);
        // Step 2: full-screen kick animation after shoe bounce finishes
        setTimeout(() => {
          if (info) setShotInfo(info);
          setShotMatchKey(bumpMatchKey);
          setShotCardVisible(isCardInView(bumpMatchKey));
          setShotBumpVersion(v => v + 1);
          setStatBumps(b => new Set([...b, ...newBumps]));
          setTimeout(() => { setStatBumps(b => { const n = new Set(b); for (const k of newBumps) n.delete(k); return n; }); setShotInfo(null); setShotMatchKey(''); setShotCardVisible(false); }, 3000);
        }, 2200);
      }
    }
    if (newPossBumps.size > 0) {
      setPossStatBumps(b => new Set([...b, ...newPossBumps]));
      setTimeout(() => setPossStatBumps(b => { const n = new Set(b); for (const k of newPossBumps) n.delete(k); return n; }), 2800);
    }
    if (newCornerFoulBumps.size > 0) {
      setCornerFoulBumps(b => new Set([...b, ...newCornerFoulBumps]));
      setTimeout(() => setCornerFoulBumps(b => { const n = new Set(b); for (const k of newCornerFoulBumps) n.delete(k); return n; }), 1200);
    }
    if (newFoulBumps.size > 0) {
      setFoulBumps(b => new Set([...b, ...newFoulBumps]));
      setTimeout(() => setFoulBumps(b => { const n = new Set(b); for (const k of newFoulBumps) n.delete(k); return n; }), 2200);
    }
    if (newCornerBumps.size > 0) {
      setCornerBumps(b => new Set([...b, ...newCornerBumps]));
      setTimeout(() => setCornerBumps(b => { const n = new Set(b); for (const k of newCornerBumps) n.delete(k); return n; }), 2200);
    }
    if (newMinuteBumps.size > 0) {
      setMinuteBumps(b => new Set([...b, ...newMinuteBumps]));
      setTimeout(() => setMinuteBumps(b => { const n = new Set(b); for (const k of newMinuteBumps) n.delete(k); return n; }), 800);
    }
    if (overlayData) {
      setTimeout(() => {
        setGoalOverlay(overlayData);
        setTimeout(() => setGoalOverlay(null), 6500);
      }, 750);
    }
    if (newCardBumps.size > 0) {
      // Build per-match flash map (deduplicated by matchKey, uses first card type)
      const flashMap = new Map();
      for (const [k, v] of newCardBumps) {
        const mk = k.slice(0, -5); // strip '-home' or '-away'
        if (!flashMap.has(mk)) flashMap.set(mk, { type: v.type });
      }
      // Step 1: flash the card border immediately
      setCardFlashBumps(b => new Map([...b, ...flashMap]));
      setTimeout(() => setCardFlashBumps(b => { const n = new Map(b); for (const k of flashMap.keys()) n.delete(k); return n; }), 2500);
      // Step 2: card fly animation after flash peaks
      setTimeout(() => {
        setCardBumps(b => new Map([...b, ...newCardBumps]));
        setTimeout(() => setCardBumps(b => { const n = new Map(b); for (const k of newCardBumps.keys()) n.delete(k); return n; }), 3200);
      }, 500);
    }
    if (newVAROverlay) {
      setTimeout(() => {
        setVarOverlay(newVAROverlay);
        setTimeout(() => setVarOverlay(null), 4500);
      }, 300);
    }
    if (newSubOverlay) {
      setTimeout(() => {
        setSubOverlay(newSubOverlay);
        setTimeout(() => setSubOverlay(null), 4000);
      }, 300);
    }
    if (newVARBadges.size > 0 || expiredVARBadges.size > 0) {
      setVarActiveBadges(b => {
        const n = new Map(b);
        for (const [k, v] of newVARBadges) n.set(k, v);
        for (const k of expiredVARBadges) n.delete(k);
        return n;
      });
    }
  }, [scores]);

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const todayStr = localDateKey(now);
  const yesterdayStr = localDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const allRelevant = ALL_MATCHES
    .map(m => ({ ...m, dt: new Date(`${m.date}T${m.time}:00-04:00`) }))
    .filter(m => {
      const dk = localDateKey(m.dt);
      // always show yesterday and all of today (including already-kicked-off matches)
      if (dk === yesterdayStr || dk === todayStr) return true;
      return m.dt >= now && m.dt <= windowEnd;
    });

  if (allRelevant.length === 0) return null;

  const anyLiveGames = Object.values(scores).some(s => s.state === 'in');
  const nextUpcomingMatch = allRelevant.find(m => m.dt > now && !scores[`${m.home}-${m.away}`]?.completed);
  const nextUpcomingKey = nextUpcomingMatch ? `${nextUpcomingMatch.home}-${nextUpcomingMatch.away}` : null;

  const byDate = {};
  for (const m of allRelevant) {
    const key = localDateKey(m.dt);
    (byDate[key] ??= { label: localDateLabel(m.dt), matches: [] }).matches.push(m);
  }

  // Theme tokens
  const t = dark ? {
    section:     'border-emerald-900/30',
    title:       'text-emerald-100',
    subtitle:    'text-emerald-700',
    dateToday:   'text-grass-400 border-emerald-700/50',
    dateOther:   'text-emerald-800 border-emerald-900/30',
    badge:       'text-emerald-600',
    teamName:    'text-emerald-200',
    tbd:         'text-emerald-700',
    time:        'text-grass-400',
    venueName:   'text-emerald-700',
    venueCity:   'text-emerald-800',
    row:         'border-emerald-900/40 hover:border-emerald-700/60 hover:bg-emerald-900/20',
    arrow:       'text-emerald-800 group-hover/row:text-grass-400',
    rankPill:    'bg-emerald-900/60 text-emerald-500',
  } : {
    section:     'border-neutral-200',
    title:       'text-neutral-900',
    subtitle:    'text-neutral-400',
    dateToday:   'text-green-600 border-green-200',
    dateOther:   'text-neutral-400 border-neutral-100',
    badge:       'text-neutral-400',
    teamName:    'text-neutral-800',
    tbd:         'text-neutral-400',
    time:        'text-green-600',
    venueName:   'text-neutral-400',
    venueCity:   'text-neutral-300',
    row:         'border-neutral-100 hover:border-green-200 hover:bg-green-50',
    arrow:       'text-neutral-300 group-hover/row:text-green-400',
    rankPill:    'bg-neutral-200 text-neutral-500',
  };

  return (
    <>
    {fullscreenMatch && (
      <FullscreenMatchView
        matchKey={fullscreenMatch.matchKey}
        homeCode={fullscreenMatch.homeCode}
        awayCode={fullscreenMatch.awayCode}
        score={scores[fullscreenMatch.matchKey]}
        venue={fullscreenMatch.venue}
        badge={fullscreenMatch.badge}
        matchType={fullscreenMatch.matchType}
        dark={dark}
        onClose={() => setFullscreenMatch(null)}
        goalEvents={goalEvents}
        varActiveBadges={varActiveBadges}
        statBumps={statBumps}
        cornerFoulBumps={cornerFoulBumps}
        cornerBumps={cornerBumps}
        foulBumps={foulBumps}
        possStatBumps={possStatBumps}
        shotIconBumps={shotIconBumps}
        cardBumps={cardBumps}
        cardFlashBumps={cardFlashBumps}
        goalOverlay={goalOverlay}
        onDismissGoal={() => setGoalOverlay(null)}
        varOverlay={varOverlay}
        onDismissVar={() => setVarOverlay(null)}
        subOverlay={subOverlay}
        onDismissSub={() => setSubOverlay(null)}
        shotBumpVersion={shotBumpVersion}
        shotInfo={shotInfo}
        shotMatchKey={shotMatchKey}
      />
    )}
    {subOverlay && <SubOverlay {...subOverlay} onDismiss={() => setSubOverlay(null)} />}
    {varOverlay && <VAROverlay {...varOverlay} onDismiss={() => setVarOverlay(null)} />}
    {goalOverlay && <GoalOverlay {...goalOverlay} onDismiss={() => setGoalOverlay(null)} />}
    {statBumps.size > 0 && (
      <div key={shotBumpVersion} className="fixed inset-0 overflow-hidden cursor-pointer" style={{ zIndex: 45 }}
           onClick={() => document.getElementById(`match-${shotMatchKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
        {shotInfo?.isOnTarget && (
          <span className="absolute pointer-events-none" style={{ top: '50%', left: 0, fontSize: '9rem', lineHeight: 1, zIndex: 0, animation: `${shotInfo?.side === 'away' ? 'kickedTargetScreenMoveRTL' : 'kickedTargetScreenMoveLTR'} 3s ease-out forwards` }}>🎯</span>
        )}
        <span className="absolute pointer-events-none" style={{ top: '50%', left: 0, fontSize: '7rem', lineHeight: 1, zIndex: 1, animation: `${shotInfo?.side === 'away' ? 'shotKickScreenRTL' : 'shotKickScreen'} 3s ease-out forwards` }}>👟</span>
        <span className="absolute pointer-events-none" style={{ top: '50%', left: 0, fontSize: '9rem', lineHeight: 1, zIndex: 2, animation: `${shotInfo?.side === 'away' ? 'kickedBallScreenMoveRTL' : 'kickedBallScreenMove'} 3s ease-out forwards` }}>
          <span style={{ display: 'inline-block', animation: `${shotInfo?.side === 'away' ? 'ballSpinRTL' : 'ballSpinLTR'} 3s ease-out forwards` }}>⚽</span>
        </span>
        {shotInfo && (
          <div className="absolute left-0 right-0 text-center font-black text-white pointer-events-none"
            style={{ top: 'calc(50% + 6rem)', lineHeight: 1.4,
              textShadow: '0 0 24px rgba(34,197,94,0.9), 0 2px 8px rgba(0,0,0,0.8)',
              animation: 'shotLabelPop 3s ease-out forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              {shotInfo.iso2 && <img src={`https://flagcdn.com/w40/${shotInfo.iso2}.png`} alt="" className="h-6 w-auto rounded" />}
              <span style={{ fontSize: '2rem', ...(shotInfo.kitColor ? { color: shotInfo.kitColor, textShadow: dark ? `0 0 20px ${shotInfo.kitColor}cc, 0 0 3px rgba(34,197,94,0.8), 1px 1px 0 rgba(34,197,94,0.6), -1px -1px 0 rgba(34,197,94,0.6), 0 2px 12px rgba(0,0,0,0.9)` : `0 0 20px ${shotInfo.kitColor}cc, 0 0 2px rgba(100,100,100,0.6), 1px 1px 0 rgba(120,120,120,0.5), -1px -1px 0 rgba(120,120,120,0.5), 1px -1px 0 rgba(120,120,120,0.5), -1px 1px 0 rgba(120,120,120,0.5)` } : {}) }}>{shotInfo.name}</span>
              {shotInfo.iso2 && <img src={`https://flagcdn.com/w40/${shotInfo.iso2}.png`} alt="" className="h-6 w-auto rounded" />}
            </div>
            <div style={{ fontSize: '1.6rem' }}>Shots: {shotInfo.shots} · on target: {shotInfo.sog}{shotInfo.isOnTarget ? ' 🎯' : ''}</div>
            {!shotCardVisible && (
              <div className={`text-sm font-semibold animate-pulse mt-3 ${dark ? 'text-emerald-400' : 'text-emerald-500'}`}>
                Tap to view match →
              </div>
            )}
          </div>
        )}
      </div>
    )}
    <section id="upcoming-matches" className={`max-w-3xl mx-auto px-4 py-10 border-b ${t.section}`}>
      <h2 className={`text-xl font-bold mb-1 ${t.title}`}>Upcoming Matches</h2>
      <p className={`text-sm mb-6 ${t.subtitle}`}>
        Next {WINDOW_DAYS} days · Yesterday's results · Times in your local timezone · Tap a match to search on Google
      </p>

      <div className="space-y-6">
        {Object.entries(byDate).map(([dateKey, { label, matches }]) => {
          const isToday = dateKey === todayStr;
          const isPast = dateKey < todayStr;
          const dateLabel = dateKey === yesterdayStr
            ? `Yesterday · ${label}`
            : isToday ? `Today · ${label}` : label;
          return (
            <div key={dateKey}>
              <p id={isToday ? 'today-games' : undefined} className={`text-xs font-semibold uppercase tracking-wider mb-2 pb-1.5 border-b ${
                isPast
                  ? (dark ? 'text-emerald-900 border-emerald-900/20' : 'text-neutral-300 border-neutral-100')
                  : isToday ? t.dateToday : t.dateOther
              }`}>
                {dateLabel}
              </p>
              <div className="space-y-1.5">
                {matches.map(({ dt: _dt, ...m }) => {
                  const venue = VENUES[m.venue];
                  const isGroup = m.type === 'group';
                  const homeCode = isGroup ? m.home : resolveSlotFromStandings(m.slot1, standings);
                  const awayCode = isGroup ? m.away : resolveSlotFromStandings(m.slot2, standings);
                  const home = homeCode ? TEAMS[homeCode] : null;
                  const away = awayCode ? TEAMS[awayCode] : null;
                  const searchUrl = (home && away)
                    ? `https://www.google.com/search?q=${encodeURIComponent(`${home.name} vs ${away.name} 2026 FIFA World Cup`)}`
                    : null;

                  const matchKey = isGroup ? `${m.home}-${m.away}` : (homeCode && awayCode ? `${homeCode}-${awayCode}` : m.id);
                  const score = scores[matchKey] ?? null;
                  const parsedOdds = score ? parseOdds(score.oddsDetail) : null;
                  const isLive = score?.state === 'in';
                  // ESPN sometimes keeps state='in' past the final whistle; treat as done after 130 min
                  const matchStart = new Date(`${m.date}T${m.time}:00-04:00`);
                  const isFinal = score?.completed || (!score?.simulated && isLive && (now - matchStart) > 130 * 60 * 1000);
                  const homeWon = isFinal && (score?.homeScore ?? 0) > (score?.awayScore ?? 0);
                  const awayWon = isFinal && (score?.awayScore ?? 0) > (score?.homeScore ?? 0);
                  const homeGoals = score?.goals?.filter(g => g.side === 'home') ?? [];
                  const awayGoals = score?.goals?.filter(g => g.side === 'away') ?? [];
                  const homeCards = score?.cards?.filter(c => c.side === 'home') ?? [];
                  const awayCards = score?.cards?.filter(c => c.side === 'away') ?? [];
                  const homeYellows = homeCards.filter(c => c.type === 'yellow').length;
                  const homeReds    = homeCards.filter(c => c.type === 'red').length;
                  const awayYellows = awayCards.filter(c => c.type === 'yellow').length;
                  const awayReds    = awayCards.filter(c => c.type === 'red').length;
                  const compactCards = homeCards.length > 5 || awayCards.length > 5;
                  const displayHomeScore = isLive ? Math.max(score?.homeScore ?? 0, homeGoals.length) : (score?.homeScore ?? '-');
                  const displayAwayScore = isLive ? Math.max(score?.awayScore ?? 0, awayGoals.length) : (score?.awayScore ?? '-');
                  const fmtGoal = g => `${g.name} ${g.min}${g.og ? ' (OG)' : g.pk ? ' (P)' : ''}`;
                  const showScorers = isLive || isFinal;
                  const effectiveStats = score?.stats ?? null;
                  const showStats   = (isLive || isFinal) && effectiveStats != null;
                  const fmtStandings = s => s?.gp > 0
                    ? `${s.w}W ${s.d}D ${s.l}L · ${s.pts}pts · GD${s.gd > 0 ? '+' : ''}${s.gd}`
                    : null;
                  const homeStandStr = isGroup ? fmtStandings(standings[homeCode]) : null;
                  const awayStandStr = isGroup ? fmtStandings(standings[awayCode]) : null;

                  const homeGoalAnim = !!goalEvents[`${matchKey}-home`];
                  const awayGoalAnim = !!goalEvents[`${matchKey}-away`];
                  const anyGoalAnim = homeGoalAnim || awayGoalAnim;
                  const shotBumpActive = (
                    statBumps.has(`${matchKey}-home-shots`) || statBumps.has(`${matchKey}-away-shots`) ||
                    statBumps.has(`${matchKey}-home-sog`)   || statBumps.has(`${matchKey}-away-sog`)
                  );

                  const inner = (
                    <div className="flex flex-col flex-1 min-w-0">
                      {/* Row 1: home team | score/time | away team */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {home ? (
                            <>
                              {STRENGTH_RANKS[homeCode] && <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${t.rankPill}`}>#{STRENGTH_RANKS[homeCode]}</span>}
                              <img src={`https://flagcdn.com/${home.iso2}.svg`} alt={home.name} className={`w-5 h-3.5 object-cover rounded-sm flex-shrink-0 ring-1 ${dark ? 'ring-white/20' : 'ring-black/10'}`} />
                              <span className={`text-sm truncate ${t.teamName} ${homeWon ? 'font-bold' : awayWon ? 'opacity-50' : 'font-medium'}`}>{home.name}</span>
                            </>
                          ) : (
                            <span className={`text-sm italic ${t.tbd}`}>{m.slot1 ?? 'TBD'}</span>
                          )}
                        </div>

                        <div className="flex-shrink-0 text-center w-20 relative">
                          {isLive ? (
                            <>
                              {homeGoalAnim && (<>
                                <span key={`${goalEvents[`${matchKey}-home`]}-a`} className="absolute pointer-events-none z-10 text-2xl leading-none animate-ball-from-left" style={{ top: '50%', left: '50%' }}>⚽</span>
                                <span key={`${goalEvents[`${matchKey}-home`]}-b`} className="absolute pointer-events-none z-10 text-base leading-none animate-ball-from-left-alt" style={{ top: '50%', left: '50%' }}>⚽</span>
                              </>)}
                              {awayGoalAnim && (<>
                                <span key={`${goalEvents[`${matchKey}-away`]}-a`} className="absolute pointer-events-none z-10 text-2xl leading-none animate-ball-from-right" style={{ top: '50%', left: '50%' }}>⚽</span>
                                <span key={`${goalEvents[`${matchKey}-away`]}-b`} className="absolute pointer-events-none z-10 text-base leading-none animate-ball-from-right-alt" style={{ top: '50%', left: '50%' }}>⚽</span>
                              </>)}

                              <span className={`text-sm font-bold tabular-nums ${dark ? 'text-grass-400' : 'text-green-600'}`}>
                                <span key={goalEvents[`${matchKey}-home`] || 'h'} style={homeGoalAnim ? { display: 'inline-block', animation: 'scorePop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' } : undefined}>{displayHomeScore}</span>
                                {' – '}
                                <span key={goalEvents[`${matchKey}-away`] || 'a'} style={awayGoalAnim ? { display: 'inline-block', animation: 'scorePop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' } : undefined}>{displayAwayScore}</span>
                              </span>
                              <span className={`block text-[10px] font-semibold ${anyGoalAnim ? '' : 'animate-pulse'} ${dark ? 'text-grass-500' : 'text-green-500'}`}>
                                {anyGoalAnim
                                  ? <span className="animate-goal-toast inline-block font-black">⚽ GOAL!</span>
                                  : <span key={score?.detail} style={minuteBumps.has(matchKey) ? { display: 'inline-block', animation: 'minuteBumpGrow 0.8s ease-out' } : undefined}>{score?.detail || 'LIVE'}</span>}
                              </span>
                              {!anyGoalAnim && varActiveBadges.has(matchKey) && Date.now() < varActiveBadges.get(matchKey) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-black animate-pulse mt-0.5" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.6)', color: '#ef4444', fontSize: '9px', letterSpacing: '0.08em' }}>📺 VAR</span>
                              )}
                            </>
                          ) : isFinal ? (
                            <>
                              <span className={`text-sm font-bold tabular-nums ${dark ? 'text-emerald-200' : 'text-neutral-700'}`}>
                                {score.homeScore} – {score.awayScore}
                              </span>
                              <span className={`block text-[10px] ${dark ? 'text-emerald-700' : 'text-neutral-400'}`}>FT</span>
                            </>
                          ) : (
                            <span className={`text-xs font-semibold whitespace-nowrap ${t.time}`}>
                              {formatMatchTime(m.date, m.time)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          {away ? (
                            <>
                              <span className={`text-sm truncate text-right ${t.teamName} ${awayWon ? 'font-bold' : homeWon ? 'opacity-50' : 'font-medium'}`}>{away.name}</span>
                              <img src={`https://flagcdn.com/${away.iso2}.svg`} alt={away.name} className={`w-5 h-3.5 object-cover rounded-sm flex-shrink-0 ring-1 ${dark ? 'ring-white/20' : 'ring-black/10'}`} />
                              {STRENGTH_RANKS[awayCode] && <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${t.rankPill}`}>#{STRENGTH_RANKS[awayCode]}</span>}
                            </>
                          ) : (
                            <span className={`text-sm italic ${t.tbd}`}>{m.slot2 ?? 'TBD'}</span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: HAI [stars] | stadium name | [stars] SCO */}
                      <div className="flex items-center gap-2 mt-0.5">
                        {isGroup ? (
                          <>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <JerseyIcon color={score?.homeKit ?? '#ffffff'} dark={dark} />
                              <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${dark ? 'text-emerald-500' : 'text-green-600'}`} style={{ background: score?.homeAltKit ?? score?.homeKit ?? '#ffffff', boxShadow: '0 0 0 1px rgba(128,128,128,0.4)' }}>{m.home}</span>
                              <StrengthStars strength={STRENGTHS[m.home] ?? 50} className="text-[10px]" />
                            </div>
                            <span className={`text-xs truncate text-center flex-1 min-w-0 ${t.venueName}`}>{venue.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <StrengthStars strength={STRENGTHS[m.away] ?? 50} className="text-[10px]" />
                              <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${dark ? 'text-emerald-500' : 'text-green-600'}`} style={{ background: score?.awayAltKit ?? score?.awayKit ?? '#ffffff', boxShadow: '0 0 0 1px rgba(128,128,128,0.4)' }}>{m.away}</span>
                              <JerseyIcon color={score?.awayKit ?? '#ffffff'} dark={dark} />
                            </div>
                          </>
                        ) : (homeCode || awayCode) ? (
                          <>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {homeCode && <><span className={`text-[10px] font-bold ${t.badge}`}>{m.slot1}</span><StrengthStars strength={STRENGTHS[homeCode] ?? 50} className="text-[10px]" /></>}
                            </div>
                            <span className={`text-xs truncate text-center flex-1 min-w-0 ${t.venueName}`}>{venue.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0 justify-end">
                              {awayCode && <><StrengthStars strength={STRENGTHS[awayCode] ?? 50} className="text-[10px]" /><span className={`text-[10px] font-bold ${t.badge}`}>{m.slot2}</span></>}
                            </div>
                          </>
                        ) : (
                          <span className={`text-xs ${t.venueName}`}>{venue.name}</span>
                        )}
                      </div>

                      {/* Row 3: odds | city + group badge | broadcast + ↗ */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {parsedOdds && (
                            <span className={`text-[10px] truncate ${t.badge}`}>⚖️ {(() => {
                              const isHome = parsedOdds.team === homeCode;
                              const pillBg = isHome ? (score?.homeAltKit ?? score?.homeKit ?? '#6b7280') : (score?.awayAltKit ?? score?.awayKit ?? '#6b7280');
                              return <span className="font-bold rounded" style={{ fontSize: '10px', padding: '2px 4px', background: pillBg, color: dark ? '#10b981' : '#16a34a', border: dark ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid #9ca3af', display: 'inline-block', lineHeight: 1 }}>{parsedOdds.team}</span>;
                            })()} {parsedOdds.pct}%</span>
                          )}
                        </div>
                        <div className="flex flex-col items-center flex-shrink-0">
                          <span className={`text-[10px] text-center ${t.venueName}`}>
                            {venue.city}{venue.country ? `, ${venue.country}` : ''}
                          </span>
                          {isGroup && <span className={`text-[10px] font-bold rounded ${t.badge}`} style={{ padding: '1px 3px 0 3px', border: dark ? '1.5px solid rgba(74,222,128,0.4)' : '1.5px solid #9ca3af', background: dark ? 'rgba(74,222,128,0.08)' : 'transparent', color: dark ? '#4ade80' : undefined, marginTop: '2px' }}>{`GROUP ${m.badge}`}</span>}
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                          {score?.broadcast?.length > 0 && (
                            <span className={`text-[10px] truncate ${t.badge}`}>
                              <span style={{ position: 'relative', top: '-1px' }}>📺</span>{' '}
                              {score.broadcast.slice(0, 2).map((ch, i) => (
                                <span key={ch}>
                                  {i > 0 && ' · '}
                                  {ch}
                                  {PAID_CHANNELS.has(ch) && <span className="text-amber-400 font-bold" style={{ fontSize: '10px', position: 'relative', top: '0px', marginLeft: '1px' }}>$</span>}
                                </span>
                              ))}
                            </span>
                          )}
                          {searchUrl && (
                            <span className={`text-xs flex-shrink-0 transition-colors ${t.arrow}`}>↗</span>
                          )}
                        </div>
                      </div>

                      {/* Row 3.5: group standings per team */}
                      {(homeStandStr || awayStandStr) && (
                        <div className={`flex items-center justify-between gap-2 mt-0.5 text-[10px] ${dark ? 'text-emerald-700' : 'text-neutral-400'}`}>
                          <span>{homeStandStr ?? ''}</span>
                          <span className="text-right">{awayStandStr ?? ''}</span>
                        </div>
                      )}

                      {/* Rows 4+5: goal scorers + possession/shots (live and finished games) */}
                      {(showScorers || showStats) && (
                        <div className={`mt-1.5 pt-1.5 border-t space-y-1 ${dark ? 'border-emerald-900/30' : 'border-neutral-100'}`}>
                          {showScorers && (
                            <div className="flex items-start gap-2">
                              <div className={`flex-1 min-w-0 text-[10px] leading-relaxed ${dark ? 'text-emerald-500' : 'text-neutral-500'}`}>
                                {homeGoals.map(fmtGoal).join(' · ')}
                              </div>
                              <div className="flex-shrink-0 flex flex-col items-center text-[10px] tabular-nums leading-snug" style={{ position: 'relative' }}>
                                <span>{homeGoals.length ? '⚽'.repeat(homeGoals.length) : '0'} | {awayGoals.length ? '⚽'.repeat(awayGoals.length) : '0'}</span>
                                {(homeCards.length > 0 || awayCards.length > 0) && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <CardIcons yellows={homeYellows} reds={homeReds} compact={compactCards} />
                                    <span>|</span>
                                    <CardIcons yellows={awayYellows} reds={awayReds} compact={compactCards} />
                                  </span>
                                )}
                                {['home', 'away'].map(side => {
                                  const info = cardBumps.get(`${matchKey}-${side}`);
                                  if (!info) return null;
                                  const cardColor = info.type === 'red' ? CARD_R : CARD_Y;
                                  return (
                                    <div key={side} className="absolute pointer-events-none flex flex-col items-center gap-1" style={{ bottom: 0, left: '50%', marginLeft: '-12px', zIndex: 20, animation: `${side === 'home' ? 'cardBumpFlyHome' : 'cardBumpFlyAway'} 3.2s ease-out forwards` }}>
                                      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '42px', height: '60px', background: cardColor, borderRadius: '4px', overflow: 'hidden', paddingTop: '3px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(0,0,0,0.45)', lineHeight: 1, display: 'block', width: '100%', textAlign: 'center', transform: 'scaleX(1.3)', transformOrigin: 'center', padding: '0 3px', boxSizing: 'border-box' }}>FIFA</span>
                                      </span>
                                      {info.iso2 && <img src={`https://flagcdn.com/w40/${info.iso2}.png`} alt="" style={{ width: '29px', height: 'auto', borderRadius: '3px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }} />}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={`flex-1 min-w-0 text-[10px] text-right leading-relaxed ${dark ? 'text-emerald-500' : 'text-neutral-500'}`}>
                                {awayGoals.map(fmtGoal).join(' · ')}
                              </div>
                            </div>
                          )}
                          {showStats && (() => {
                            const possChanging = possStatBumps.has(`${matchKey}-home-poss`) || possStatBumps.has(`${matchKey}-away-poss`);
                            const bumpStyle = key => statBumps.has(`${matchKey}-${key}`) ? { display: 'inline-block', animation: 'statBumpGlow 0.65s ease-out' } : undefined;
                            const cfBump = key => cornerFoulBumps.has(`${matchKey}-${key}`) ? { display: 'inline-block', animation: 'statBumpGlow 0.65s ease-out' } : undefined;
                            return (
                            <>
                            <div className="flex items-center gap-2">
                              <span className={`flex-1 text-[10px] ${dark ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                <span style={bumpStyle('home-shots')}>{effectiveStats.home.shots}</span>{' shots '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>👟{shotIconBumps.has(`${matchKey}-home-shots`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '20px', animation: 'warnPopHome 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>👟</span>}</span>
                                {'· '}<span style={bumpStyle('home-sog')}>{effectiveStats.home.sog}</span>🎯
                              </span>
                              <div className="flex-shrink-0 w-20" style={{ position: 'relative' }}>
                                {possStatBumps.has(`${matchKey}-home-poss`) && home?.iso2 && (
                                  <div className="absolute pointer-events-none flex flex-col items-start"
                                    style={{ left: '0', bottom: '0', zIndex: 30, animation: 'possHomeFlagFly 2.8s ease-out forwards' }}>
                                    <img src={`https://flagcdn.com/w160/${home.iso2}.png`} alt=""
                                      style={{ width: '200px', height: 'auto', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.45)', display: 'block' }} />
                                    <span style={{ fontSize: '2rem', lineHeight: 1, marginTop: '2px', alignSelf: 'center',
                                      color: score?.homeKit ?? '#22c55e',
                                      textShadow: dark ? '0 0 12px rgba(34,197,94,0.9), 0 0 4px rgba(34,197,94,0.5)' : '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>→</span>
                                  </div>
                                )}
                                {possStatBumps.has(`${matchKey}-away-poss`) && away?.iso2 && (
                                  <div className="absolute pointer-events-none flex flex-col items-end"
                                    style={{ right: '0', bottom: '0', zIndex: 30, animation: 'possAwayFlagFly 2.8s ease-out forwards' }}>
                                    <img src={`https://flagcdn.com/w160/${away.iso2}.png`} alt=""
                                      style={{ width: '200px', height: 'auto', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.45)', display: 'block' }} />
                                    <span style={{ fontSize: '2rem', lineHeight: 1, marginTop: '2px', alignSelf: 'center',
                                      color: score?.awayKit ?? '#22c55e',
                                      textShadow: dark ? '0 0 12px rgba(34,197,94,0.9), 0 0 4px rgba(34,197,94,0.5)' : '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>←</span>
                                  </div>
                                )}
                                <div
                                  className={`rounded-full ${possChanging ? '' : 'overflow-hidden'}`}
                                  style={{
                                    height: '4px',
                                    background: score?.awayKit ?? (dark ? 'rgba(6,78,59,0.5)' : '#e5e7eb'),
                                    boxShadow: dark ? '0 0 0 1px rgba(34,197,94,0.25)' : '0 0 0 1px rgba(0,0,0,0.15)',
                                    ...(possChanging ? { animation: 'possBarGrow 1.0s ease-out', transformOrigin: 'bottom' } : {}),
                                  }}
                                >
                                  <div
                                    className="h-full rounded-l-full"
                                    style={{ width: `${effectiveStats.home.poss}%`, transition: 'width 1.2s ease-out', background: score?.homeKit ?? (dark ? 'rgba(74,222,128,0.6)' : 'rgba(34,197,94,0.6)') }}
                                  />
                                </div>
                                <div className={`flex justify-between text-[9px] mt-0.5 ${dark ? 'text-emerald-800' : 'text-neutral-400'}`}>
                                  <span style={possChanging ? { display: 'inline-block', animation: 'statBumpGlow 0.9s ease-out' } : undefined}>{effectiveStats.home.poss}%</span>
                                  <span>poss</span>
                                  <span style={possChanging ? { display: 'inline-block', animation: 'statBumpGlow 0.9s ease-out' } : undefined}>{effectiveStats.away.poss}%</span>
                                </div>
                              </div>
                              <span className={`flex-1 text-[10px] text-right ${dark ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                <span style={bumpStyle('away-shots')}>{effectiveStats.away.shots}</span>{' shots '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>👟{shotIconBumps.has(`${matchKey}-away-shots`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '20px', animation: 'warnPopAway 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>👟</span>}</span>
                                {'· '}<span style={bumpStyle('away-sog')}>{effectiveStats.away.sog}</span>🎯
                              </span>
                            </div>
                            {(effectiveStats.home.corners != null || effectiveStats.home.fouls != null) && (
                            <div className={`flex items-center justify-between text-[9px] mt-0.5 ${dark ? 'text-emerald-800' : 'text-neutral-400'}`}>
                              <span>
                                <span style={cfBump('home-corners')}>{effectiveStats.home.corners ?? 0}</span>{' '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>⛳{cornerBumps.has(`${matchKey}-home`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '18px', animation: 'warnPopHome 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⛳</span>}</span>{' · '}
                                <span style={cfBump('home-fouls')}>{effectiveStats.home.fouls ?? 0}</span>{' '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>⚠️{foulBumps.has(`${matchKey}-home`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '18px', animation: 'warnPopHome 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⚠️</span>}</span>
                              </span>
                              <span className="text-right">
                                <span style={cfBump('away-corners')}>{effectiveStats.away.corners ?? 0}</span>{' '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>⛳{cornerBumps.has(`${matchKey}-away`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '18px', animation: 'warnPopAway 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⛳</span>}</span>{' · '}
                                <span style={cfBump('away-fouls')}>{effectiveStats.away.fouls ?? 0}</span>{' '}
                                <span style={{ position: 'relative', display: 'inline-block' }}>⚠️{foulBumps.has(`${matchKey}-away`) && <span className="absolute pointer-events-none" style={{ top: 0, left: 0, fontSize: '18px', animation: 'warnPopAway 2.2s ease-out forwards', transformOrigin: 'center bottom' }}>⚠️</span>}</span>
                              </span>
                            </div>
                            )}
                            </>
                          );
                          })()}
                        </div>
                      )}
                    </div>
                  );

                  const isLiveActive = isLive && !isFinal;
                  const isNextUp = !anyLiveGames && matchKey === nextUpcomingKey;
                  const pastCls = dark
                    ? 'border-emerald-900/20 opacity-50 hover:opacity-100'
                    : 'border-neutral-100 opacity-50 hover:opacity-100';
                  const liveRowCls = dark
                    ? 'border-grass-600/50 bg-grass-500/5 animate-pulse-green'
                    : 'border-green-400 bg-green-50/50 animate-pulse-green';
                  const nextUpCls = dark
                    ? 'border-grass-500 bg-grass-500/5'
                    : 'border-green-500 bg-green-50/40';
                  const cls = `flex items-start sm:items-center gap-2 py-2 px-3 rounded-lg transition-all ${
                    isLiveActive ? `border ${liveRowCls}`
                    : isPast     ? `border ${pastCls}`
                    : isNextUp   ? `border-2 ${nextUpCls}`
                    :              `border ${t.row}`
                  }`;
                  const liveOverlay = isLiveActive ? (
                    <div className={`absolute inset-0 rounded-lg border-2 pointer-events-none ${dark ? 'border-grass-400' : 'border-green-400'}`} />
                  ) : null;
                  const cardFlashInfo = cardFlashBumps.get(matchKey);
                  const cardFlash = anyGoalAnim
                    ? <div className="absolute inset-0 rounded-lg pointer-events-none animate-goal-card-flash" />
                    : cardFlashInfo
                    ? <div key={`cf-${matchKey}`} className="absolute inset-0 rounded-lg pointer-events-none" style={{ animation: `cardFlash${cardFlashInfo.type === 'red' ? 'Red' : 'Yellow'} 2.5s ease-out forwards` }} />
                    : null;
                  const cardAttrs = {
                    ...(isLiveActive        ? { 'data-live-game':     'true' } : {}),
                    ...(isNextUp            ? { 'data-next-upcoming': 'true' } : {}),
                  };
                  const expandBtn = isToday ? (
                    <button
                      className="absolute top-1 right-1 z-10 p-1 transition-opacity"
                      style={{ color: isLiveActive ? (dark ? '#4ade80' : '#16a34a') : (dark ? '#6b7280' : '#9ca3af'), opacity: isLiveActive ? undefined : 0.5 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = isLiveActive ? '' : '0.5'}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); firedSubAnimsRef.current = new Set(); firedVARAnimsRef.current = new Set(); setFullscreenMatch({ matchKey, homeCode, awayCode, venue: m.venue, badge: m.badge, matchType: m.type }); }}
                      title="Full screen"
                    >
                      <span className="flex items-center gap-1">
                        {isLiveActive && <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: dark ? '#4ade80' : '#16a34a' }}>LIVE</span>}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9,3 3,3 3,9"/><line x1="3" y1="3" x2="10" y2="10"/>
                          <polyline points="15,3 21,3 21,9"/><line x1="21" y1="3" x2="14" y2="10"/>
                          <polyline points="9,21 3,21 3,15"/><line x1="3" y1="21" x2="10" y2="14"/>
                          <polyline points="15,21 21,21 21,15"/><line x1="21" y1="21" x2="14" y2="14"/>
                        </svg>
                      </span>
                    </button>
                  ) : null;
                  const livePadCls = isToday ? 'pt-4' : '';
                  return searchUrl ? (
                    <div key={m.id} id={`match-${matchKey}`} className="relative" {...cardAttrs}>
                      {!cardFlashInfo && liveOverlay}{cardFlash}{expandBtn}
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" className={`${cls} ${livePadCls} group/row`}>
                        {inner}
                      </a>
                    </div>
                  ) : (
                    <div key={m.id} id={`match-${matchKey}`} className="relative" {...cardAttrs}>
                      {!cardFlashInfo && liveOverlay}{cardFlash}{expandBtn}
                      <div className={`${cls} ${livePadCls}`}>
                        {inner}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
    </>
  );
}
