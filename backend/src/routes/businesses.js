const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// GET /api/regions/:regionSlug/businesses - the directory, optional ?category=
router.get('/regions/:regionSlug/businesses', async (req, res) => {
    const { regionSlug } = req.params;
    const { category } = req.query;

    const result = await pool.query(
        `SELECT b.id, b.slug, b.name, b.category, b.description, b.logo_url, b.tier, b.verified,
                (
                    (SELECT COUNT(*) FROM referrals r WHERE r.from_business_id = b.id)
                    + (SELECT COUNT(*) FROM referrals r WHERE r.to_business_id = b.id)
                ) AS connections
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE r.slug = $1
           AND ($2::text IS NULL OR b.category = $2)
         ORDER BY (b.tier = 'founding') DESC, (b.tier = 'premium') DESC, b.name`,
        [regionSlug, category || null]
    );
    res.json(result.rows);
});

// GET /api/businesses/:slug - full profile
router.get('/businesses/:slug', async (req, res) => {
    const result = await pool.query(
        `SELECT b.*, r.slug AS region_slug, r.name AS region_name,
                (
                    (SELECT COUNT(*) FROM referrals ref WHERE ref.from_business_id = b.id)
                    + (SELECT COUNT(*) FROM referrals ref WHERE ref.to_business_id = b.id)
                ) AS connections
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE b.slug = $1`,
        [req.params.slug]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(result.rows[0]);
});

// GET /api/businesses/:slug/posts - a single business's own posts, most recent first
router.get('/businesses/:slug/posts', async (req, res) => {
    const result = await pool.query(
        `SELECT p.id, p.content, p.scope, p.post_type, p.created_at,
                (boost.id IS NOT NULL) AS is_boosted
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         LEFT JOIN LATERAL (
             SELECT s.id FROM sponsorships s
             WHERE s.post_id = p.id AND s.type = 'boosted_post' AND s.status = 'active'
               AND now() BETWEEN s.starts_at AND s.ends_at
             LIMIT 1
         ) boost ON true
         WHERE b.slug = $1
         ORDER BY p.created_at DESC
         LIMIT 50`,
        [req.params.slug]
    );
    res.json(result.rows);
});

// POST /api/businesses - create a profile, owner = logged-in user. slug is
// derived from name when not given, with a numeric suffix on collision.
router.post('/businesses', requireAuth, async (req, res) => {
    const { regionSlug, name, category, description, websiteUrl, address } = req.body;
    let { slug } = req.body;

    if (!regionSlug || !name) {
        return res.status(400).json({ error: 'regionSlug and name are required' });
    }
    if (!slug) slug = slugify(name);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const region = await client.query('SELECT id FROM regions WHERE slug = $1', [regionSlug]);
        if (!region.rows[0]) throw new Error('Unknown region');

        let business;
        let candidateSlug = slug;
        for (let suffix = 2; suffix <= 20; suffix++) {
            const existing = await client.query(
                `SELECT 1 FROM businesses WHERE region_id = $1 AND slug = $2`,
                [region.rows[0].id, candidateSlug]
            );
            if (!existing.rows[0]) break;
            candidateSlug = `${slug}-${suffix}`;
        }
        const inserted = await client.query(
            `INSERT INTO businesses (region_id, slug, name, category, description, website_url, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [region.rows[0].id, candidateSlug, name, category, description, websiteUrl, address]
        );
        business = inserted.rows[0];

        await client.query(
            `INSERT INTO business_members (business_id, user_id, role) VALUES ($1, $2, 'owner')`,
            [business.id, req.user.id]
        );

        await client.query('COMMIT');
        res.status(201).json(business);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Could not create business' });
    } finally {
        client.release();
    }
});

// PATCH /api/businesses/:id - must belong to the logged-in user
router.patch('/businesses/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, category, description, websiteUrl, address } = req.body;

    const membership = await pool.query(
        `SELECT 1 FROM business_members WHERE business_id = $1 AND user_id = $2`,
        [id, req.user.id]
    );
    if (!membership.rows[0]) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const result = await pool.query(
        `UPDATE businesses
         SET name = COALESCE($2, name),
             category = COALESCE($3, category),
             description = COALESCE($4, description),
             website_url = COALESCE($5, website_url),
             address = COALESCE($6, address)
         WHERE id = $1
         RETURNING *`,
        [id, name, category, description, websiteUrl, address]
    );
    res.json(result.rows[0]);
});

module.exports = router;
