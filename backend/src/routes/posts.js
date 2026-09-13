const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/regions/:regionSlug/feed?scope=local|national|international
router.get('/regions/:regionSlug/feed', async (req, res) => {
    const { regionSlug } = req.params;
    const { scope } = req.query;

    const result = await pool.query(
        `SELECT p.id, p.content, p.media_urls, p.scope, p.post_type, p.is_sponsored, p.created_at,
                b.id AS business_id, b.name AS business_name, b.slug AS business_slug, b.logo_url
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         JOIN regions r ON r.id = b.region_id
         WHERE r.slug = $1
           AND ($2::text IS NULL OR p.scope = $2)
         ORDER BY p.is_sponsored DESC, p.created_at DESC
         LIMIT 50`,
        [regionSlug, scope || null]
    );
    res.json(result.rows);
});

// POST /api/posts - businessId must belong to the logged-in user
router.post('/posts', requireAuth, async (req, res) => {
    const { businessId, content, mediaUrls, scope, postType } = req.body;

    if (!businessId || !content) {
        return res.status(400).json({ error: 'businessId and content are required' });
    }

    const membership = await pool.query(
        `SELECT 1 FROM business_members WHERE business_id = $1 AND user_id = $2`,
        [businessId, req.user.id]
    );
    if (!membership.rows[0]) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const result = await pool.query(
        `INSERT INTO posts (business_id, author_user_id, content, media_urls, scope, post_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [businessId, req.user.id, content, JSON.stringify(mediaUrls || []), scope || 'local', postType || 'update']
    );
    res.status(201).json(result.rows[0]);
});

module.exports = router;
