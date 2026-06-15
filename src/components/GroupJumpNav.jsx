export default function GroupJumpNav({ offset = null, upcomingOffset = 80 }) {
  const scrollToGroup = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (offset !== null) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToUpcoming = () => {
    const el = document.getElementById('upcoming-games');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - upcomingOffset, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-pitch-950/95 backdrop-blur border-b border-emerald-900/30 flex items-center gap-1.5 flex-wrap mb-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mr-1">Group</span>
      {['A','B','C','D','E','F','G','H','I','J','K','L'].map(l => (
        <button
          key={l}
          onClick={() => scrollToGroup(`group-${l}`)}
          className="w-7 h-7 rounded-md border border-emerald-800/50 bg-emerald-900/30 text-emerald-400 text-xs font-black hover:border-grass-500/60 hover:text-grass-400 hover:bg-grass-500/10 transition-all"
        >
          {l}
        </button>
      ))}
      <button
        onClick={scrollToUpcoming}
        className="px-2.5 h-7 rounded-md border border-emerald-800/50 bg-emerald-900/30 text-emerald-400 text-[10px] font-black uppercase tracking-wide hover:border-grass-500/60 hover:text-grass-400 hover:bg-grass-500/10 transition-all whitespace-nowrap"
      >
        📅 Upcoming
      </button>
    </div>
  );
}
