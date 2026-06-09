import { useState } from 'react';
import GroupStage from '../components/GroupStage.jsx';
import KnockoutBracket from '../components/KnockoutBracket.jsx';
import ShareModal from '../components/ShareModal.jsx';
import { useBracket } from '../hooks/useBracket.js';
import { countCompletedGroups } from '../utils/bracket.js';

const STEPS = [
  { id: 'groups', label: 'Group Stage' },
  { id: 'knockout', label: 'Knockout' },
];

export default function CreateBracket() {
  const {
    groupPicks, wildcards, knockoutPicks, slug,
    pickGroupTeam, pickKnockoutWinner, resetBracket, exportBracket,
  } = useBracket();

  const [step, setStep] = useState('groups');
  const [showShare, setShowShare] = useState(false);
  const [savedSlug, setSavedSlug] = useState(null);

  const completedGroups = countCompletedGroups(groupPicks);
  const canProceed = completedGroups >= 12;
  const hasChampion = Boolean(knockoutPicks?.final);

  async function handleSave(chosenSlug) {
    const data = exportBracket();
    data.slug = chosenSlug;

    try {
      const res = await fetch('/api/save-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: chosenSlug, bracket: data }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: json.error ?? 'save_failed' };
      }
      setSavedSlug(chosenSlug);
      return { ok: true };
    } catch {
      return { error: 'network_error' };
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Step header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                if (s.id === 'knockout' && !canProceed) return;
                setStep(s.id);
              }}
              className={`flex items-center gap-2 transition-colors ${
                step === s.id ? 'text-emerald-100' : 'text-emerald-600 hover:text-emerald-400'
              }`}
            >
              <span
                className={`step-dot text-sm ${
                  step === s.id ? 'active' : completedGroups >= 12 && s.id === 'knockout' ? 'done' : 'pending'
                }`}
              >
                {i + 1}
              </span>
              <span className="font-semibold hidden sm:inline">{s.label}</span>
            </button>
          ))}
          {STEPS.map((s, i) => i < STEPS.length - 1 && (
            <div key={`sep-${i}`} className="w-12 h-px bg-emerald-900/60" />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (window.confirm('Reset your entire bracket?')) resetBracket(); }}
            className="text-xs text-emerald-700 hover:text-red-400 transition-colors px-2 py-1"
          >
            Reset
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="px-4 py-2 rounded-lg bg-grass-500 text-pitch-950 font-bold text-sm hover:bg-grass-400 transition-colors"
          >
            💾 Save & Share
          </button>
        </div>
      </div>

      {/* Step content */}
      {step === 'groups' && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-emerald-100">Group Stage Picks</h1>
            <p className="text-emerald-500 text-sm mt-1">
              Select the top 2 teams that advance from each group.
            </p>
          </div>
          <GroupStage groupPicks={groupPicks} onPick={pickGroupTeam} readOnly={false} />
          {canProceed && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setStep('knockout')}
                className="px-8 py-3 rounded-xl bg-grass-500 text-pitch-950 font-black text-base hover:bg-grass-400 transition-all hover:scale-105"
              >
                Next: Knockout Bracket →
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'knockout' && (
        <div>
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-emerald-100">Knockout Bracket</h1>
              <p className="text-emerald-500 text-sm mt-1">
                Click a team in each match to advance them.
              </p>
            </div>
            {hasChampion && (
              <button
                onClick={() => setShowShare(true)}
                className="px-6 py-2.5 rounded-xl bg-gold-500 text-pitch-950 font-black text-sm hover:bg-gold-400 transition-all"
              >
                🏆 Save & Share Bracket
              </button>
            )}
          </div>
          <KnockoutBracket
            groupPicks={groupPicks}
            wildcards={wildcards}
            knockoutPicks={knockoutPicks}
            onPick={pickKnockoutWinner}
            readOnly={false}
          />
        </div>
      )}

      {showShare && (
        <ShareModal
          slug={slug}
          setSlug={() => {}}
          onSave={handleSave}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
