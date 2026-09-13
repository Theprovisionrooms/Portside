-- PortSide database schema
-- Every table that holds content is scoped to a region from the start,
-- so opening a second town is a seeding job, not a rebuild.

CREATE TABLE regions (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,          -- 'Southport'
    slug            VARCHAR(100) UNIQUE NOT NULL,    -- 'southport'
    country         VARCHAR(100) NOT NULL DEFAULT 'United Kingdom',
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'coming_soon', 'paused')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    region_id       INTEGER REFERENCES regions(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE businesses (
    id              SERIAL PRIMARY KEY,
    region_id       INTEGER NOT NULL REFERENCES regions(id),
    slug            VARCHAR(150) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(100),
    description     TEXT,
    logo_url        TEXT,
    cover_image_url TEXT,
    website_url     TEXT,
    address         VARCHAR(255),
    lat             NUMERIC(9,6),
    lng             NUMERIC(9,6),
    tier            VARCHAR(20) NOT NULL DEFAULT 'free'
                        CHECK (tier IN ('free', 'founding', 'premium')),
    verified        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (region_id, slug)
);

-- allows more than one staff login per business
CREATE TABLE business_members (
    business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'owner'
                        CHECK (role IN ('owner', 'staff')),
    PRIMARY KEY (business_id, user_id)
);

CREATE TABLE posts (
    id              SERIAL PRIMARY KEY,
    business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    author_user_id  INTEGER NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    media_urls      JSONB NOT NULL DEFAULT '[]',
    scope           VARCHAR(20) NOT NULL DEFAULT 'local'
                        CHECK (scope IN ('local', 'national', 'international')),
    post_type       VARCHAR(20) NOT NULL DEFAULT 'update'
                        CHECK (post_type IN ('update', 'offer', 'event', 'sponsored')),
    is_sponsored    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_region_scope ON posts (business_id, scope, created_at DESC);

-- business-to-business referrals: the core "connects businesses" mechanic
CREATE TABLE referrals (
    id                  SERIAL PRIMARY KEY,
    from_business_id    INTEGER NOT NULL REFERENCES businesses(id),
    to_business_id      INTEGER NOT NULL REFERENCES businesses(id),
    referred_by_user_id INTEGER NOT NULL REFERENCES users(id),
    note                TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'declined')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_business_id <> to_business_id)
);
CREATE INDEX idx_referrals_to ON referrals (to_business_id, status);
CREATE INDEX idx_referrals_from ON referrals (from_business_id, status);

-- business-to-business DMs
CREATE TABLE conversations (
    id              SERIAL PRIMARY KEY,
    business_a_id   INTEGER NOT NULL REFERENCES businesses(id),
    business_b_id   INTEGER NOT NULL REFERENCES businesses(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_a_id, business_b_id),
    CHECK (business_a_id <> business_b_id)
);

CREATE TABLE messages (
    id                  SERIAL PRIMARY KEY,
    conversation_id     INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_business_id  INTEGER NOT NULL REFERENCES businesses(id),
    sender_user_id      INTEGER NOT NULL REFERENCES users(id),
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at             TIMESTAMPTZ
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

-- monetisation: boosted posts / boosted directory & leaderboard placement
CREATE TABLE sponsorships (
    id              SERIAL PRIMARY KEY,
    business_id     INTEGER NOT NULL REFERENCES businesses(id),
    type            VARCHAR(30) NOT NULL
                        CHECK (type IN ('boosted_post', 'boosted_listing', 'boosted_leaderboard')),
    post_id         INTEGER REFERENCES posts(id),
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    amount_paid_gbp NUMERIC(8,2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- premium business subscriptions (Stripe-backed)
CREATE TABLE subscriptions (
    id                      SERIAL PRIMARY KEY,
    business_id             INTEGER NOT NULL UNIQUE REFERENCES businesses(id),
    tier                    VARCHAR(20) NOT NULL DEFAULT 'free'
                                CHECK (tier IN ('free', 'premium')),
    stripe_customer_id      VARCHAR(255),
    stripe_subscription_id  VARCHAR(255),
    status                  VARCHAR(20) NOT NULL DEFAULT 'inactive'
                                CHECK (status IN ('inactive', 'active', 'past_due', 'cancelled')),
    current_period_end      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- leaderboard is computed, not stored as source of truth; this view drives it for v1.
-- swap for a materialized view + scheduled refresh once traffic makes the live query slow.
CREATE VIEW leaderboard_monthly AS
SELECT
    b.id AS business_id,
    b.region_id,
    b.name,
    b.slug,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > now() - interval '30 days') AS posts_last_30d,
    COUNT(DISTINCT r_out.id) FILTER (WHERE r_out.created_at > now() - interval '30 days') AS referrals_given_30d,
    COUNT(DISTINCT r_in.id) FILTER (WHERE r_in.created_at > now() - interval '30 days') AS referrals_received_30d,
    (
        COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > now() - interval '30 days')
        + COUNT(DISTINCT r_out.id) FILTER (WHERE r_out.created_at > now() - interval '30 days') * 3
        + COUNT(DISTINCT r_in.id) FILTER (WHERE r_in.created_at > now() - interval '30 days') * 2
    ) AS activity_score
FROM businesses b
LEFT JOIN posts p ON p.business_id = b.id
LEFT JOIN referrals r_out ON r_out.from_business_id = b.id AND r_out.status = 'completed'
LEFT JOIN referrals r_in ON r_in.to_business_id = b.id AND r_in.status = 'completed'
GROUP BY b.id;
