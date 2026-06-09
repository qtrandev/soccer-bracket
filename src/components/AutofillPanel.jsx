import { useState } from 'react';
import { STRATEGIES } from '../utils/autofill.js';

export default function AutofillPanel({ onAutofill, applied }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(null);

  function handlePick(strategyId) {
    setChosen(strategyId);
    onAutofill(strategyId);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
          open
            ? 'border-grass-500/60 bg-grass-500/15 text-grass-300'
            : 'border-emerald-700/60 bg-pitch-800 text-emerald-300 hover:border-grass-500/50 hover:text-grass-400'
        }`}
      >
        <span>⚡</span>
        <span>Auto-fill</span>
        {chosen && !open && (
          <span className="text-xs text-emerald-600 font-normal hidden sm:inline">
            · {STRATEGIES.find(s => s.id === chosen)?.label}
          </span>
        )}
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown — viewport-fixed on mobile, right-aligned on sm+ */}
          <div className="z-50 rounded-xl border border-emerald-900/60 bg-pitch-800 shadow-2xl overflow-hidden animate-fade-in fixed right-2 top-36 w-[min(18rem,calc(100vw-1rem))] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-72">
            <div className="px-4 py-3 border-b border-emerald-900/40">
              <p className="text-sm font-bold text-emerald-100">Quick-fill your bracket</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Fills all groups and knockout rounds. You can edit after.
              </p>
            </div>

            <div className="p-2 space-y-1">
              {STRATEGIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => handlePick(s.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${s.color}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${s.accent}`}>{s.label}</p>
                    <p className="text-xs text-emerald-600 mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {chosen && (
              <div className="px-4 py-2.5 border-t border-emerald-900/40">
                <button
                  onClick={() => { handlePick(chosen); }}
                  className="w-full text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
                >
                  🎲 Re-roll "{STRATEGIES.find(s => s.id === chosen)?.label}" with new random picks
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
