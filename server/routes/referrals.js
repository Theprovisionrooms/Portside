import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const app = new Hono();

// POST /api/referrals - fromBusinessId must belong to the logged-in user
app.post('/', requireAuth, async (c) => {
    const { fromBusinessId, toBusinessId, note } = await c.req.json();
    const user = c.get('user');

    if (!fromBusinessId || !toBusinessId) {
        return c.json({ error: 'fromBusinessId and toBusinessId are required' }, 400);
    }

    const membership = await c.env.DB.prepare(
        `SELECT 1 FROM business_members WHERE business_id = ?1 AND user_id = ?2`
    ).bind(fromBusinessId, user.id).first();
    if (!membership) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const referral = await c.env.DB.prepare(
        `INSERT INTO referrals (from_business_id, to_business_id, referred_by_user_id, note)
         VALUES (?1, ?2, ?3, ?4)
         RETURNING *`
    ).bind(fromBusinessId, toBusinessId, user.id, note ?? null).first();

    return c.json(referral, 201);
});

// GET /api/referrals/business/:id - both directions, for the business dashboard
app.get('/business/:id', requireAuth, async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT r.*, fb.name AS from_business_name, tb.name AS to_business_name
         FROM referrals r
         JOIN businesses fb ON fb.id = r.from_business_id
         JOIN businesses tb ON tb.id = r.to_business_id
         WHERE r.from_business_id = ?1 OR r.to_business_id = ?1
         ORDER BY r.created_at DESC`
    ).bind(c.req.param('id')).all();
    return c.json(results);
});

export default app;
