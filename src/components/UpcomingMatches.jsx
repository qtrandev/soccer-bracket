import { TEAMS, GROUP_MATCHES, VENUES } from '../data/tournamentData.js';
import { formatMatchTime } from '../utils/bracket.js';

const ALL_GROUP_MATCHES = Object.entries(GROUP_MATCHES)
  .flatMap(([group, matches]) => matches.map(m => ({ ...m, group })))
  .sort((a, b) => new Date(`${a.date}T${a.time}:00-04:00`) - new Date(`${b.date}T${b.time}:00-04:00`));

const WINDOW_DAYS = 10;

function dateLabel(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export default function UpcomingMatches() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const upcoming = ALL_GROUP_MATCHES.filter(m => {
    const dt = new Date(`${m.date}T${m.time}:00-04:00`);
    return dt >= now && dt <= windowEnd;
  });

  if (upcoming.length === 0) return null;

  const byDate = {};
  for (const m of upcoming) {
    (byDate[m.date] ??= []).push(m);
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-10 border-b border-neutral-200">
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Upcoming Matches</h2>
      <p className="text-sm text-neutral-400 mb-6">
        Next {WINDOW_DAYS} days · Group Stage · Times in your local timezone
      </p>

      <div className="space-y-6">
        {Object.entries(byDate).map(([date, matches]) => (
          <div key={date}>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 pb-1.5 border-b border-neutral-100">
              {dateLabel(date)}
            </p>
            <div className="space-y-1.5">
              {matches.map(m => {
                const home = TEAMS[m.home];
                const away = TEAMS[m.away];
                const venue = VENUES[m.venue];
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg border border-neutral-100 hover:border-green-200 hover:bg-green-50 transition-colors"
                  >
                    {/* Group badge */}
                    <span className="text-[10px] font-bold text-neutral-400 w-5 flex-shrink-0 text-center">
                      {m.group}
                    </span>

                    {/* Home team */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <img
                        src={`https://flagcdn.com/${home.iso2}.svg`}
                        alt={home.name}
                        className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                      />
                      <span className="text-sm font-medium text-neutral-800 truncate">{home.name}</span>
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 text-center w-20">
                      <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
                        {formatMatchTime(m.date, m.time)}
                      </span>
                    </div>

                    {/* Away team */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-medium text-neutral-800 truncate text-right">{away.name}</span>
                      <img
                        src={`https://flagcdn.com/${away.iso2}.svg`}
                        alt={away.name}
                        className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                      />
                    </div>

                    {/* Venue — hidden on small screens */}
                    <div className="hidden sm:block flex-shrink-0 w-40 text-right">
                      <span className="text-xs text-neutral-400 truncate block">{venue.name}</span>
                      <span className="text-xs text-neutral-300 truncate block">{venue.city}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
