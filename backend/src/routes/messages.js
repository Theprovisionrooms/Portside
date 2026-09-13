const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// helper: does req.user belong to businessId
async function ownsBusiness(businessId, userId) {
    const result = await pool.query(
        `SELECT 1 FROM business_members WHERE business_id = $1 AND user_id = $2`,
        [businessId, userId]
    );
    return !!result.rows[0];
}

// GET /api/conversations?businessId=123 - inbox for one of the user's businesses
router.get('/', requireAuth, async (req, res) => {
    const { businessId } = req.query;
    if (!businessId || !(await ownsBusiness(businessId, req.user.id))) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const result = await pool.query(
        `SELECT c.*,
                CASE WHEN c.business_a_id = $1 THEN bb.name ELSE ba.name END AS other_business_name,
                CASE WHEN c.business_a_id = $1 THEN c.business_b_id ELSE c.business_a_id END AS other_business_id
         FROM conversations c
         JOIN businesses ba ON ba.id = c.business_a_id
         JOIN businesses bb ON bb.id = c.business_b_id
         WHERE c.business_a_id = $1 OR c.business_b_id = $1
         ORDER BY c.created_at DESC`,
        [businessId]
    );
    res.json(result.rows);
});

// POST /api/conversations - start or fetch the thread between two businesses
router.post('/', requireAuth, async (req, res) => {
    const { businessId, otherBusinessId } = req.body;
    if (!businessId || !otherBusinessId || !(await ownsBusiness(businessId, req.user.id))) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const [a, b] = [businessId, otherBusinessId].sort((x, y) => x - y);
    const result = await pool.query(
        `INSERT INTO conversations (business_a_id, business_b_id)
         VALUES ($1, $2)
         ON CONFLICT (business_a_id, business_b_id) DO UPDATE SET business_a_id = EXCLUDED.business_a_id
         RETURNING *`,
        [a, b]
    );
    res.status(201).json(result.rows[0]);
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', requireAuth, async (req, res) => {
    const { businessId, content } = req.body;
    if (!businessId || !content || !(await ownsBusiness(businessId, req.user.id))) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_business_id, sender_user_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.params.id, businessId, req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [req.params.id]
    );
    res.json(result.rows);
});

module.exports = router;
