import { useState, useCallback, useEffect } from 'react';
import { GROUPS, GROUP_LETTERS } from '../data/tournamentData.js';
import { deriveWildcards } from '../utils/bracket.js';
import { generateSlug } from '../data/slugWords.js';

const STORAGE_KEY = 'goalbracket_draft';

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
    const draft = loadDraft();
    return draft?.slug ?? generateSlug();
  });

  const readOnly = Boolean(initialData);

  // Persist draft whenever state changes
  useEffect(() => {
    if (!readOnly) {
      saveDraft({ groupPicks, wildcards, knockoutPicks, slug });
    }
  }, [groupPicks, wildcards, knockoutPicks, slug, readOnly]);

  // Re-derive wildcards when group picks change
  useEffect(() => {
    if (!readOnly) {
      setWildcards(deriveWildcards(groupPicks));
      // Clear knockout picks that are now invalid
      setKnockoutPicks({});
    }
  }, [groupPicks, readOnly]);

  const pickGroupTeam = useCallback((groupLetter, teamCode) => {
    if (readOnly) return;
    setGroupPicks(prev => {
      const current = prev[groupLetter] ?? [];
      const groupTeams = GROUPS[groupLetter].teams;

      if (current.includes(teamCode)) {
        // Deselect – remove from picks
        return { ...prev, [groupLetter]: current.filter(t => t !== teamCode) };
      }

      if (current.length < 2) {
        // Add to picks
        return { ...prev, [groupLetter]: [...current, teamCode] };
      }

      // Already have 2 picked – replace the second with new pick
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
      // If re-clicking the current winner, deselect
      if (prev[matchId] === teamCode) {
        return { ...prev, [matchId]: null };
      }
      return { ...prev, [matchId]: teamCode };
    });
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
    resetBracket,
    exportBracket,
  };
}
