import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEAMS, GROUP_MATCHES, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../data/tournamentData.js';

const ALL_MATCH_TIMES = [
  ...Object.values(GROUP_MATCHES).flat(),
  ...R32_MATCHES, ...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, FINAL_MATCH,
];

function hasLiveGame() {
  const now = new Date();
  return ALL_MATCH_TIMES.some(m => {
    const start = new Date(`${m.date}T${m.time}:00-04:00`);
    return now >= start && now <= new Date(start.getTime() + 130 * 60 * 1000);
  });
}
import { STRENGTHS, STRENGTH_RANKS, FIFA_RANKINGS } from '../data/teamStrengths.js';
import { autofillBracket } from '../utils/autofill.js';
import StrengthStars from '../components/StrengthStars.jsx';
import UpcomingMatches from '../components/UpcomingMatches.jsx';

const FEATURES = [
  {
    icon: '⚽',
    title: 'All 48 Teams',
    desc: 'Every qualified nation across 12 groups — with flags. Group A through L, set up exactly as drawn.',
  },
  {
    icon: '🏆',
    title: 'Full Knockout Bracket',
    desc: 'Round of 32 all the way to the Final at MetLife. Click a team to advance them through each round.',
  },
  {
    icon: '🔗',
    title: 'Instant Share Link',
    desc: 'Save your bracket and get a short URL like bracketwebb.com/blazing-striker. No account needed.',
  },
  {
    icon: '📍',
    title: 'Venue & Time Info',
    desc: 'Every knockout match shows the stadium, city, and kickoff time in your local timezone.',
  },
];

const EXAMPLE_SLUGS = ['blazing-striker', 'golden-wizard', 'turbo-eagle', 'argentina', 'matt'];

// FIFA World Cup titles per team (only past winners included)
const WC_TITLES = {
  BRA: 5, // 1958 1962 1970 1994 2002
  GER: 4, // 1954 1974 1990 2014
  ARG: 3, // 1978 1986 2022
  FRA: 2, // 1998 2018
  URU: 2, // 1930 1950
  ENG: 1, // 1966
  ESP: 1, // 2010
};

// FIFA World Cup runner-up finishes among 2026 qualified teams
const WC_RUNNER_UP = {
  GER: 4, // 1966 1982 1986 2002
  NED: 3, // 1974 1978 2010
  ARG: 3, // 1930 1990 2014
  BRA: 2, // 1950 1998
  FRA: 2, // 2006 2022
  CRO: 1, // 2018
  SWE: 1, // 1958
};

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('bracketwebb_history') ?? '[]'); } catch { return []; }
}

async function enrichChampions(history, setHistory) {
  const missing = history.filter(e => !e.champion);
  if (missing.length === 0) return;
  const updates = await Promise.all(
    missing.map(async e => {
      try {
        const res = await fetch(`/.netlify/functions/get-bracket?slug=${encodeURIComponent(e.slug)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const champion = data.knockoutPicks?.['m104'] ?? data.knockoutPicks?.final ?? null;
        return champion ? { slug: e.slug, champion } : null;
      } catch { return null; }
    })
  );
  const patchMap = Object.fromEntries(updates.filter(Boolean).map(u => [u.slug, u.champion]));
  if (Object.keys(patchMap).length === 0) return;
  setHistory(prev => {
    const next = prev.map(e => (patchMap[e.slug] && !e.champion ? { ...e, champion: patchMap[e.slug] } : e));
    try { localStorage.setItem('bracketwebb_history', JSON.stringify(next)); } catch {}
    return next;
  });
}

const ALL_TEAMS = Object.keys(TEAMS)
  .sort((a, b) => (STRENGTHS[b] ?? 50) - (STRENGTHS[a] ?? 50))
  .map(code => ({ code, ...TEAMS[code] }));

export default function Home() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => { enrichChampions(history, setHistory); }, []);

  useEffect(() => {
    if (hasLiveGame()) {
      // Try to land on the live card; fall back to today header if scores haven't loaded yet
      setTimeout(() => {
        const el = document.querySelector('[data-live-game="true"]') ?? document.getElementById('today-games');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 200;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 600);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  function handleTeamClick(code) {
    const draft = autofillBracket('favorites', code);
    const versioned = { version: 2, ...draft };
    try { localStorage.setItem('bracketwebb_draft', JSON.stringify(versioned)); } catch {}
    navigate('/new', { state: { makeMine: versioned } });
  }

  const visibleTeams = showAll ? ALL_TEAMS : ALL_TEAMS.slice(0, 12);

  return (
    <div className="bg-white text-neutral-900 min-h-screen">

      {/* ── Dedication ── */}
      <div className="bg-green-50 border-b border-green-200 py-3 px-6 text-center">
        <p className="text-sm text-green-800">
          Dedicated to <strong className="font-bold">Matt Webb</strong> — thanks for the idea! 🏆
        </p>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 border-b border-neutral-200">
        <p className="text-sm font-medium text-green-600 mb-3">
          ⚽ 2026 FIFA World Cup · June 11 – July 19
        </p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none text-neutral-900 mb-5">
          Build your<br />
          <span className="text-green-600">World Cup</span><br />
          bracket.
        </h1>
        <p className="text-lg text-neutral-500 max-w-xl mb-8 leading-relaxed">
          Pick the 2 teams that advance from each of 12 groups, fill the
          knockout bracket, and share a short link with friends.
          Takes about 5 minutes. No login.
        </p>
        <Link
          to="/new"
          className="inline-block px-7 py-3.5 rounded-lg bg-green-600 text-white font-bold text-base hover:bg-green-700 transition-colors"
        >
          Create my bracket →
        </Link>
        <p className="mt-3 text-sm text-neutral-400">
          Free · Saves to a link like{' '}
          <Link to={`/${history[0]?.slug ?? 'blazing-striker'}`} className="font-mono text-neutral-500 hover:text-green-600 underline underline-offset-2 transition-colors">bracketwebb.com/<span className="text-neutral-700">{history[0]?.slug ?? 'blazing-striker'}</span></Link>
        </p>
        <a
          href="#upcoming-matches"
          onClick={(e) => {
            e.preventDefault();
            const el = document.querySelector('[data-live-game="true"]')
                     ?? document.querySelector('[data-next-upcoming="true"]')
                     ?? document.getElementById('upcoming-matches');
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 200;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-green-600 font-semibold hover:text-green-700 transition-colors"
        >
          ↓ View live scores &amp; upcoming matches
        </a>
      </section>

      {/* ── Team flags ── */}
      <section className="max-w-3xl mx-auto px-6 py-8 border-b border-neutral-200">
        <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">48 Teams · All Confederations</p>
        <p className="text-xs text-neutral-400 mb-4">Tap a flag to auto-generate a bracket with that team winning</p>
        <div className="flex flex-wrap gap-2">
          {visibleTeams.map(t => (
            <button
              key={t.code}
              onClick={() => handleTeamClick(t.code)}
              title={`Generate bracket: ${t.name} wins`}
              className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-neutral-200 text-neutral-500 px-1 py-0.5 rounded flex-shrink-0">#{STRENGTH_RANKS[t.code]}</span>
                <img
                  src={`https://flagcdn.com/${t.iso2}.svg`}
                  alt={t.name}
                  className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                />
                <span className="text-sm text-neutral-600 whitespace-nowrap">{t.name}</span>
              </div>
              <StrengthStars strength={STRENGTHS[t.code]} className="text-xs" />
            </button>
          ))}
          {!showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center px-2.5 py-1.5 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-400 hover:border-green-400 hover:text-green-600 transition-colors cursor-pointer"
            >
              + {ALL_TEAMS.length - 12} more
            </button>
          )}
        </div>
        <button
          onClick={() => {
            const el = document.getElementById('power-rankings');
            if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 10, behavior: 'smooth' });
          }}
          className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          View Team Power Rankings ↓
        </button>
      </section>

      <div id="upcoming-matches">
        <UpcomingMatches />
      </div>

      {/* ── Features ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="flex gap-4 p-4 rounded-lg border border-neutral-200 hover:border-green-300 transition-colors"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <h3 className="font-bold text-neutral-900 mb-1">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">How it works</h2>
        <ol className="space-y-5">
          {[
            {
              title: 'Pick group qualifiers',
              desc: 'For each of the 12 groups, click the top 2 teams you think advance. Groups A through L.',
            },
            {
              title: 'Fill the knockout bracket',
              desc: 'Round of 32 → Round of 16 → Quarterfinals → Semifinals → Final. Click to advance picks.',
            },
            {
              title: 'Save and share',
              desc: 'Hit "Save & Share" and pick your name. You get a short link instantly.',
            },
          ].map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-neutral-900">{step.title}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Power Rankings ── */}
      <div id="power-rankings" className="relative" style={{ scrollMarginTop: '10px' }} />
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => {
              const el = document.getElementById('upcoming-matches');
              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
            }}
            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            ↑ Upcoming Matches
          </button>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Team Power Rankings</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Ratings (0–100) based on FIFA rankings, betting odds, squad quality, and recent form.
          Tap any team to auto-fill a bracket with them winning the trophy.
        </p>

        <div className="space-y-1.5">
          {ALL_TEAMS.map((t, i) => (
            <button
              key={t.code}
              onClick={() => handleTeamClick(t.code)}
              title={`Generate bracket: ${t.name} wins`}
              className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:border-green-400 hover:bg-green-50 active:bg-green-100 active:border-green-500 transition-colors cursor-pointer text-left select-none"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 flex-shrink-0 flex justify-center">
                    <span className="text-[10px] font-bold bg-neutral-200 text-neutral-500 px-1 py-0.5 rounded">#{i + 1}</span>
                  </div>
                  <img
                    src={`https://flagcdn.com/${t.iso2}.svg`}
                    alt={t.name}
                    className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
                  />
                  <span className="font-medium text-neutral-800 group-hover:text-green-700 transition-colors">{t.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400">{t.code}</span>
                  {WC_TITLES[t.code] && (
                    <span className="text-[10px] font-medium text-amber-600">🏆×{WC_TITLES[t.code]}</span>
                  )}
                  {WC_RUNNER_UP[t.code] && (
                    <span className="text-[10px] font-medium text-neutral-400">🥈×{WC_RUNNER_UP[t.code]}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-7 flex-shrink-0" />
                  {FIFA_RANKINGS[t.code] && (
                    <span className="text-[10px] font-bold bg-neutral-200 text-neutral-500 px-1 py-0.5 rounded">FIFA #{FIFA_RANKINGS[t.code]}</span>
                  )}
                  <span className="text-[10px] font-medium text-neutral-400">{t.conf}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <StrengthStars strength={STRENGTHS[t.code]} className="text-sm" />
                <span className="block text-[10px] text-neutral-400 tabular-nums mt-0.5">{STRENGTHS[t.code] ?? 50}/100</span>
              </div>
              <span className="flex-shrink-0 text-neutral-300 group-hover:text-green-500 transition-colors text-sm">→</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Bracket history / example links ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        {history.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Your bracket history</h2>
            <p className="text-sm text-neutral-500 mb-5">Brackets you've visited or saved on this device.</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-400 uppercase tracking-wider">
                  <th className="text-left py-2 pr-3 w-8">#</th>
                  <th className="text-left py-2 pr-3">Bracket</th>
                  <th className="text-left py-2 pr-3 hidden sm:table-cell">Pick</th>
                  <th className="text-left py-2 hidden sm:table-cell">Visited</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((entry, i) => {
                  const flagSrc = entry.champion && TEAMS[entry.champion]
                    ? `https://flagcdn.com/${TEAMS[entry.champion].iso2}.svg`
                    : null;
                  return (
                    <tr key={entry.slug} className="border-b border-neutral-100 group">
                      <td className="py-2 pr-3 text-neutral-400 text-xs tabular-nums align-top">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/${entry.slug}`}
                            className="font-mono text-green-600 hover:text-green-700 hover:underline"
                          >
                            bracketwebb.com/<span className="font-semibold">{entry.slug}</span>
                          </Link>
                          {entry.mine && (
                            <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        {/* Mobile-only: pick + date below the link */}
                        <div className="flex items-center gap-3 mt-1 sm:hidden">
                          {flagSrc ? (
                            <div className="flex items-center gap-1.5">
                              <img src={flagSrc} alt={entry.champion} className="w-5 h-3.5 object-cover rounded-sm" />
                              <span className="text-xs text-neutral-600">{TEAMS[entry.champion].name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-300">—</span>
                          )}
                          <span className="text-xs text-neutral-400">
                            {(() => {
                              const d = new Date(entry.savedAt);
                              const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                              const hour = d.toLocaleTimeString(undefined, { hour: 'numeric' }).replace(' ', '');
                              return `${date} ${hour}`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 hidden sm:table-cell">
                        {flagSrc ? (
                          <div className="flex items-center gap-1.5">
                            <img src={flagSrc} alt={entry.champion} className="w-5 h-3.5 object-cover rounded-sm" />
                            <span className="text-xs text-neutral-600">{TEAMS[entry.champion].name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="py-2 text-xs text-neutral-400 hidden sm:table-cell whitespace-nowrap">
                        {(() => {
                          const d = new Date(entry.savedAt);
                          const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          const hour = d.toLocaleTimeString(undefined, { hour: 'numeric' }).replace(' ', '');
                          return `${date} ${hour}`;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Your link looks like this</h2>
            <p className="text-sm text-neutral-500 mb-5">
              Pick a custom name or re-roll until you get one you like.
            </p>
            <div className="space-y-2">
              {EXAMPLE_SLUGS.map(slug => (
                <div
                  key={slug}
                  className="flex px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 font-mono text-sm text-neutral-600"
                >
                  <span className="text-neutral-400">bracketwebb.com/</span><span className="text-green-600 font-semibold">{slug}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-14 text-center">
        <Link
          to="/new"
          className="inline-block px-8 py-4 rounded-lg bg-green-600 text-white font-black text-lg hover:bg-green-700 transition-colors"
        >
          Create my bracket →
        </Link>
        <p className="mt-4 text-sm text-neutral-400">
          48 teams · 5 rounds · 1 champion
        </p>
        <button
          onClick={() => {
            const el = document.getElementById('today-games');
            if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
          }}
          className="mt-6 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          ↑ Jump to today's games
        </button>
      </section>

    </div>
  );
}
