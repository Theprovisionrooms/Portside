const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/me
router.get('/', requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT id, email, full_name, region_id, is_admin FROM users WHERE id = $1`,
        [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        regionId: user.region_id,
        isAdmin: user.is_admin,
    });
});

// GET /api/me/businesses - the businesses the logged-in user is a member of,
// with the counts the dashboard needs, computed in one query rather than
// one round trip per stat
router.get('/businesses', requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT b.id, b.slug, b.name, b.category, b.tier, b.verified, bm.role,
                (SELECT COUNT(*) FROM posts p WHERE p.business_id = b.id) AS posts_count,
                (SELECT COUNT(*) FROM referrals r WHERE r.from_business_id = b.id) AS referrals_given,
                (SELECT COUNT(*) FROM referrals r WHERE r.to_business_id = b.id) AS referrals_received
         FROM business_members bm
         JOIN businesses b ON b.id = bm.business_id
         WHERE bm.user_id = $1
         ORDER BY b.created_at ASC`,
        [req.user.id]
    );
    res.json(result.rows);
});

module.exports = router;
