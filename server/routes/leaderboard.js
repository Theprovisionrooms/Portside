import { Hono } from 'hono';

const app = new Hono();

// GET /api/regions/:regionSlug/leaderboard
app.get('/regions/:regionSlug/leaderboard', async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT lm.* FROM leaderboard_monthly lm
         JOIN regions r ON r.id = lm.region_id
         WHERE r.slug = ?1
         ORDER BY lm.activity_score DESC
         LIMIT 20`
    ).bind(c.req.param('regionSlug')).all();
    return c.json(results);
});

export default app;
