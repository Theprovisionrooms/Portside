const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/regions - list active + coming-soon towns
router.get('/', async (req, res) => {
    const result = await pool.query(
        `SELECT id, name, slug, status FROM regions ORDER BY name`
    );
    res.json(result.rows);
});

// GET /api/regions/:slug
router.get('/:slug', async (req, res) => {
    const result = await pool.query(
        `SELECT id, name, slug, status FROM regions WHERE slug = $1`,
        [req.params.slug]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Region not found' });
    res.json(result.rows[0]);
});

module.exports = router;
