import { MAX_STRENGTH } from '../data/teamStrengths.js';

// Each star is its own inline-block so the % clip is relative to one character width — reliable across all browsers.
export default function StrengthStars({ strength, className = '' }) {
  // Scale so the top-rated team (France, 93) always shows 5 full stars
  const pct = Math.min(100, Math.max(0, ((strength ?? 50) / MAX_STRENGTH) * 100));
  const fills = [0, 20, 40, 60, 80].map(base => Math.min(1, Math.max(0, (pct - base) / 20)));

  return (
    <span className={`inline-flex leading-none select-none ${className}`} style={{ gap: 1 }}>
      {fills.map((fill, i) => (
        <span key={i} style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
          <span style={{ color: '#6b7280' }}>★</span>
          {fill > 0 && (
            <span style={{
              position: 'absolute', top: 0, left: 0,
              overflow: 'hidden', whiteSpace: 'nowrap',
              width: `${fill * 100}%`,
              color: '#facc15',
            }}>★</span>
          )}
        </span>
      ))}
    </span>
  );
}
