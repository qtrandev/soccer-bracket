import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import GroupStage from '../components/GroupStage.jsx';
import KnockoutBracket from '../components/KnockoutBracket.jsx';
import TeamFlag from '../components/TeamFlag.jsx';
import UpcomingMatches from '../components/UpcomingMatches.jsx';
import GroupJumpNav from '../components/GroupJumpNav.jsx';
import { FINAL_MATCH } from '../data/tournamentData.js';

export default function ViewBracket() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bracketData, setBracketData] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [tab, setTab] = useState('knockout');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/.netlify/functions/get-bracket?slug=${encodeURIComponent(slug)}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (!res.ok) {
          console.error('get-bracket failed:', res.status, data);
          setNotFound(true);
          return;
        }
        setBracketData(data);
        // Record this bracket in the visitor's local history
        try {
          const champion = data.knockoutPicks?.['m104'] ?? data.knockoutPicks?.final ?? null;
          const prev = JSON.parse(localStorage.getItem('bracketwebb_history') ?? '[]');
          const existing = prev.find(h => h.slug === slug);
          const deduped = prev.filter(h => h.slug !== slug);
          // Preserve mine:true if already saved by this user
          deduped.unshift({ slug, champion, mine: existing?.mine ?? false, savedAt: new Date().toISOString() });
          localStorage.setItem('bracketwebb_history', JSON.stringify(deduped.slice(0, 20)));
        } catch {}
        // Silently migrate v1 brackets to the official FIFA structure
        if (data.version === 1) {
          setMigrating(true);
          fetch('/.netlify/functions/migrate-bracket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
          })
            .then(r => r.json())
            .then(result => { if (result.bracket) setBracketData(result.bracket); })
            .catch(() => {})
            .finally(() => setMigrating(false));
        }
      } catch (err) {
        console.error('get-bracket fetch error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const navigate = useNavigate();

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
  }

  function handleMakeMine() {
    const draft = {
      version:       2,
      groupPicks:    bracketData.groupPicks    ?? {},
      wildcards:     bracketData.wildcards     ?? [],
      knockoutPicks: bracketData.knockoutPicks ?? {},
    };
    try {
      localStorage.setItem('bracketwebb_draft', JSON.stringify(draft));
    } catch {}
    // Pass draft via router state as a reliable backup channel in case
    // localStorage is unavailable (private mode, quota, etc.)
    navigate('/new', { state: { makeMine: draft } });
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-spin">⚽</div>
        <p className="text-emerald-500">Loading bracket…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="text-5xl">🔍</div>
        <div>
          <h1 className="text-2xl font-black text-emerald-100 mb-2">Bracket not found</h1>
          <p className="text-emerald-500">
            No bracket exists at <code className="text-grass-400">/{slug}</code>
          </p>
        </div>
        <Link
          to="/new"
          className="px-6 py-3 rounded-xl bg-grass-500 text-pitch-950 font-bold hover:bg-grass-400 transition-colors"
        >
          Create Your Own Bracket
        </Link>
      </div>
    );
  }

  // Use bracketData directly — routing through useBracket caused state to
  // initialize from null on first render and never update when the fetch resolved.
  const groupPicks    = bracketData?.groupPicks    ?? {};
  const wildcards     = bracketData?.wildcards     ?? [];
  const knockoutPicks = bracketData?.knockoutPicks ?? {};
  const isLegacyBracket = bracketData?.version === 1;
  const champion      = knockoutPicks?.[FINAL_MATCH.id];
  const displaySlug   = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const createdAt     = bracketData?.createdAt
    ? new Date(bracketData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-emerald-600 uppercase tracking-widest font-medium">
              ⚽ Bracket
            </span>
            <span className="text-xs text-emerald-800">·</span>
            <span className="text-xs text-grass-500 font-mono">/{slug}</span>
            {createdAt && <span className="text-xs text-emerald-800">· {createdAt}</span>}
          </div>
          {champion ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">🏆</span>
              <TeamFlag code={champion} size="md" showName />
              <span className="text-sm text-gold-400 font-semibold">wins it all · {displaySlug}'s Bracket</span>
            </div>
          ) : (
            <h1 className="text-2xl font-black text-emerald-100">{slug}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg border border-emerald-700 text-sm text-emerald-300 hover:border-grass-500 hover:text-grass-400 transition-colors"
          >
            📋 Copy Link
          </button>
          <button
            onClick={handleMakeMine}
            className="px-4 py-2 rounded-lg bg-grass-500 text-pitch-950 font-bold text-sm hover:bg-grass-400 transition-colors"
          >
            Make Mine
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-pitch-800 w-fit">
        {[{ id: 'knockout', label: '🏆 Bracket' }, { id: 'groups', label: '📋 Groups' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-grass-500 text-pitch-950'
                : 'text-emerald-500 hover:text-emerald-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <>
          <GroupJumpNav />
          <GroupStage groupPicks={groupPicks} onPick={() => {}} readOnly wildcards={wildcards} />
        </>
      )}

      {tab === 'knockout' && (
        migrating ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="text-3xl animate-spin">⚽</div>
            <p className="text-emerald-500 text-sm">Updating to official FIFA bracket…</p>
          </div>
        ) : isLegacyBracket ? (
          <div className="px-4 py-6 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
            <p className="text-amber-400 font-semibold mb-1">Couldn't migrate to the official FIFA bracket</p>
            <p className="text-sm text-amber-600">Group picks are still viewable in the Groups tab.</p>
          </div>
        ) : (
          <KnockoutBracket
            groupPicks={groupPicks}
            wildcards={wildcards}
            knockoutPicks={knockoutPicks}
            onPick={() => {}}
            readOnly
          />
        )
      )}
      <div id="upcoming-games" className="mt-10 -mx-4">
        <UpcomingMatches dark />
      </div>
    </div>
  );
}
