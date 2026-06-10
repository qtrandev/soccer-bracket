import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEAMS } from '../data/tournamentData.js';
import { STRENGTHS } from '../data/teamStrengths.js';
import { autofillBracket } from '../utils/autofill.js';

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
    desc: 'Each match shows the stadium and US city. Kickoff times shown in your local timezone.',
  },
];

const EXAMPLE_SLUGS = ['blazing-striker', 'golden-wizard', 'phantom-keeper', 'turbo-eagle'];

const ALL_TEAMS = Object.keys(TEAMS)
  .sort((a, b) => (STRENGTHS[b] ?? 50) - (STRENGTHS[a] ?? 50))
  .map(code => ({ code, ...TEAMS[code] }));

export default function Home() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

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
          <Link to="/blazing-striker" className="font-mono text-neutral-500 hover:text-green-600 underline underline-offset-2 transition-colors">bracketwebb.com/blazing-striker</Link>
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-colors cursor-pointer"
            >
              <img
                src={`https://flagcdn.com/${t.iso2}.svg`}
                alt={t.name}
                className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
              />
              {t.name}
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

      {/* ── Example links ── */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Your link looks like this</h2>
        <p className="text-sm text-neutral-500 mb-5">
          Pick a custom name or re-roll until you get one you like.
        </p>
        <div className="space-y-2">
          {EXAMPLE_SLUGS.map(slug => (
            <Link
              key={slug}
              to={`/${slug}`}
              className="flex px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 font-mono text-sm text-neutral-600 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <span className="text-neutral-400">bracketwebb.com/</span><span className="text-green-600 font-semibold">{slug}</span>
            </Link>
          ))}
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
