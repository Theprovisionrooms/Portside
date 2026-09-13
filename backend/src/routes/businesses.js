const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/regions/:regionSlug/businesses - the directory, optional ?category=
router.get('/regions/:regionSlug/businesses', async (req, res) => {
    const { regionSlug } = req.params;
    const { category } = req.query;

    const result = await pool.query(
        `SELECT b.id, b.slug, b.name, b.category, b.description, b.logo_url, b.tier, b.verified
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
        `SELECT b.*, r.slug AS region_slug, r.name AS region_name
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE b.slug = $1`,
        [req.params.slug]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(result.rows[0]);
});

// POST /api/businesses - create a profile, owner = logged-in user
router.post('/businesses', requireAuth, async (req, res) => {
    const { regionSlug, name, slug, category, description, websiteUrl, address } = req.body;

    if (!regionSlug || !name || !slug) {
        return res.status(400).json({ error: 'regionSlug, name and slug are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const region = await client.query('SELECT id FROM regions WHERE slug = $1', [regionSlug]);
        if (!region.rows[0]) throw new Error('Unknown region');

        const business = await client.query(
            `INSERT INTO businesses (region_id, slug, name, category, description, website_url, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [region.rows[0].id, slug, name, category, description, websiteUrl, address]
        );

        await client.query(
            `INSERT INTO business_members (business_id, user_id, role) VALUES ($1, $2, 'owner')`,
            [business.rows[0].id, req.user.id]
        );

        await client.query('COMMIT');
        res.status(201).json(business.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Could not create business' });
    } finally {
        client.release();
    }
});

module.exports = router;
