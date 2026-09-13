import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const app = new Hono();

// GET /api/me
app.get('/', requireAuth, async (c) => {
    const user = c.get('user');
    const row = await c.env.DB.prepare(
        `SELECT id, email, full_name, region_id, is_admin FROM users WHERE id = ?1`
    ).bind(user.id).first();
    if (!row) return c.json({ error: 'User not found' }, 404);
    return c.json({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        regionId: row.region_id,
        isAdmin: !!row.is_admin,
    });
});

// GET /api/me/businesses - the businesses the logged-in user is a member of,
// with the counts the dashboard needs, computed in one query rather than
// one round trip per stat
app.get('/businesses', requireAuth, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        `SELECT b.id, b.slug, b.name, b.category, b.description, b.website_url, b.address, b.tier, b.verified, bm.role,
                (SELECT COUNT(*) FROM posts p WHERE p.business_id = b.id) AS posts_count,
                (SELECT COUNT(*) FROM referrals r WHERE r.from_business_id = b.id) AS referrals_given,
                (SELECT COUNT(*) FROM referrals r WHERE r.to_business_id = b.id) AS referrals_received
         FROM business_members bm
         JOIN businesses b ON b.id = bm.business_id
         WHERE bm.user_id = ?1
         ORDER BY b.created_at ASC`
    ).bind(user.id).all();
    return c.json(results);
});

export default app;
