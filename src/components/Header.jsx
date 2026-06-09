import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/40 bg-pitch-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl select-none">⚽</span>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-emerald-100">Bracket</span><span className="text-grass-400">Webb</span>
          </span>
          <span className="text-xs text-emerald-700 font-medium hidden sm:inline">
            2026 World Cup
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {!isHome && (
            <Link
              to="/"
              className="text-sm text-emerald-400 hover:text-grass-400 transition-colors px-3 py-1.5"
            >
              ← Home
            </Link>
          )}
          <Link
            to="/new"
            className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-grass-500 text-pitch-950 hover:bg-grass-400 transition-colors"
          >
            My Bracket
          </Link>
        </nav>
      </div>
    </header>
  );
}
