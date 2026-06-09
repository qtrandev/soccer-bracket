import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBracket } from '../hooks/useBracket.js';
import GroupStage from '../components/GroupStage.jsx';
import KnockoutBracket from '../components/KnockoutBracket.jsx';
import TeamFlag from '../components/TeamFlag.jsx';

export default function ViewBracket() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bracketData, setBracketData] = useState(null);
  const [tab, setTab] = useState('knockout');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/get-bracket?slug=${encodeURIComponent(slug)}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setBracketData(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const bracket = useBracket(bracketData);

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
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

  const champion = bracketData?.knockoutPicks?.final;
  const createdAt = bracketData?.createdAt
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
              <span className="text-sm text-gold-400 font-semibold">to win it all</span>
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
          <Link
            to="/new"
            className="px-4 py-2 rounded-lg bg-grass-500 text-pitch-950 font-bold text-sm hover:bg-grass-400 transition-colors"
          >
            Make Mine
          </Link>
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
        <GroupStage groupPicks={bracket.groupPicks} onPick={() => {}} readOnly />
      )}

      {tab === 'knockout' && (
        <KnockoutBracket
          groupPicks={bracket.groupPicks}
          wildcards={bracket.wildcards}
          knockoutPicks={bracket.knockoutPicks}
          onPick={() => {}}
          readOnly
        />
      )}
    </div>
  );
}
