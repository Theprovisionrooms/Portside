-- One-off migration for the remote D1 database that already exists (schema.sql
-- itself has also been updated so a brand new install gets all of this from
-- scratch - this file is only for catching the live DB up to match).
--
-- Run once with:
--   npx.cmd wrangler d1 execute portside --remote --file=server/db/migrations/0002_freelance_and_media.sql

ALTER TABLE businesses ADD COLUMN type TEXT NOT NULL DEFAULT 'business'
    CHECK (type IN ('business', 'freelance'));

CREATE TABLE business_media (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    media_type      TEXT NOT NULL DEFAULT 'image'
                        CHECK (media_type IN ('image', 'video')),
    url             TEXT NOT NULL,
    caption         TEXT,
    position        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_business_media_business ON business_media (business_id, position);

INSERT INTO regions (name, slug) VALUES ('Southport', 'southport');
