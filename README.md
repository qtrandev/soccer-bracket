# BracketWebb — 2026 FIFA World Cup Bracket

Pick your group-stage qualifiers, fill the knockout bracket, and share your predictions with a unique URL.

Live at **[bracketwebb.com](https://bracketwebb.com)**

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, Tailwind 3, react-router-dom 6 |
| Persistence | Netlify Blobs (shared brackets) + localStorage (draft) |
| Functions | Netlify Functions (save/load brackets) |
| Edge | Netlify Edge Functions (per-bracket OG preview injection) |
| Deploy | Netlify (auto-deploy from `main`) |

## Local development

```bash
npm install
netlify dev        # starts Vite + Netlify Functions + Edge Functions together
```

`netlify dev` is required (not just `npm run dev`) if you want bracket saving/loading and OG preview to work locally. It proxies the Vite dev server and runs the Netlify functions alongside it.

## Build

```bash
npm run build      # outputs to dist/
```

Netlify runs this automatically on every push to `main`.

## Project structure

```
src/
  components/     # BracketMatch, GroupCard, GroupStage, KnockoutBracket, ShareModal, …
  data/           # tournamentData.js (48 teams, groups, fixture schedule)
                  # teamStrengths.js  (autofill ratings)
                  # reservedSlugs.js  (shared between frontend + save function)
  hooks/          # useBracket.js     (all bracket state + localStorage persistence)
  pages/          # Home, CreateBracket, ViewBracket
  utils/          # bracket.js (slot resolution, wildcard logic)
                  # autofill.js (strategy-based bracket filling)
netlify/
  functions/      # save-bracket.js, get-bracket.js  (Netlify Functions / Node)
  edge-functions/ # bracket-og.js  (injects per-bracket OG tags for social crawlers)
public/           # ball.svg, og.png, apple-touch-icon.png, robots.txt, sitemap.xml
```

## Bracket sharing

1. User fills their bracket at `/new`
2. "Save & Share" stores the bracket in Netlify Blobs under a user-chosen slug
3. Anyone with the link (`bracketwebb.com/my-slug`) can view the bracket (read-only)
4. The edge function intercepts slug routes for social crawlers and injects a per-bracket `og:title` / `og:description` so shared links preview correctly in iMessage, WhatsApp, X, Discord, etc.
5. "Make Mine" copies a viewed bracket into the viewer's own draft for editing

## Tournament data

All 48 teams, 12 groups, and fixture dates are in [`src/data/tournamentData.js`](src/data/tournamentData.js). The six playoff slot-ins that qualified on March 31, 2026 (Czechia, Bosnia & Herz., Türkiye, Sweden, Iraq, DR Congo) are already reflected.
