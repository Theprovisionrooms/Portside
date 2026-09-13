# PortSide

Southport's business network. Businesses get a profile, post updates, refer
customers to each other, DM each other directly, and see how they rank
against other members on the leaderboard.

Built multi-town from day one: every business, post and leaderboard row is
scoped to a `region` in the data model, even though only Southport is seeded
at launch. Opening a second town later is a seeding job, not a rebuild.

Free for every business, permanently - profile, posts, referrals, DMs,
leaderboard, all of it. The only paid feature is promoting a post
(`/membership`), £10/day, which nudges a post's ranking rather than pinning
it above everything else - see the comment at the top of
`server/routes/posts.js` for how that actually works.

## Structure

One Cloudflare Pages project - same pattern as WATAG, Digz N' Lidz, and
Rubies & Pearls. No separate frontend/backend deploys, no separate hosting
for an API server.

```
src/         React (Vite) frontend
server/      Hono API - the actual route logic, plain JS modules
functions/   Pages Functions - a single catch-all file that hands every
             /api/* request to the Hono app in server/. This is the only
             part Cloudflare's Functions routing scans; server/ is just
             normal imported code, not routes in its own right.
```

One `npm install`, one `package.json`, one build (`vite build` → `dist/`,
which Cloudflare Pages runs automatically on every push), one deploy.
`server/` and `functions/` don't get built - Pages Functions ship them
straight from source, same as everything else in this stack.

## Design system

Applied per the PortSide brand brief:

- **Colour** — PortSide Ink `#101418`, Sand `#F3F0E8`, Secondary Sand
  `#D9D3C7`, Muted `#747B7F`, Signal Yellow `#E7A928`, Deep Harbour Blue
  `#24566A`. Tokens live in `src/styles/tokens.css`. Yellow is used
  sparingly, only for activity/status/signal moments, not as a background
  colour.
- **Type** — Sora (display) + IBM Plex Sans (UI/body), loaded via Google
  Fonts in `index.html`.
- **Motif** — the directional arrow (`ArrowIcon`), the node network
  (`NetworkGraph`), and the referral connection line (`Connection`) recur
  across every screen rather than decorative illustration. `NetworkGraph` is
  canvas-based with depth-tiered nodes and travelling signal pulses standing
  in for referrals moving through the network.
- **Language** — navigation-style metadata labels (`StatusLabel`, e.g.
  `NETWORK / 128`), scope tags (LOCAL/NATIONAL/INTERNATIONAL), and
  Sandgrounder as a status badge, not a slogan.
- Touch targets are 44px minimum and form fields render at 16px to avoid
  iOS Safari's zoom-on-focus behaviour - see the touch ergonomics note in
  `src/styles/global.css`.

### What's a placeholder, not a finished asset

The map/grid textures and coordinate motifs are built as CSS/SVG
approximations (`tex-line-grid`, `CornerMarks`) rather than the real
Southport-derived cartography described in the brief. The signal mark and
Sandgrounder mark are original SVGs in the same spirit as the reference
sheet, not a trace of it.

## Core features (v1 scope) - all live against the real API

- Business profiles and directory, with a working create/edit flow
  (`/dashboard/edit-profile` doubles as both depending on whether the
  account has a business yet)
- Community feed, posts scoped local / national / international
- Business-to-business referral tracking, with a working "refer a customer"
  form
- Business-to-business direct messages
- Monthly leaderboard (posts, referrals given/received, computed via the
  `leaderboard_monthly` view in `server/db/schema.sql`)
- Promoted posts: flat £10/day via Stripe Checkout, ranking-nudge rather
  than pinned placement, capped so it can't cluster into a wall of ads
- Admin dashboard (`/admin`) gated by a real `is_admin` flag and a
  `requireAdmin` check on every admin route, not just a frontend redirect

## Not built yet, on purpose

- Image/video upload pipeline - `posts.media_urls` and business
  `logo_url`/`cover_image_url` currently just store URLs, no upload endpoint
- "Message business" on a profile page opens the general inbox rather than
  starting/selecting a conversation with that specific business - the
  backend already supports `POST /api/conversations` for this, it's just
  not wired to that button yet
- A real D1 database and Stripe keys for the live site - both work fully in
  local dev with no extra setup, but going live needs `wrangler d1 create`
  and `wrangler pages secret put` for the real values (see Deploying below)

## Local setup

No separate database to install - D1 runs locally as a plain file via
Wrangler.

```
npm install
npm run db:migrate:local   # loads schema.sql into a local D1 database
cp .dev.vars.example .dev.vars   # fill in JWT_SECRET; Stripe keys optional
npm run dev                 # runs Vite + the API together, http://localhost:8788
```

`npm run dev:vite` runs the frontend alone with no backend, if you just want
to iterate on a screen without needing the API up.

## Deploying

Source of truth is GitHub (`theprovisionrooms` org). Once the Cloudflare
Pages project is connected to the repo, every push to `main` builds
(`vite build`) and deploys automatically - frontend and API together, one
step, same as the rest of the stack.

One-time setup before the first deploy:
```
npx wrangler d1 create portside        # copy the database_id it prints...
# ...into wrangler.toml, replacing REPLACE_WITH_REAL_D1_DATABASE_ID
npm run db:migrate:remote              # loads schema.sql into the real D1 database
npx wrangler pages secret put JWT_SECRET
npx wrangler pages secret put STRIPE_SECRET_KEY       # optional, for boosted posts
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET   # optional, for boosted posts
```
