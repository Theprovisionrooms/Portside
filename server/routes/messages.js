import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const app = new Hono();

async function ownsBusiness(db, businessId, userId) {
    const row = await db.prepare(
        `SELECT 1 FROM business_members WHERE business_id = ?1 AND user_id = ?2`
    ).bind(businessId, userId).first();
    return !!row;
}

// GET /api/conversations?businessId=123 - inbox for one of the user's businesses
app.get('/', requireAuth, async (c) => {
    const businessId = c.req.query('businessId');
    const user = c.get('user');
    if (!businessId || !(await ownsBusiness(c.env.DB, businessId, user.id))) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const { results } = await c.env.DB.prepare(
        `SELECT c.*,
                CASE WHEN c.business_a_id = ?1 THEN bb.name ELSE ba.name END AS other_business_name,
                CASE WHEN c.business_a_id = ?1 THEN c.business_b_id ELSE c.business_a_id END AS other_business_id
         FROM conversations c
         JOIN businesses ba ON ba.id = c.business_a_id
         JOIN businesses bb ON bb.id = c.business_b_id
         WHERE c.business_a_id = ?1 OR c.business_b_id = ?1
         ORDER BY c.created_at DESC`
    ).bind(businessId).all();
    return c.json(results);
});

// POST /api/conversations - start or fetch the thread between two businesses
app.post('/', requireAuth, async (c) => {
    const { businessId, otherBusinessId } = await c.req.json();
    const user = c.get('user');
    if (!businessId || !otherBusinessId || !(await ownsBusiness(c.env.DB, businessId, user.id))) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const [a, b] = [businessId, otherBusinessId].sort((x, y) => x - y);
    const conversation = await c.env.DB.prepare(
        `INSERT INTO conversations (business_a_id, business_b_id)
         VALUES (?1, ?2)
         ON CONFLICT (business_a_id, business_b_id) DO UPDATE SET business_a_id = excluded.business_a_id
         RETURNING *`
    ).bind(a, b).first();
    return c.json(conversation, 201);
});

// POST /api/conversations/:id/messages
app.post('/:id/messages', requireAuth, async (c) => {
    const { businessId, content } = await c.req.json();
    const user = c.get('user');
    if (!businessId || !content || !(await ownsBusiness(c.env.DB, businessId, user.id))) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const message = await c.env.DB.prepare(
        `INSERT INTO messages (conversation_id, sender_business_id, sender_user_id, content)
         VALUES (?1, ?2, ?3, ?4)
         RETURNING *`
    ).bind(c.req.param('id'), businessId, user.id, content).first();
    return c.json(message, 201);
});

// GET /api/conversations/:id/messages
app.get('/:id/messages', requireAuth, async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT * FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC`
    ).bind(c.req.param('id')).all();
    return c.json(results);
});

export default app;
