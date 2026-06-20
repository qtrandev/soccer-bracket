import { useState, useEffect } from 'react';

export function useStandings() {
  const [standings, setStandings] = useState({});
  useEffect(() => {
    fetch('/.netlify/functions/standings')
      .then(r => r.ok ? r.json() : {})
      .then(setStandings)
      .catch(() => {});
  }, []);
  return standings;
}
