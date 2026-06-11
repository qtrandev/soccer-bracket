import { TEAMS, GROUP_MATCHES, VENUES, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../data/tournamentData.js';
import { formatMatchTime } from '../utils/bracket.js';

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

export default function UpcomingMatches({ dark = false }) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const todayStr = localDateKey(now);

  const upcoming = ALL_MATCHES
    .map(m => ({ ...m, dt: new Date(`${m.date}T${m.time}:00-04:00`) }))
    .filter(m => m.dt >= now && m.dt <= windowEnd);

  if (upcoming.length === 0) return null;

  const byDate = {};
  for (const m of upcoming) {
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
  };

  return (
    <section className={`max-w-3xl mx-auto px-6 py-10 border-b ${t.section}`}>
      <h2 className={`text-xl font-bold mb-1 ${t.title}`}>Upcoming Matches</h2>
      <p className={`text-sm mb-6 ${t.subtitle}`}>
        Next {WINDOW_DAYS} days · Times in your local timezone · Tap a match to search on Google
      </p>

      <div className="space-y-6">
        {Object.entries(byDate).map(([dateKey, { label, matches }]) => {
          const isToday = dateKey === todayStr;
          return (
            <div key={dateKey}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 pb-1.5 border-b ${
                isToday ? t.dateToday : t.dateOther
              }`}>
                {isToday ? `Today · ${label}` : label}
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

                  const inner = (
                    <>
                      <span className={`text-[10px] font-bold w-6 flex-shrink-0 text-center ${t.badge}`}>
                        {m.badge}
                      </span>

                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isGroup ? (
                          <>
                            <img src={`https://flagcdn.com/${home.iso2}.svg`} alt={home.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                            <span className={`text-sm font-medium truncate ${t.teamName}`}>{home.name}</span>
                          </>
                        ) : (
                          <span className={`text-sm italic ${t.tbd}`}>TBD</span>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-center w-20">
                        <span className={`text-xs font-semibold whitespace-nowrap ${t.time}`}>
                          {formatMatchTime(m.date, m.time)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        {isGroup ? (
                          <>
                            <span className={`text-sm font-medium truncate text-right ${t.teamName}`}>{away.name}</span>
                            <img src={`https://flagcdn.com/${away.iso2}.svg`} alt={away.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                          </>
                        ) : (
                          <span className={`text-sm italic ${t.tbd}`}>TBD</span>
                        )}
                      </div>

                      <div className="hidden sm:block flex-shrink-0 w-40 text-right">
                        <span className={`text-xs truncate block ${t.venueName}`}>{venue.name}</span>
                        <span className={`text-xs truncate block ${t.venueCity}`}>{venue.city}</span>
                      </div>
                    </>
                  );

                  const cls = `flex items-center gap-2 py-2 px-3 rounded-lg border transition-colors ${t.row}`;
                  return searchUrl ? (
                    <a key={m.id} href={searchUrl} target="_blank" rel="noopener noreferrer" className={`${cls} group/row`}>
                      {inner}
                      <span className={`flex-shrink-0 transition-colors text-xs ${t.arrow}`}>↗</span>
                    </a>
                  ) : (
                    <div key={m.id} className={cls}>
                      {inner}
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
