import { useState, useCallback, useEffect, useRef } from 'react';
import { GROUPS, GROUP_LETTERS } from '../data/tournamentData.js';
import { deriveWildcards } from '../utils/bracket.js';
import { autofillBracket } from '../utils/autofill.js';
import { generateSlug } from '../data/slugWords.js';

const STORAGE_KEY = 'bracketwebb_draft';
const DRAFT_VERSION = 2;

function defaultGroupPicks() {
  const picks = {};
  GROUP_LETTERS.forEach(l => { picks[l] = []; });
  return picks;
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    // v1 used old fabricated match IDs — keep group picks, re-simulate knockout
    if (draft.version !== DRAFT_VERSION) {
      const savedGroupPicks = draft.groupPicks ?? defaultGroupPicks();
      const oldChampion = draft.knockoutPicks?.final ?? null;
      const { wildcards, knockoutPicks } = autofillBracket('favorites', oldChampion, savedGroupPicks);
      return { groupPicks: savedGroupPicks, wildcards, knockoutPicks };
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useBracket(initialData = null) {
  const [groupPicks, setGroupPicks] = useState(() => {
    if (initialData) return initialData.groupPicks ?? defaultGroupPicks();
    const draft = loadDraft();
    return draft?.groupPicks ?? defaultGroupPicks();
  });

  const [wildcards, setWildcards] = useState(() => {
    if (initialData) return initialData.wildcards ?? [];
    const draft = loadDraft();
    return draft?.wildcards ?? [];
  });

  const [knockoutPicks, setKnockoutPicks] = useState(() => {
    if (initialData) return initialData.knockoutPicks ?? {};
    const draft = loadDraft();
    return draft?.knockoutPicks ?? {};
  });

  const [slug, setSlug] = useState(() => {
    if (initialData) return initialData.slug ?? generateSlug();
    return generateSlug(); // always fresh — don't load from draft
  });

  const readOnly = Boolean(initialData);

  // When autofilling, we batch-set all state at once and don't want the
  // groupPicks effect to wipe out the knockout picks we just computed.
  const skipKnockoutClear = useRef(false);
  // Track the previous groupPicks reference to detect real changes vs. initial
  // mount re-runs (React Strict Mode fires effects twice on mount).
  const prevGroupPicks = useRef(groupPicks);

  // Persist draft
  useEffect(() => {
    if (!readOnly) {
      saveDraft({ version: DRAFT_VERSION, groupPicks, wildcards, knockoutPicks, slug });
    }
  }, [groupPicks, wildcards, knockoutPicks, slug, readOnly]);

  // Re-derive wildcards and clear knockout picks when groups change manually
  useEffect(() => {
    if (!readOnly) {
      // Same reference = no real change (covers initial mount and Strict Mode re-runs)
      if (prevGroupPicks.current === groupPicks) return;
      prevGroupPicks.current = groupPicks;
      if (skipKnockoutClear.current) {
        skipKnockoutClear.current = false;
        return;
      }
      setWildcards(deriveWildcards(groupPicks));
      setKnockoutPicks({});
    }
  }, [groupPicks, readOnly]);

  const pickGroupTeam = useCallback((groupLetter, teamCode) => {
    if (readOnly) return;
    setGroupPicks(prev => {
      const current = prev[groupLetter] ?? [];

      if (current.includes(teamCode)) {
        return { ...prev, [groupLetter]: current.filter(t => t !== teamCode) };
      }
      if (current.length < 2) {
        return { ...prev, [groupLetter]: [...current, teamCode] };
      }
      return { ...prev, [groupLetter]: [current[0], teamCode] };
    });
  }, [readOnly]);

  const setGroupOrder = useCallback((groupLetter, orderedTeams) => {
    if (readOnly) return;
    setGroupPicks(prev => ({ ...prev, [groupLetter]: orderedTeams }));
  }, [readOnly]);

  const setWildcardOrder = useCallback((orderedCodes) => {
    if (readOnly) return;
    setWildcards(orderedCodes);
  }, [readOnly]);

  const pickKnockoutWinner = useCallback((matchId, teamCode) => {
    if (readOnly) return;
    setKnockoutPicks(prev => {
      if (prev[matchId] === teamCode) return { ...prev, [matchId]: null };
      return { ...prev, [matchId]: teamCode };
    });
  }, [readOnly]);

  // Bulk-apply a full autofill result without triggering the knockout clear effect
  const applyAutofill = useCallback(({ groupPicks: gp, wildcards: wc, knockoutPicks: kp }) => {
    if (readOnly) return;
    skipKnockoutClear.current = true;
    setGroupPicks(gp);
    setWildcards(wc);
    setKnockoutPicks(kp);
  }, [readOnly]);

  const resetBracket = useCallback(() => {
    if (readOnly) return;
    setGroupPicks(defaultGroupPicks());
    setWildcards([]);
    setKnockoutPicks({});
    setSlug(generateSlug());
    localStorage.removeItem(STORAGE_KEY);
  }, [readOnly]);

  const exportBracket = useCallback(() => ({
    version: DRAFT_VERSION,
    slug,
    createdAt: new Date().toISOString(),
    groupPicks,
    wildcards,
    knockoutPicks,
  }), [slug, groupPicks, wildcards, knockoutPicks]);

  return {
    groupPicks,
    wildcards,
    knockoutPicks,
    slug,
    readOnly,
    pickGroupTeam,
    setGroupOrder,
    setWildcardOrder,
    pickKnockoutWinner,
    applyAutofill,
    resetBracket,
    exportBracket,
  };
}
