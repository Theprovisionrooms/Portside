import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const app = new Hono();

function normaliseType(type) {
    return type === 'freelance' ? 'freelance' : 'business';
}

function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// GET /api/regions/:regionSlug/businesses - the directory, optional ?category=
app.get('/regions/:regionSlug/businesses', async (c) => {
    const regionSlug = c.req.param('regionSlug');
    const category = c.req.query('category') ?? null;

    const { results } = await c.env.DB.prepare(
        `SELECT b.id, b.slug, b.name, b.category, b.description, b.logo_url, b.tier, b.verified,
                (
                    (SELECT COUNT(*) FROM referrals ref WHERE ref.from_business_id = b.id)
                    + (SELECT COUNT(*) FROM referrals ref WHERE ref.to_business_id = b.id)
                ) AS connections
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE r.slug = ?1
           AND (?2 IS NULL OR b.category = ?2)
         ORDER BY (b.tier = 'founding') DESC, (b.tier = 'premium') DESC, b.name`
    ).bind(regionSlug, category).all();
    return c.json(results);
});

// GET /api/businesses/:slug - full profile
app.get('/businesses/:slug', async (c) => {
    const row = await c.env.DB.prepare(
        `SELECT b.*, r.slug AS region_slug, r.name AS region_name,
                (
                    (SELECT COUNT(*) FROM referrals ref WHERE ref.from_business_id = b.id)
                    + (SELECT COUNT(*) FROM referrals ref WHERE ref.to_business_id = b.id)
                ) AS connections
         FROM businesses b
         JOIN regions r ON r.id = b.region_id
         WHERE b.slug = ?1`
    ).bind(c.req.param('slug')).first();
    if (!row) return c.json({ error: 'Business not found' }, 404);
    return c.json(row);
});

// GET /api/businesses/:slug/posts - a single business's own posts, most recent first
app.get('/businesses/:slug/posts', async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT p.id, p.content, p.scope, p.post_type, p.created_at,
                EXISTS(
                    SELECT 1 FROM sponsorships s
                    WHERE s.post_id = p.id AND s.type = 'boosted_post' AND s.status = 'active'
                      AND datetime('now') BETWEEN s.starts_at AND s.ends_at
                ) AS is_boosted
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         WHERE b.slug = ?1
         ORDER BY p.created_at DESC
         LIMIT 50`
    ).bind(c.req.param('slug')).all();
    return c.json(results);
});

// POST /api/businesses - create a profile, owner = logged-in user. slug is
// derived from name when not given, with a numeric suffix on collision.
app.post('/businesses', requireAuth, async (c) => {
    const body = await c.req.json();
    const { regionSlug, name, category, description, websiteUrl, address, type } = body;
    let slug = body.slug;

    if (!regionSlug || !name) {
        return c.json({ error: 'regionSlug and name are required' }, 400);
    }
    if (!slug) slug = slugify(name);
    const businessType = normaliseType(type);

    try {
        const region = await c.env.DB.prepare('SELECT id FROM regions WHERE slug = ?1')
            .bind(regionSlug).first();
        if (!region) return c.json({ error: 'Unknown region' }, 400);

        let candidateSlug = slug;
        for (let suffix = 2; suffix <= 20; suffix++) {
            const existing = await c.env.DB.prepare(
                'SELECT 1 FROM businesses WHERE region_id = ?1 AND slug = ?2'
            ).bind(region.id, candidateSlug).first();
            if (!existing) break;
            candidateSlug = `${slug}-${suffix}`;
        }

        const business = await c.env.DB.prepare(
            `INSERT INTO businesses (region_id, slug, name, type, category, description, website_url, address)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             RETURNING *`
        ).bind(region.id, candidateSlug, name, businessType, category ?? null, description ?? null, websiteUrl ?? null, address ?? null).first();

        const user = c.get('user');
        await c.env.DB.prepare(
            `INSERT INTO business_members (business_id, user_id, role) VALUES (?1, ?2, 'owner')`
        ).bind(business.id, user.id).run();

        return c.json(business, 201);
    } catch (err) {
        console.error(err);
        return c.json({ error: err.message || 'Could not create business' }, 400);
    }
});

// PATCH /api/businesses/:id - must belong to the logged-in user
app.patch('/businesses/:id', requireAuth, async (c) => {
    const id = c.req.param('id');
    const { name, category, description, websiteUrl, address, type } = await c.req.json();
    const user = c.get('user');

    const membership = await c.env.DB.prepare(
        `SELECT 1 FROM business_members WHERE business_id = ?1 AND user_id = ?2`
    ).bind(id, user.id).first();
    if (!membership) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const business = await c.env.DB.prepare(
        `UPDATE businesses
         SET name = COALESCE(?2, name),
             type = COALESCE(?3, type),
             category = COALESCE(?4, category),
             description = COALESCE(?5, description),
             website_url = COALESCE(?6, website_url),
             address = COALESCE(?7, address)
         WHERE id = ?1
         RETURNING *`
    ).bind(id, name ?? null, type ? normaliseType(type) : null, category ?? null, description ?? null, websiteUrl ?? null, address ?? null).first();

    return c.json(business);
});

export default app;
