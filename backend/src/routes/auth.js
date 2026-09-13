const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { email, password, fullName, regionSlug } = req.body;

    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'email, password and fullName are required' });
    }

    try {
        const region = regionSlug
            ? await pool.query('SELECT id FROM regions WHERE slug = $1', [regionSlug])
            : null;
        const regionId = region?.rows[0]?.id || null;

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, region_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, full_name, region_id, is_admin`,
            [email, passwordHash, fullName, regionId]
        );

        const user = result.rows[0];
        // is_admin is always false at signup - it's a DB-only grant, never
        // something a request body can set
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({ user: { ...user, isAdmin: user.is_admin }, token });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'An account with that email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Could not create account' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Incorrect email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                regionId: user.region_id,
                isAdmin: user.is_admin,
            },
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not log in' });
    }
});

module.exports = router;
