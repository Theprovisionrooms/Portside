const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/regions/:regionSlug/leaderboard
router.get('/regions/:regionSlug/leaderboard', async (req, res) => {
    const result = await pool.query(
        `SELECT lm.* FROM leaderboard_monthly lm
         JOIN regions r ON r.id = lm.region_id
         WHERE r.slug = $1
         ORDER BY lm.activity_score DESC
         LIMIT 20`,
        [req.params.regionSlug]
    );
    res.json(result.rows);
});

module.exports = router;
