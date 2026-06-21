import { useState, useEffect, useRef, useMemo } from 'react';
import { TEAMS, GROUP_MATCHES, VENUES, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../data/tournamentData.js';
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

function localDateKey(dt) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(dt);
}

function localDateLabel(dt) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric',
  }).format(dt);
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

function JerseyIcon({ color, dark }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0, display: 'block', marginTop: '-3px' }}>
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

function GoalOverlay({ iso2, teamCode, scorer, minute, matchKey, cardInView }) {
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

  function scrollToMatch() {
    document.getElementById(`match-${matchKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-950/90 backdrop-blur-sm animate-overlay-lifecycle cursor-pointer select-none"
         onClick={scrollToMatch}>
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
      {!cardInView && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-emerald-600 text-sm font-semibold animate-pulse tracking-wide pointer-events-none">
          Tap to view match →
        </div>
      )}
    </div>
  );
}

export default function UpcomingMatches({ dark = false }) {
  const scores = useScores();
  const standings = useStandings();

  const [goalEvents, setGoalEvents] = useState({});
  const [statBumps, setStatBumps] = useState(new Set());     // shot/sog only → triggers shoe/ball overlay
  const [possStatBumps, setPossStatBumps] = useState(new Set()); // poss only → animates the bar in-card
  const [minuteBumps, setMinuteBumps] = useState(new Set()); // minute clock ticks
  const [shotBumpVersion, setShotBumpVersion] = useState(0);
  const [shotInfo, setShotInfo] = useState(null);   // { iso2, name, shots, sog }
  const [shotMatchKey, setShotMatchKey] = useState('');
  const [shotCardVisible, setShotCardVisible] = useState(false);
  const [goalOverlay, setGoalOverlay] = useState(null);
  const prevScoresRef = useRef(null);
  const didAutoScrollRef = useRef(false);
  const firedGoalAnimsRef = useRef(new Set());

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
    const newBumps = new Set();        // shot / sog → shoe+ball overlay
    const newPossBumps = new Set();    // possession → bar animation only
    const newMinuteBumps = new Set();  // minute clock tick
    let overlayData = null;
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
        if (score.stats.home.shots !== p.stats.home.shots) newBumps.add(`${key}-home-shots`);
        if (score.stats.home.sog   !== p.stats.home.sog)   newBumps.add(`${key}-home-sog`);
        if (score.stats.away.shots !== p.stats.away.shots) newBumps.add(`${key}-away-shots`);
        if (score.stats.away.sog   !== p.stats.away.sog)   newBumps.add(`${key}-away-sog`);
        if (score.stats.home.poss  > p.stats.home.poss)  newPossBumps.add(`${key}-home-poss`);
        if (score.stats.away.poss  > p.stats.away.poss)  newPossBumps.add(`${key}-away-poss`);
      }
      if (score.detail !== p.detail) newMinuteBumps.add(key);
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
      if (info) setShotInfo(info);
      if (bumpMatchKey) { setShotMatchKey(bumpMatchKey); setShotCardVisible(isCardInView(bumpMatchKey)); }
      setShotBumpVersion(v => v + 1);
      setStatBumps(b => new Set([...b, ...newBumps]));
      setTimeout(() => { setStatBumps(b => { const n = new Set(b); for (const k of newBumps) n.delete(k); return n; }); setShotInfo(null); setShotMatchKey(''); setShotCardVisible(false); }, 3000);
    }
    if (newPossBumps.size > 0) {
      setPossStatBumps(b => new Set([...b, ...newPossBumps]));
      setTimeout(() => setPossStatBumps(b => { const n = new Set(b); for (const k of newPossBumps) n.delete(k); return n; }), 2800);
    }
    if (newMinuteBumps.size > 0) {
      setMinuteBumps(b => new Set([...b, ...newMinuteBumps]));
      setTimeout(() => setMinuteBumps(b => { const n = new Set(b); for (const k of newMinuteBumps) n.delete(k); return n; }), 800);
    }
    if (overlayData) {
      setGoalOverlay(overlayData);
      setTimeout(() => setGoalOverlay(null), 4500);
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
    {goalOverlay && <GoalOverlay {...goalOverlay} />}
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
              <span style={{ fontSize: '2rem', ...(shotInfo.kitColor ? { color: shotInfo.kitColor, textShadow: `0 0 20px ${shotInfo.kitColor}cc, 0 0 2px #fff, 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff` } : {}) }}>{shotInfo.name}</span>
              {shotInfo.iso2 && <img src={`https://flagcdn.com/w40/${shotInfo.iso2}.png`} alt="" className="h-6 w-auto rounded" />}
            </div>
            <div style={{ fontSize: '1.6rem' }}>Shots: {shotInfo.shots} · on target: {shotInfo.sog} 🎯</div>
            {!shotCardVisible && (
              <div className="text-emerald-500 text-sm font-semibold animate-pulse mt-3">
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
                  const home = isGroup ? TEAMS[m.home] : null;
                  const away = isGroup ? TEAMS[m.away] : null;
                  const searchUrl = isGroup
                    ? `https://www.google.com/search?q=${encodeURIComponent(`${home.name} vs ${away.name} 2026 FIFA World Cup`)}`
                    : null;

                  const matchKey = `${m.home}-${m.away}`;
                  const score = isGroup ? scores[matchKey] : null;
                  const parsedOdds = score ? parseOdds(score.oddsDetail) : null;
                  const isLive = score?.state === 'in';
                  // ESPN sometimes keeps state='in' past the final whistle; treat as done after 130 min
                  const matchStart = new Date(`${m.date}T${m.time}:00-04:00`);
                  const isFinal = score?.completed || (isLive && (now - matchStart) > 130 * 60 * 1000);
                  const homeWon = isFinal && (score?.homeScore ?? 0) > (score?.awayScore ?? 0);
                  const awayWon = isFinal && (score?.awayScore ?? 0) > (score?.homeScore ?? 0);
                  const homeGoals = score?.goals?.filter(g => g.side === 'home') ?? [];
                  const awayGoals = score?.goals?.filter(g => g.side === 'away') ?? [];
                  const displayHomeScore = isLive ? Math.max(score?.homeScore ?? 0, homeGoals.length) : (score?.homeScore ?? '-');
                  const displayAwayScore = isLive ? Math.max(score?.awayScore ?? 0, awayGoals.length) : (score?.awayScore ?? '-');
                  const fmtGoal = g => `${g.name} ${g.min}${g.og ? ' (OG)' : g.pk ? ' (P)' : ''}`;
                  const showScorers = isLive || isFinal;
                  const effectiveStats = score?.stats ?? null;
                  const showStats   = (isLive || isFinal) && effectiveStats != null;
                  const fmtStandings = s => s?.gp > 0
                    ? `${s.w}W ${s.d}D ${s.l}L · ${s.pts}pts · GD${s.gd > 0 ? '+' : ''}${s.gd}`
                    : null;
                  const homeStandStr = isGroup ? fmtStandings(standings[m.home]) : null;
                  const awayStandStr = isGroup ? fmtStandings(standings[m.away]) : null;

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
                          {isGroup ? (
                            <>
                              {STRENGTH_RANKS[m.home] && <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${t.rankPill}`}>#{STRENGTH_RANKS[m.home]}</span>}
                              <img src={`https://flagcdn.com/${home.iso2}.svg`} alt={home.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0 ring-1 ring-black/10" />
                              <span className={`text-sm truncate ${t.teamName} ${homeWon ? 'font-bold' : awayWon ? 'opacity-50' : 'font-medium'}`}>{home.name}</span>
                            </>
                          ) : (
                            <span className={`text-sm italic ${t.tbd}`}>TBD</span>
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

                              <span className={`text-sm font-bold tabular-nums ${anyGoalAnim ? 'animate-goal-pop' : ''} ${dark ? 'text-grass-400' : 'text-green-600'}`}>
                                {displayHomeScore} – {displayAwayScore}
                              </span>
                              <span className={`block text-[10px] font-semibold ${anyGoalAnim ? '' : 'animate-pulse'} ${dark ? 'text-grass-500' : 'text-green-500'}`}>
                                {anyGoalAnim
                                  ? <span className="animate-goal-toast inline-block font-black">⚽ GOAL!</span>
                                  : <span key={score?.detail} style={minuteBumps.has(matchKey) ? { display: 'inline-block', animation: 'minuteBumpGrow 0.8s ease-out' } : undefined}>{score?.detail || 'LIVE'}</span>}
                              </span>
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
                          {isGroup ? (
                            <>
                              <span className={`text-sm truncate text-right ${t.teamName} ${awayWon ? 'font-bold' : homeWon ? 'opacity-50' : 'font-medium'}`}>{away.name}</span>
                              <img src={`https://flagcdn.com/${away.iso2}.svg`} alt={away.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0 ring-1 ring-black/10" />
                              {STRENGTH_RANKS[m.away] && <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${t.rankPill}`}>#{STRENGTH_RANKS[m.away]}</span>}
                            </>
                          ) : (
                            <span className={`text-sm italic ${t.tbd}`}>TBD</span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: HAI [stars] | stadium name | [stars] SCO */}
                      <div className="flex items-center gap-2 mt-0.5">
                        {isGroup ? (
                          <>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {score?.homeKit && <JerseyIcon color={score.homeKit} dark={dark} />}
                              <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${dark ? 'text-emerald-500' : 'text-green-600'}`} style={score?.homeKit ? { background: score.homeAltKit ?? score.homeKit, boxShadow: '0 0 0 1px rgba(128,128,128,0.4)' } : undefined}>{m.home}</span>
                              <StrengthStars strength={STRENGTHS[m.home] ?? 50} className="text-[10px]" />
                            </div>
                            <span className={`text-xs truncate text-center flex-1 min-w-0 ${t.venueName}`}>{venue.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <StrengthStars strength={STRENGTHS[m.away] ?? 50} className="text-[10px]" />
                              <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${dark ? 'text-emerald-500' : 'text-green-600'}`} style={score?.awayKit ? { background: score.awayAltKit ?? score.awayKit, boxShadow: '0 0 0 1px rgba(128,128,128,0.4)' } : undefined}>{m.away}</span>
                              {score?.awayKit && <JerseyIcon color={score.awayKit} dark={dark} />}
                            </div>
                          </>
                        ) : (
                          <span className={`text-xs ${t.venueName}`}>{venue.name}</span>
                        )}
                      </div>

                      {/* Row 3: group + odds | city, country | broadcast + ↗ */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className={`text-[10px] font-bold flex-shrink-0 ${t.badge}`}>{isGroup ? `GROUP ${m.badge}` : m.badge}</span>
                          {parsedOdds && (
                            <span className={`text-[10px] truncate ${t.badge}`}>⚖️ {parsedOdds.team} {parsedOdds.pct}%</span>
                          )}
                        </div>
                        <span className={`text-[10px] text-center flex-shrink-0 ${t.venueName}`}>
                          {venue.city}{venue.country ? `, ${venue.country}` : ''}
                        </span>
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
                              <span className="flex-shrink-0 text-[10px] tabular-nums">
                                {homeGoals.length ? '⚽'.repeat(homeGoals.length) : '0'} | {awayGoals.length ? '⚽'.repeat(awayGoals.length) : '0'}
                              </span>
                              <div className={`flex-1 min-w-0 text-[10px] text-right leading-relaxed ${dark ? 'text-emerald-500' : 'text-neutral-500'}`}>
                                {awayGoals.map(fmtGoal).join(' · ')}
                              </div>
                            </div>
                          )}
                          {showStats && (() => {
                            const possChanging = possStatBumps.has(`${matchKey}-home-poss`) || possStatBumps.has(`${matchKey}-away-poss`);
                            const bumpStyle = key => statBumps.has(`${matchKey}-${key}`) ? { display: 'inline-block', animation: 'statBumpGlow 0.65s ease-out' } : undefined;
                            return (
                            <div className="flex items-center gap-2">
                              <span className={`flex-1 text-[10px] ${dark ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                <span style={bumpStyle('home-shots')}>{effectiveStats.home.shots}</span>{' shots · '}<span style={bumpStyle('home-sog')}>{effectiveStats.home.sog}</span>🎯
                              </span>
                              <div className="flex-shrink-0 w-20" style={{ position: 'relative' }}>
                                {possStatBumps.has(`${matchKey}-home-poss`) && home?.iso2 && (
                                  <img
                                    src={`https://flagcdn.com/w160/${home.iso2}.png`}
                                    alt=""
                                    className="absolute pointer-events-none"
                                    style={{
                                      width: '200px', height: 'auto',
                                      left: '0', bottom: '0', zIndex: 30,
                                      borderRadius: '6px',
                                      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
                                      animation: 'possHomeFlagFly 2.8s ease-out forwards',
                                    }}
                                  />
                                )}
                                {possStatBumps.has(`${matchKey}-away-poss`) && away?.iso2 && (
                                  <img
                                    src={`https://flagcdn.com/w160/${away.iso2}.png`}
                                    alt=""
                                    className="absolute pointer-events-none"
                                    style={{
                                      width: '200px', height: 'auto',
                                      right: '0', bottom: '0', zIndex: 30,
                                      borderRadius: '6px',
                                      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
                                      animation: 'possAwayFlagFly 2.8s ease-out forwards',
                                    }}
                                  />
                                )}
                                <div
                                  className={`rounded-full ${possChanging ? '' : 'overflow-hidden'}`}
                                  style={{
                                    height: '4px',
                                    background: score?.awayKit ?? (dark ? 'rgba(6,78,59,0.5)' : '#e5e7eb'),
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
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
                                <span style={bumpStyle('away-shots')}>{effectiveStats.away.shots}</span>{' shots · '}<span style={bumpStyle('away-sog')}>{effectiveStats.away.sog}</span>🎯
                              </span>
                            </div>
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
                  const cardFlash = anyGoalAnim ? <div className="absolute inset-0 rounded-lg pointer-events-none animate-goal-card-flash" /> : null;
                  const cardAttrs = {
                    ...(isLiveActive        ? { 'data-live-game':     'true' } : {}),
                    ...(isNextUp            ? { 'data-next-upcoming': 'true' } : {}),
                  };
                  return searchUrl ? (
                    <div key={m.id} id={`match-${matchKey}`} className="relative" {...cardAttrs}>
                      {liveOverlay}{cardFlash}
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" className={`${cls} group/row`}>
                        {inner}
                      </a>
                    </div>
                  ) : (
                    <div key={m.id} id={`match-${matchKey}`} className="relative" {...cardAttrs}>
                      {liveOverlay}{cardFlash}
                      <div className={cls}>
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
