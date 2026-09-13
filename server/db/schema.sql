-- PortSide database schema (Cloudflare D1 / SQLite dialect)
-- Every table that holds content is scoped to a region from the start,
-- so opening a second town is a seeding job, not a rebuild.
--
-- D1 has no native boolean, timestamp, or JSON type - booleans are
-- INTEGER 0/1, timestamps are TEXT in ISO8601 (datetime('now') produces
-- this natively so it sorts and compares correctly as text), and JSON
-- columns are TEXT holding a JSON string. IDs use INTEGER PRIMARY KEY
-- AUTOINCREMENT, SQLite's equivalent of SERIAL.

CREATE TABLE regions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,          -- 'Southport'
    slug            TEXT UNIQUE NOT NULL,   -- 'southport'
    country         TEXT NOT NULL DEFAULT 'United Kingdom',
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'coming_soon', 'paused')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    region_id       INTEGER REFERENCES regions(id),
    -- platform-level admin, not a business role. Nobody can set this on
    -- themselves - there's no route for it. Grant it by hand for whoever
    -- should have moderation/admin-dashboard access:
    --   wrangler d1 execute portside --command "UPDATE users SET is_admin = 1 WHERE email = '...'"
    is_admin        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE businesses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    region_id       INTEGER NOT NULL REFERENCES regions(id),
    slug            TEXT NOT NULL,
    name            TEXT NOT NULL,
    category        TEXT,
    description     TEXT,
    logo_url        TEXT,
    cover_image_url TEXT,
    website_url     TEXT,
    address         TEXT,
    lat             REAL,
    lng             REAL,
    tier            TEXT NOT NULL DEFAULT 'free'
                        CHECK (tier IN ('free', 'founding', 'premium')),
    verified        INTEGER NOT NULL DEFAULT 0,
    -- admin moderation state - set from the admin dashboard, not by the
    -- business itself
    featured        INTEGER NOT NULL DEFAULT 0,
    suspended       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (region_id, slug)
);

-- allows more than one staff login per business
CREATE TABLE business_members (
    business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'owner'
                        CHECK (role IN ('owner', 'staff')),
    PRIMARY KEY (business_id, user_id)
);

CREATE TABLE posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    author_user_id  INTEGER NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    media_urls      TEXT NOT NULL DEFAULT '[]', -- JSON array, stored as text
    scope           TEXT NOT NULL DEFAULT 'local'
                        CHECK (scope IN ('local', 'national', 'international')),
    post_type       TEXT NOT NULL DEFAULT 'update'
                        CHECK (post_type IN ('update', 'offer', 'event', 'sponsored')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_posts_region_scope ON posts (business_id, scope, created_at DESC);

-- business-to-business referrals: the core "connects businesses" mechanic
CREATE TABLE referrals (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    from_business_id    INTEGER NOT NULL REFERENCES businesses(id),
    to_business_id      INTEGER NOT NULL REFERENCES businesses(id),
    referred_by_user_id INTEGER NOT NULL REFERENCES users(id),
    note                TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'declined')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (from_business_id <> to_business_id)
);
CREATE INDEX idx_referrals_to ON referrals (to_business_id, status);
CREATE INDEX idx_referrals_from ON referrals (from_business_id, status);

-- business-to-business DMs
CREATE TABLE conversations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    business_a_id   INTEGER NOT NULL REFERENCES businesses(id),
    business_b_id   INTEGER NOT NULL REFERENCES businesses(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (business_a_id, business_b_id),
    CHECK (business_a_id <> business_b_id)
);

CREATE TABLE messages (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id     INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_business_id  INTEGER NOT NULL REFERENCES businesses(id),
    sender_user_id      INTEGER NOT NULL REFERENCES users(id),
    content             TEXT NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    read_at             TEXT
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

-- monetisation: boosted posts / boosted directory & leaderboard placement
CREATE TABLE sponsorships (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id     INTEGER NOT NULL REFERENCES businesses(id),
    type            TEXT NOT NULL
                        CHECK (type IN ('boosted_post', 'boosted_listing', 'boosted_leaderboard')),
    post_id         INTEGER REFERENCES posts(id),
    starts_at       TEXT NOT NULL,
    ends_at         TEXT NOT NULL,
    amount_paid_gbp REAL NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sponsorships_post_active ON sponsorships (post_id, status, starts_at, ends_at);

-- premium business subscriptions (Stripe-backed) - parked: PortSide is free
-- for every business with no paid tier, so this table is currently unused.
-- Boosted posts (see sponsorships above) are the only paid feature. Left in
-- place rather than dropped in case a genuine premium tier gets reconsidered
-- later, but nothing should read or write to it right now.
CREATE TABLE subscriptions (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id             INTEGER NOT NULL UNIQUE REFERENCES businesses(id),
    tier                    TEXT NOT NULL DEFAULT 'free'
                                CHECK (tier IN ('free', 'premium')),
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    status                  TEXT NOT NULL DEFAULT 'inactive'
                                CHECK (status IN ('inactive', 'active', 'past_due', 'cancelled')),
    current_period_end      TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

-- leaderboard is computed, not stored as source of truth; this view drives it
-- for v1. Swap for a scheduled-write summary table once traffic makes the
-- live query slow - D1 has no materialized views.
CREATE VIEW leaderboard_monthly AS
SELECT
    b.id AS business_id,
    b.region_id,
    b.name,
    b.slug,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > datetime('now', '-30 days')) AS posts_last_30d,
    COUNT(DISTINCT r_out.id) FILTER (WHERE r_out.created_at > datetime('now', '-30 days')) AS referrals_given_30d,
    COUNT(DISTINCT r_in.id) FILTER (WHERE r_in.created_at > datetime('now', '-30 days')) AS referrals_received_30d,
    (
        COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > datetime('now', '-30 days'))
        + COUNT(DISTINCT r_out.id) FILTER (WHERE r_out.created_at > datetime('now', '-30 days')) * 3
        + COUNT(DISTINCT r_in.id) FILTER (WHERE r_in.created_at > datetime('now', '-30 days')) * 2
    ) AS activity_score
FROM businesses b
LEFT JOIN posts p ON p.business_id = b.id
LEFT JOIN referrals r_out ON r_out.from_business_id = b.id AND r_out.status = 'completed'
LEFT JOIN referrals r_in ON r_in.to_business_id = b.id AND r_in.status = 'completed'
GROUP BY b.id;
