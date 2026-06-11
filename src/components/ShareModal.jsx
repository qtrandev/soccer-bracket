import { useState } from 'react';
import { generateSlug } from '../data/slugWords.js';
import { RESERVED_SLUGS } from '../data/reservedSlugs.js';
import { TEAMS } from '../data/tournamentData.js';

export default function ShareModal({ onClose, onSave, slug, setSlug, champion = null }) {
  const [customSlug, setCustomSlug] = useState(slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const shareUrl = `${window.location.origin}/${customSlug}`;

  async function handleSave() {
    if (RESERVED_SLUGS.has(customSlug)) {
      setError('reserved');
      return;
    }
    if (!/^[a-z0-9-]{2,60}$/.test(customSlug)) {
      setError('invalid');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await onSave(customSlug);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setSlug(customSlug);
        try {
          const prev = JSON.parse(localStorage.getItem('bracketwebb_history') ?? '[]');
          const deduped = prev.filter(h => h.slug !== customSlug);
          deduped.unshift({ slug: customSlug, champion, mine: true, savedAt: new Date().toISOString() });
          localStorage.setItem('bracketwebb_history', JSON.stringify(deduped.slice(0, 20)));
        } catch {}
      }
    } catch (e) {
      setError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
  }

  function handleReroll() {
    setCustomSlug(generateSlug());
    setError('');
    setSaved(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-pitch-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative glass-card p-6 w-full max-w-md animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-emerald-600 hover:text-emerald-400 transition-colors text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-bold text-emerald-100 mb-1">Save & Share</h2>
        <p className="text-sm text-emerald-600 mb-1">
          Your bracket gets a unique soccer-themed link.
        </p>
        {/* Share preview — updates live as slug changes */}
        {(() => {
          const raw = customSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
          const owner = raw ? `${raw}'s` : 'Your';
          const team = champion ? TEAMS[champion] : null;
          const title = team
            ? `${owner} bracket · ${team.name} wins 🏆`
            : `${owner} 2026 World Cup bracket`;
          return (
            <div className="flex items-center gap-1.5 mb-6 text-sm text-emerald-400">
              {team && (
                <img src={`https://flagcdn.com/${team.iso2}.svg`} alt={team.name} className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
              )}
              <span className="truncate">{title}</span>
            </div>
          );
        })()}

        {/* Slug picker */}
        <label className="block text-xs text-emerald-500 mb-1.5 font-medium uppercase tracking-wider">
          Your bracket URL
        </label>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center rounded-lg border border-emerald-800/60 bg-pitch-900 overflow-hidden">
            <span className="px-3 py-2 text-xs text-emerald-700 border-r border-emerald-900/60 flex-shrink-0">
              /
            </span>
            <input
              type="text"
              enterKeyHint="go"
              onKeyDown={e => e.key === 'Enter' && !saving && !saved && customSlug && handleSave()}
              value={customSlug}
              onChange={e => {
                setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                setError('');
                setSaved(false);
              }}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-emerald-100 outline-none"
              placeholder="soccer-god"
              maxLength={60}
            />
          </div>
          <button
            onClick={handleReroll}
            title="Roll new slug"
            className="p-2 rounded-lg border border-emerald-800/60 text-emerald-500 hover:text-grass-400 hover:border-grass-500/50 transition-colors"
          >
            🎲
          </button>
        </div>

        <p className="text-xs text-emerald-700 mb-4">{shareUrl}</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/30 border border-red-500/30 text-sm text-red-400">
            {error === 'taken'
              ? '⚠ That name is taken — try the reroll button for a new one.'
              : error === 'reserved'
              ? '⚠ That name is reserved — pick something more creative!'
              : error === 'invalid'
              ? '⚠ Only letters, numbers, and hyphens allowed (2–60 chars).'
              : error}
          </div>
        )}

        {saved ? (
          <div className="space-y-3">
            <div className="px-3 py-2 rounded-lg bg-grass-500/15 border border-grass-500/40 text-sm text-grass-400 text-center">
              ✓ Bracket saved!
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-2.5 rounded-lg border border-emerald-700 text-sm text-emerald-300 hover:border-grass-500 hover:text-grass-400 transition-colors flex items-center justify-center gap-2"
            >
              📋 Copy share link
            </button>
            <a
              href={shareUrl}
              className="block w-full py-2.5 rounded-lg bg-grass-500 text-center text-sm font-bold text-pitch-950 hover:bg-grass-400 transition-colors"
            >
              View My Bracket →
            </a>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !customSlug}
            className="w-full py-3 rounded-lg bg-grass-500 text-pitch-950 font-bold text-sm hover:bg-grass-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⟳</span> Saving…
              </>
            ) : (
              '⚽ Save My Bracket'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
