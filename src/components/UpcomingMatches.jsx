import { useState, useEffect, useRef } from 'react';
import { TEAMS, GROUP_MATCHES, VENUES, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../data/tournamentData.js';
import { formatMatchTime } from '../utils/bracket.js';
import { STRENGTHS, STRENGTH_RANKS } from '../data/teamStrengths.js';
import StrengthStars from './StrengthStars.jsx';

function useScores() {
  const [scores, setScores] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/.netlify/functions/scores');
        if (res.ok) setScores(await res.json());
      } catch {}
    }

    function startPolling() {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(load, 15_000);
    }

    function stopPolling() {
      clearInterval(timerRef.current);
    }

    // Re-fetch + restart poll when tab comes back into view (covers background → foreground)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') { load(); startPolling(); }
      else stopPolling();
    };

    // Re-fetch on bfcache restore — the event Chrome fires instead of a real reload
    const handlePageShow = (e) => { if (e.persisted) { load(); startPolling(); } };

    load();
    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
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

export default function UpcomingMatches({ dark = false }) {
  const scores = useScores();
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

                  const score = isGroup ? scores[`${m.home}-${m.away}`] : null;
                  const parsedOdds = score ? parseOdds(score.oddsDetail) : null;
                  const isLive = score?.state === 'in';
                  // ESPN sometimes keeps state='in' past the final whistle; treat as done after 130 min
                  const matchStart = new Date(`${m.date}T${m.time}:00-04:00`);
                  const isFinal = score?.completed || (isLive && (now - matchStart) > 130 * 60 * 1000);
                  const homeWon = isFinal && score.homeScore > score.awayScore;
                  const awayWon = isFinal && score.awayScore > score.homeScore;

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

                        <div className="flex-shrink-0 text-center w-20">
                          {isLive ? (
                            <>
                              <span className={`text-sm font-bold tabular-nums ${dark ? 'text-grass-400' : 'text-green-600'}`}>
                                {score.homeScore} – {score.awayScore}
                              </span>
                              <span className={`block text-[10px] font-semibold animate-pulse ${dark ? 'text-grass-500' : 'text-green-500'}`}>
                                {score.detail || 'LIVE'}
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
                              <span className={`text-[10px] font-bold ${t.badge}`}>{m.home}</span>
                              <StrengthStars strength={STRENGTHS[m.home] ?? 50} className="text-[10px]" />
                            </div>
                            <span className={`text-xs truncate text-center flex-1 min-w-0 ${t.venueName}`}>{venue.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <StrengthStars strength={STRENGTHS[m.away] ?? 50} className="text-[10px]" />
                              <span className={`text-[10px] font-bold ${t.badge}`}>{m.away}</span>
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
                            <span className={`text-[10px] truncate ${t.badge}`}>📺 {score.broadcast.slice(0, 2).join(' · ')}</span>
                          )}
                          {searchUrl && (
                            <span className={`text-xs flex-shrink-0 transition-colors ${t.arrow}`}>↗</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  const isLiveActive = isLive && !isFinal;
                  const pastCls = dark
                    ? 'border-emerald-900/20 opacity-50 hover:opacity-100'
                    : 'border-neutral-100 opacity-50 hover:opacity-100';
                  const liveRowCls = dark
                    ? 'border-grass-600/50 bg-grass-500/5'
                    : 'border-green-400 bg-green-50/50';
                  const cls = `flex items-start sm:items-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                    isLiveActive ? liveRowCls : isPast ? pastCls : t.row
                  }`;
                  const liveOverlay = isLiveActive ? (
                    <div className={`absolute inset-0 rounded-lg border-2 pointer-events-none ${dark ? 'border-grass-400' : 'border-green-400'}`} />
                  ) : null;
                  return searchUrl ? (
                    <div key={m.id} className="relative">
                      {liveOverlay}
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" className={`${cls} group/row`}>
                        {inner}
                      </a>
                    </div>
                  ) : (
                    <div key={m.id} className="relative">
                      {liveOverlay}
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
  );
}
