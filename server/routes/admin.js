import { Hono } from 'hono';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const app = new Hono();

// every route here requires a logged-in admin
app.use('*', requireAuth, requireAdmin);

// GET /api/admin/overview?region=southport
app.get('/overview', async (c) => {
    const region = c.req.query('region') ?? null;
    const row = await c.env.DB.prepare(
        `SELECT
            COUNT(DISTINCT b.id) AS businesses,
            COUNT(DISTINCT p.id) AS posts,
            COUNT(DISTINCT CASE WHEN b.tier = 'founding' THEN b.id END) AS founding_members,
            COUNT(DISTINCT CASE WHEN b.suspended = 1 THEN b.id END) AS suspended_businesses
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         LEFT JOIN posts p ON p.business_id = b.id
         WHERE (?1 IS NULL OR r.slug = ?1)`
    ).bind(region).first();
    return c.json(row);
});

// GET /api/admin/businesses?region=southport
app.get('/businesses', async (c) => {
    const region = c.req.query('region') ?? null;
    const { results } = await c.env.DB.prepare(
        `SELECT b.id, b.slug, b.name, b.category, b.tier, b.verified, b.featured, b.suspended
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE (?1 IS NULL OR r.slug = ?1)
         ORDER BY b.created_at DESC`
    ).bind(region).all();
    return c.json(results.map((b) => ({ ...b, verified: !!b.verified, featured: !!b.featured, suspended: !!b.suspended })));
});

// GET /api/admin/posts?region=southport - most recent first, for moderation
app.get('/posts', async (c) => {
    const region = c.req.query('region') ?? null;
    const { results } = await c.env.DB.prepare(
        `SELECT p.id, p.content, p.scope, p.post_type, p.created_at,
                b.name AS business_name, b.slug AS business_slug
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         JOIN regions r ON r.id = b.region_id
         WHERE (?1 IS NULL OR r.slug = ?1)
         ORDER BY p.created_at DESC
         LIMIT 100`
    ).bind(region).all();
    return c.json(results);
});

// POST /api/admin/businesses/:id/feature - toggle featured status
app.post('/businesses/:id/feature', async (c) => {
    const row = await c.env.DB.prepare(
        `UPDATE businesses SET featured = 1 - featured WHERE id = ?1 RETURNING id, name, featured`
    ).bind(c.req.param('id')).first();
    if (!row) return c.json({ error: 'Business not found' }, 404);
    return c.json({ ...row, featured: !!row.featured });
});

// POST /api/admin/businesses/:id/suspend - toggle suspended status
app.post('/businesses/:id/suspend', async (c) => {
    const row = await c.env.DB.prepare(
        `UPDATE businesses SET suspended = 1 - suspended WHERE id = ?1 RETURNING id, name, suspended`
    ).bind(c.req.param('id')).first();
    if (!row) return c.json({ error: 'Business not found' }, 404);
    return c.json({ ...row, suspended: !!row.suspended });
});

// DELETE /api/admin/posts/:id
app.delete('/posts/:id', async (c) => {
    const row = await c.env.DB.prepare(`DELETE FROM posts WHERE id = ?1 RETURNING id`)
        .bind(c.req.param('id')).first();
    if (!row) return c.json({ error: 'Post not found' }, 404);
    return c.body(null, 204);
});

export default app;
