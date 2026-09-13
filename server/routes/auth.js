import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { sign } from '../lib/jwt.js';

const app = new Hono();

function isUniqueViolation(err) {
    return String(err?.message || '').includes('UNIQUE constraint failed');
}

// POST /api/auth/signup
app.post('/signup', async (c) => {
    const { email, password, fullName, regionSlug } = await c.req.json();

    if (!email || !password || !fullName) {
        return c.json({ error: 'email, password and fullName are required' }, 400);
    }

    try {
        let regionId = null;
        if (regionSlug) {
            const region = await c.env.DB.prepare('SELECT id FROM regions WHERE slug = ?1')
                .bind(regionSlug).first();
            regionId = region?.id ?? null;
        }

        const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?1')
            .bind(email).first();
        if (existing) {
            return c.json({ error: 'An account with that email already exists' }, 409);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        // is_admin is always 0 at signup - it's a database-only grant, never
        // something a request body can set
        const user = await c.env.DB.prepare(
            `INSERT INTO users (email, password_hash, full_name, region_id)
             VALUES (?1, ?2, ?3, ?4)
             RETURNING id, email, full_name, region_id, is_admin`
        ).bind(email, passwordHash, fullName, regionId).first();

        const token = await sign(
            { id: user.id, email: user.email, isAdmin: !!user.is_admin },
            c.env.JWT_SECRET
        );

        return c.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                regionId: user.region_id,
                isAdmin: !!user.is_admin,
            },
            token,
        }, 201);
    } catch (err) {
        if (isUniqueViolation(err)) {
            return c.json({ error: 'An account with that email already exists' }, 409);
        }
        console.error(err);
        return c.json({ error: 'Could not create account' }, 500);
    }
});

// POST /api/auth/login
app.post('/login', async (c) => {
    const { email, password } = await c.req.json();

    try {
        const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?1')
            .bind(email).first();

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return c.json({ error: 'Incorrect email or password' }, 401);
        }

        const token = await sign(
            { id: user.id, email: user.email, isAdmin: !!user.is_admin },
            c.env.JWT_SECRET
        );
        return c.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                regionId: user.region_id,
                isAdmin: !!user.is_admin,
            },
            token,
        });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Could not log in' }, 500);
    }
});

export default app;
