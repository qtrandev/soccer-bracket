import { useState, useCallback, useEffect, useRef } from 'react';
import { GROUPS, GROUP_LETTERS } from '../data/tournamentData.js';
import { deriveWildcards } from '../utils/bracket.js';
import { generateSlug } from '../data/slugWords.js';

const STORAGE_KEY = 'bracketwebb_draft';

function defaultGroupPicks() {
  const picks = {};
  GROUP_LETTERS.forEach(l => { picks[l] = []; });
  return picks;
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
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
  // Skip the effect on first mount — groupPicks was just loaded from
  // localStorage/initialData; treating it as a "change" would clear knockout picks.
  const isFirstMount = useRef(true);

  // Persist draft
  useEffect(() => {
    if (!readOnly) {
      saveDraft({ groupPicks, wildcards, knockoutPicks, slug });
    }
  }, [groupPicks, wildcards, knockoutPicks, slug, readOnly]);

  // Re-derive wildcards and clear knockout picks when groups change manually
  useEffect(() => {
    if (!readOnly) {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
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
    version: 1,
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
