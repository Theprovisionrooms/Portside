const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/referrals - fromBusinessId must belong to the logged-in user
router.post('/', requireAuth, async (req, res) => {
    const { fromBusinessId, toBusinessId, note } = req.body;

    if (!fromBusinessId || !toBusinessId) {
        return res.status(400).json({ error: 'fromBusinessId and toBusinessId are required' });
    }

    const membership = await pool.query(
        `SELECT 1 FROM business_members WHERE business_id = $1 AND user_id = $2`,
        [fromBusinessId, req.user.id]
    );
    if (!membership.rows[0]) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const result = await pool.query(
        `INSERT INTO referrals (from_business_id, to_business_id, referred_by_user_id, note)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [fromBusinessId, toBusinessId, req.user.id, note || null]
    );
    res.status(201).json(result.rows[0]);
});

// GET /api/businesses/:id/referrals - both directions, for the business dashboard
router.get('/business/:id', requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT r.*, fb.name AS from_business_name, tb.name AS to_business_name
         FROM referrals r
         JOIN businesses fb ON fb.id = r.from_business_id
         JOIN businesses tb ON tb.id = r.to_business_id
         WHERE r.from_business_id = $1 OR r.to_business_id = $1
         ORDER BY r.created_at DESC`,
        [req.params.id]
    );
    res.json(result.rows);
});

module.exports = router;
