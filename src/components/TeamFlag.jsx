import { TEAMS } from '../data/tournamentData.js';

export default function TeamFlag({ code, size = 'sm', showName = true, showCode = false, className = '' }) {
  if (!code) return null;
  const team = TEAMS[code];
  if (!team) return <span className="text-emerald-700 italic text-xs">{code}</span>;

  const sizes = {
    xs: { flag: 16, text: 'text-xs' },
    sm: { flag: 20, text: 'text-sm' },
    md: { flag: 24, text: 'text-base' },
    lg: { flag: 32, text: 'text-lg' },
  };

  const { flag: flagSize, text: textSize } = sizes[size] ?? sizes.sm;
  const w = Math.round(flagSize * 1.5);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <img
        src={`https://flagcdn.com/${team.iso2}.svg`}
        alt={team.name}
        width={w}
        height={flagSize}
        className="rounded-sm object-cover flex-shrink-0 ring-1 ring-black/10"
        style={{ width: w, height: flagSize }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      {showName && (
        <span className={`${textSize} font-medium leading-none truncate`}>{team.name}</span>
      )}
      {showCode && (
        <span className="text-[10px] font-bold text-emerald-700 flex-shrink-0">{code}</span>
      )}
    </span>
  );
}
