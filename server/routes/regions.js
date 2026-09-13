import { Hono } from 'hono';

const app = new Hono();

// GET /api/regions - list active + coming-soon towns
app.get('/', async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT id, name, slug, status FROM regions ORDER BY name`
    ).all();
    return c.json(results);
});

// GET /api/regions/:slug
app.get('/:slug', async (c) => {
    const row = await c.env.DB.prepare(
        `SELECT id, name, slug, status FROM regions WHERE slug = ?1`
    ).bind(c.req.param('slug')).first();
    if (!row) return c.json({ error: 'Region not found' }, 404);
    return c.json(row);
});

export default app;
