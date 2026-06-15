import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GroupStage from '../components/GroupStage.jsx';
import KnockoutBracket from '../components/KnockoutBracket.jsx';
import ThirdPlaceSelector from '../components/ThirdPlaceSelector.jsx';
import ShareModal from '../components/ShareModal.jsx';
import AutofillPanel from '../components/AutofillPanel.jsx';
import { useBracket } from '../hooks/useBracket.js';
import { autofillBracket, STRATEGIES } from '../utils/autofill.js';
import { countCompletedGroups, getThirdPlaceCandidates, groupOfTeam } from '../utils/bracket.js';
import { FINAL_MATCH } from '../data/tournamentData.js';
import UpcomingMatches from '../components/UpcomingMatches.jsx';

const STEPS = [
  { id: 'groups', label: 'Group Stage' },
  { id: 'knockout', label: 'Knockout' },
];

export default function CreateBracket() {
  const location = useLocation();
  const {
    groupPicks, wildcards, knockoutPicks, slug,
    pickGroupTeam, toggleWildcard, pickKnockoutWinner, applyAutofill, resetBracket, exportBracket,
  } = useBracket();

  const [step, setStep] = useState(() => location.state?.makeMine ? 'knockout' : 'groups');

  // Apply "Make Mine" data passed via router state (reliable even if localStorage failed)
  useEffect(() => {
    window.scrollTo(0, 0);
    const draft = location.state?.makeMine;
    if (draft) applyAutofill(draft);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [showShare, setShowShare] = useState(false);
  const [appliedStrategy, setAppliedStrategy] = useState(null);
  const [autofillFlash, setAutofillFlash] = useState(false);

  const completedGroups = countCompletedGroups(groupPicks);
  const allGroupsDone = completedGroups >= 12;
  const canProceed = allGroupsDone && wildcards.length === 8 && new Set(wildcards.map(groupOfTeam)).size === 8;
  const hasChampion = Boolean(knockoutPicks?.[FINAL_MATCH.id]);

  function handleAutofill(strategyId) {
    const result = autofillBracket(strategyId);
    applyAutofill(result);
    setAppliedStrategy(strategyId);
    setAutofillFlash(true);
    setTimeout(() => setAutofillFlash(false), 1800);
    // Jump to knockout tab so they can see the result
    setStep('knockout');
  }

  async function handleSave(chosenSlug) {
    const data = exportBracket();
    data.slug = chosenSlug;
    try {
      const res = await fetch('/.netlify/functions/save-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: chosenSlug, bracket: data }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'save_failed' };
      // Pre-warm OG images so they're generated before the first share link is opened
      const encoded = encodeURIComponent(chosenSlug);
      fetch(`/og-rect?slug=${encoded}`).catch(() => {});
      fetch(`/og-square?slug=${encoded}`).catch(() => {});
      return { ok: true };
    } catch {
      return { error: 'network_error' };
    }
  }

  const strategy = STRATEGIES.find(s => s.id === appliedStrategy);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Autofill flash banner */}
      {autofillFlash && strategy && (
        <div className={`mb-4 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-in ${strategy.color}`}>
          <span className="mr-2">{strategy.icon}</span>
          <span className={strategy.accent}>{strategy.label}</span>
          <span className="text-emerald-400"> applied — bracket filled! Tweak anything below.</span>
        </div>
      )}

      {/* Step header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
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
                  step === s.id ? 'active' : (canProceed && s.id === 'knockout') ? 'done' : 'pending'
                }`}
              >
                {i + 1}
              </span>
              <span className="font-semibold hidden sm:inline">{s.label}</span>
            </button>
          ))}
          <div className="w-10 h-px bg-emerald-900/60" />
        </div>

        <div className="flex items-center gap-2">
          {/* ── Auto-fill button ── */}
          <AutofillPanel onAutofill={handleAutofill} applied={appliedStrategy} />

          <span className="text-xs text-emerald-800">✓ Auto-saved</span>
          <button
            onClick={() => { if (window.confirm('Reset your entire bracket?')) { resetBracket(); setAppliedStrategy(null); setStep('groups'); } }}
            className="text-xs text-emerald-700 hover:text-red-400 transition-colors px-2 py-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Group stage ── */}
      {step === 'groups' && (
        <div>
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-emerald-100">Group Stage Picks</h1>
              <p className="text-emerald-500 text-sm mt-1">
                Select the top 2 teams that advance from each group — or use ⚡ Auto-fill above.
              </p>
            </div>
          </div>

          {/* Prominent autofill prompt when nothing picked yet */}
          {completedGroups === 0 && (
            <div className="mb-6 p-5 rounded-xl border border-dashed border-emerald-800 bg-pitch-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-emerald-200 text-sm">Not sure where to start?</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Use ⚡ Auto-fill to instantly populate your whole bracket, then adjust as you like.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {STRATEGIES.slice(0, 3).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleAutofill(s.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${s.color} ${s.accent}`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <GroupStage groupPicks={groupPicks} onPick={pickGroupTeam} readOnly={false} />

          {allGroupsDone && (
            <ThirdPlaceSelector
              candidates={getThirdPlaceCandidates(groupPicks)}
              wildcards={wildcards}
              onToggle={toggleWildcard}
              readOnly={false}
            />
          )}

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

      {/* ── Knockout bracket ── */}
      {step === 'knockout' && (
        <div>
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-emerald-100">Knockout Bracket</h1>
              <p className="text-emerald-500 text-sm mt-1">
                Click a team in each match to advance them.
                {appliedStrategy && (
                  <span className={`ml-2 text-xs ${strategy?.accent}`}>
                    {strategy?.icon} Filled with {strategy?.label}
                  </span>
                )}
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

      <div className="mt-10 -mx-4">
        <UpcomingMatches dark />
      </div>

      {showShare && (
        <ShareModal
          slug={slug}
          setSlug={() => {}}
          onSave={handleSave}
          onClose={() => setShowShare(false)}
          champion={knockoutPicks?.[FINAL_MATCH.id] ?? null}
        />
      )}
    </div>
  );
}
