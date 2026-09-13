const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// every route here requires a logged-in admin - mounted once at the router
// level rather than repeated on each handler
router.use(requireAuth, requireAdmin);

// GET /api/admin/overview?region=southport
router.get('/overview', async (req, res) => {
    const { region } = req.query;

    const result = await pool.query(
        `SELECT
            COUNT(DISTINCT b.id) AS businesses,
            COUNT(DISTINCT p.id) AS posts,
            COUNT(DISTINCT b.id) FILTER (WHERE b.tier = 'founding') AS founding_members,
            COUNT(DISTINCT b.id) FILTER (WHERE b.suspended) AS suspended_businesses
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         LEFT JOIN posts p ON p.business_id = b.id
         WHERE ($1::text IS NULL OR r.slug = $1)`,
        [region || null]
    );
    res.json(result.rows[0]);
});

// GET /api/admin/businesses?region=southport
router.get('/businesses', async (req, res) => {
    const { region } = req.query;
    const result = await pool.query(
        `SELECT b.id, b.slug, b.name, b.category, b.tier, b.verified, b.featured, b.suspended
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE ($1::text IS NULL OR r.slug = $1)
         ORDER BY b.created_at DESC`,
        [region || null]
    );
    res.json(result.rows);
});

// GET /api/admin/posts?region=southport - most recent first, for moderation
router.get('/posts', async (req, res) => {
    const { region } = req.query;
    const result = await pool.query(
        `SELECT p.id, p.content, p.scope, p.post_type, p.created_at,
                b.name AS business_name, b.slug AS business_slug
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         JOIN regions r ON r.id = b.region_id
         WHERE ($1::text IS NULL OR r.slug = $1)
         ORDER BY p.created_at DESC
         LIMIT 100`,
        [region || null]
    );
    res.json(result.rows);
});

// POST /api/admin/businesses/:id/feature - toggle featured status
router.post('/businesses/:id/feature', async (req, res) => {
    const result = await pool.query(
        `UPDATE businesses SET featured = NOT featured WHERE id = $1 RETURNING id, name, featured`,
        [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(result.rows[0]);
});

// POST /api/admin/businesses/:id/suspend - toggle suspended status
router.post('/businesses/:id/suspend', async (req, res) => {
    const result = await pool.query(
        `UPDATE businesses SET suspended = NOT suspended WHERE id = $1 RETURNING id, name, suspended`,
        [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(result.rows[0]);
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
    const result = await pool.query(`DELETE FROM posts WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.status(204).end();
});

module.exports = router;
