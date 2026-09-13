# PortSide

Southport's business network. Businesses get a profile, post updates, refer
customers to each other, DM each other directly, and see how they rank
against other members on the leaderboard.

Built multi-town from day one: every business, post and leaderboard row is
scoped to a `region` in the data model, even though only Southport is seeded
at launch. Opening a second town later is a seeding job, not a rebuild.

## Structure

```
backend/    Express + PostgreSQL API
frontend/   React (Vite) app, full PortSide design system applied
```

## Design system

Applied per the PortSide brand brief:

- **Colour** — PortSide Ink `#101418`, Sand `#F3F0E8`, Secondary Sand
  `#D9D3C7`, Muted `#747B7F`, Signal Yellow `#E7A928`, Deep Harbour Blue
  `#24566A`. Tokens live in `frontend/src/styles/tokens.css`. Yellow is used
  sparingly, only for activity/status/signal moments, not as a background
  colour.
- **Type** — Sora (display) + IBM Plex Sans (UI/body), loaded via Google
  Fonts in `index.html`.
- **Motif** — the directional arrow (`ArrowIcon`), the node network
  (`NetworkGraph`), and the referral connection line (`Connection`) recur
  across every screen rather than decorative illustration.
- **Language** — navigation-style metadata labels (`StatusLabel`, e.g.
  `NETWORK / 128`), scope tags (LOCAL/NATIONAL/INTERNATIONAL), and
  Sandgrounder as a status badge, not a slogan.
- All 12 screens from the brief are built: landing, directory, business
  profile, feed, individual post, network/referrals, DMs, leaderboard,
  dashboard, membership, search, and responsive nav (desktop nav + mobile
  hamburger panel + mobile bottom tab bar).

### What's a placeholder, not a finished asset

The map/grid textures and coordinate motifs are built as CSS/SVG
approximations (`tex-line-grid`, `CornerMarks`) rather than the real
Southport-derived cartography described in the brief. The signal mark and
Sandgrounder mark are original SVGs in the same spirit as the reference
sheet, not a trace of it. Swap these for real designed assets
(actual Southport map data, the paper/navigation chart texture, real
photography) when they're ready — the components that use them
(`SignalMark.jsx`, `SandgrounderMark.jsx`, the `tex-*` classes in
`global.css`) are the places to drop them in.

All 12 screens currently run on static placeholder data
(`frontend/src/data/placeholderData.js`), using real Sidedoor Digital client
names (Candymonium, WATAG, Digz N' Lidz, Rubies & Pearls, Joyce's Irish
Whiskey) plus a few invented Southport independents, per the brief's
instruction to avoid lorem ipsum. Swap for the live API
(`frontend/src/api/client.js`) once ready.

## Core features (v1 scope)

- Business profiles and directory
- Community feed, posts scoped local / national / international
- Business-to-business referral tracking
- Business-to-business direct messages
- Monthly leaderboard (posts, referrals given/received, computed via the
  `leaderboard_monthly` view in schema.sql)
- Monetisation hooks: `sponsorships` (boosted posts/listings/leaderboard)
  and `subscriptions` (Stripe-backed premium tier), founding-member pricing
  represented in the Membership screen

## Not built yet, on purpose

- Stripe wiring for `subscriptions` and `sponsorships` (tables and UI exist,
  payment logic doesn't yet)
- Image/video upload pipeline - `posts.media_urls` and business
  `logo_url`/`cover_image_url` currently just store URLs, no upload endpoint
- Admin/moderation tooling for the region
- Wiring the 12 screens to the live API instead of placeholder data

## Local setup

Backend:
```
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate     # runs schema.sql against DATABASE_URL
npm run dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

The frontend runs standalone on placeholder data without the backend
running - useful for design review.

## Deployment

Same pattern as the rest of Sidedoor Digital's stack: source of truth is
GitHub (`theprovisionrooms` org), frontend deploys via Cloudflare Pages or
Netlify linked to the repo, backend + Postgres need a Node host (Render is
the existing pattern from Growing with Chaos).
