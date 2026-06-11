import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEAMS } from '../data/tournamentData.js';
import { STRENGTHS } from '../data/teamStrengths.js';
import { autofillBracket } from '../utils/autofill.js';
import StrengthStars from '../components/StrengthStars.jsx';

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
    title: 'Venue Info',
    desc: 'Each match shows the stadium and US city. Semifinal and Final dates shown.',
  },
];

const EXAMPLE_SLUGS = ['blazing-striker', 'golden-wizard', 'turbo-eagle', 'argentina', 'matt'];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('bracketwebb_history') ?? '[]'); } catch { return []; }
}

const ALL_TEAMS = Object.keys(TEAMS)
  .sort((a, b) => (STRENGTHS[b] ?? 50) - (STRENGTHS[a] ?? 50))
  .map(code => ({ code, ...TEAMS[code] }));

export default function Home() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [history] = useState(loadHistory);

  function handleTeamClick(code) {
    const draft = autofillBracket('favorites', code);
    try { localStorage.setItem('bracketwebb_draft', JSON.stringify(draft)); } catch {}
    navigate('/new', { state: { makeMine: draft } });
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
      </section>

      {/* ── Features ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">What you get</h2>
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

      {/* ── Bracket history / example links ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        {history.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Your saved brackets</h2>
            <p className="text-sm text-neutral-500 mb-5">All brackets you've saved on this device.</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-400 uppercase tracking-wider">
                  <th className="text-left py-2 pr-3">#</th>
                  <th className="text-left py-2 pr-3">Bracket</th>
                  <th className="text-left py-2 hidden sm:table-cell">Saved</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, i) => (
                  <tr key={entry.slug} className="border-b border-neutral-100 group">
                    <td className="py-2 pr-3 text-neutral-400 text-xs tabular-nums">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <Link
                        to={`/${entry.slug}`}
                        className="font-mono text-green-600 hover:text-green-700 hover:underline"
                      >
                        bracketwebb.com/<span className="font-semibold">{entry.slug}</span>
                      </Link>
                    </td>
                    <td className="py-2 text-xs text-neutral-400 hidden sm:table-cell">
                      {new Date(entry.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
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

      {/* ── Power Rankings ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Team Power Rankings</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Ratings (0–100) based on FIFA rankings, betting odds, squad quality, and recent form.
          Stars show the same scale — tap any team to auto-generate a bracket with them winning.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-400 uppercase tracking-wider">
                <th className="text-left py-2 pr-3 w-8">#</th>
                <th className="text-left py-2 pr-3">Team</th>
                <th className="text-left py-2 pr-3 hidden sm:table-cell">Conf.</th>
                <th className="text-left py-2 pr-3">Strength</th>
                <th className="text-right py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {ALL_TEAMS.map((t, i) => (
                <tr
                  key={t.code}
                  onClick={() => handleTeamClick(t.code)}
                  className="border-b border-neutral-100 hover:bg-green-50 cursor-pointer transition-colors group"
                  title={`Generate bracket: ${t.name} wins`}
                >
                  <td className="py-2 pr-3 text-neutral-400 text-xs tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://flagcdn.com/${t.iso2}.svg`}
                        alt={t.name}
                        className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                      />
                      <span className="font-medium text-neutral-800 group-hover:text-green-700 transition-colors">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 hidden sm:table-cell">
                    <span className="text-xs text-neutral-400">{t.conf}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <StrengthStars strength={STRENGTHS[t.code]} className="text-sm" />
                  </td>
                  <td className="py-2 text-right tabular-nums font-mono text-xs text-neutral-500">
                    {STRENGTHS[t.code] ?? 50}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </section>

    </div>
  );
}
