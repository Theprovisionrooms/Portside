import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getStripe } from '../lib/stripe.js';

const app = new Hono();

// A boosted post doesn't get pinned above everything else and it doesn't push
// other businesses' posts down a slot - that stacks every promoted post into
// a wall at the top of the feed and reads as an ads takeover. Instead, an
// active boost gives a post's *effective* timestamp a fixed forward nudge, so
// it competes for feed position the same way a newer organic post would: it
// surfaces near the top more often, gets seen more, and naturally cycles down
// again as real new activity comes in. Flat rate, no auction, so two boosted
// posts still rank against each other by genuine recency.
const BOOST_TIME_NUDGE_HOURS = 5;
const DAILY_RATE_GBP = 10;
const MAX_BOOST_DAYS = 30;

// after sorting, no more than one boosted post is allowed in any run of four,
// so a boost can't produce a visible cluster - overflow boosted posts are
// held back a few slots rather than dropped
function declusterBoosted(rows, windowSize = 4, maxPerWindow = 1) {
    const result = [];
    const remaining = [...rows];
    while (remaining.length) {
        const next = remaining[0];
        const recentBoosted = result.slice(-(windowSize - 1)).filter((p) => p.is_boosted).length;
        if (next.is_boosted && recentBoosted >= maxPerWindow) {
            const swapIndex = remaining.findIndex((p) => !p.is_boosted);
            if (swapIndex > 0) {
                const [organic] = remaining.splice(swapIndex, 1);
                result.push(organic);
                continue;
            }
        }
        result.push(remaining.shift());
    }
    return result;
}

// GET /api/regions/:regionSlug/feed?scope=local|national|international
app.get('/regions/:regionSlug/feed', async (c) => {
    const regionSlug = c.req.param('regionSlug');
    const scope = c.req.query('scope') ?? null;

    const { results } = await c.env.DB.prepare(
        `SELECT p.id, p.content, p.media_urls, p.scope, p.post_type, p.created_at,
                b.id AS business_id, b.name AS business_name, b.slug AS business_slug, b.logo_url,
                EXISTS(
                    SELECT 1 FROM sponsorships s
                    WHERE s.post_id = p.id AND s.type = 'boosted_post' AND s.status = 'active'
                      AND datetime('now') BETWEEN s.starts_at AND s.ends_at
                ) AS is_boosted
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         JOIN regions r ON r.id = b.region_id
         WHERE r.slug = ?1
           AND (?2 IS NULL OR p.scope = ?2)
         ORDER BY datetime(p.created_at, CASE WHEN EXISTS(
                    SELECT 1 FROM sponsorships s
                    WHERE s.post_id = p.id AND s.type = 'boosted_post' AND s.status = 'active'
                      AND datetime('now') BETWEEN s.starts_at AND s.ends_at
                 ) THEN '+${BOOST_TIME_NUDGE_HOURS} hours' ELSE '+0 hours' END) DESC
         LIMIT 50`
    ).bind(regionSlug, scope).all();

    const rows = results.map((r) => ({ ...r, is_boosted: !!r.is_boosted }));
    return c.json(declusterBoosted(rows));
});

// GET /api/posts/:id - single post, for the post detail page
app.get('/posts/:id', async (c) => {
    const row = await c.env.DB.prepare(
        `SELECT p.id, p.content, p.media_urls, p.scope, p.post_type, p.created_at,
                b.id AS business_id, b.name AS business_name, b.slug AS business_slug, b.category, b.logo_url,
                EXISTS(
                    SELECT 1 FROM sponsorships s
                    WHERE s.post_id = p.id AND s.type = 'boosted_post' AND s.status = 'active'
                      AND datetime('now') BETWEEN s.starts_at AND s.ends_at
                ) AS is_boosted
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         WHERE p.id = ?1`
    ).bind(c.req.param('id')).first();
    if (!row) return c.json({ error: 'Post not found' }, 404);
    return c.json({ ...row, is_boosted: !!row.is_boosted });
});

// POST /api/posts - businessId must belong to the logged-in user
app.post('/posts', requireAuth, async (c) => {
    const { businessId, content, mediaUrls, scope, postType } = await c.req.json();
    const user = c.get('user');

    if (!businessId || !content) {
        return c.json({ error: 'businessId and content are required' }, 400);
    }

    const membership = await c.env.DB.prepare(
        `SELECT 1 FROM business_members WHERE business_id = ?1 AND user_id = ?2`
    ).bind(businessId, user.id).first();
    if (!membership) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const post = await c.env.DB.prepare(
        `INSERT INTO posts (business_id, author_user_id, content, media_urls, scope, post_type)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         RETURNING *`
    ).bind(businessId, user.id, content, JSON.stringify(mediaUrls ?? []), scope ?? 'local', postType ?? 'update').first();

    return c.json(post, 201);
});

// POST /api/posts/:postId/boost - starts a Stripe Checkout for the boost,
// flat £10/day. This endpoint never writes to sponsorships itself - the
// boost only becomes active once Stripe confirms the charge, via the
// /api/stripe/webhook handler. Returns a checkout URL for the frontend to
// redirect to.
app.post('/posts/:postId/boost', requireAuth, async (c) => {
    const postId = c.req.param('postId');
    const { days } = await c.req.json();
    const user = c.get('user');

    if (!Number.isInteger(days) || days < 1 || days > MAX_BOOST_DAYS) {
        return c.json({ error: `days must be a whole number between 1 and ${MAX_BOOST_DAYS}` }, 400);
    }

    const stripe = getStripe(c.env);
    if (!stripe) {
        return c.json({ error: 'Payments are not configured yet - set STRIPE_SECRET_KEY' }, 503);
    }

    const post = await c.env.DB.prepare(`SELECT business_id, content FROM posts WHERE id = ?1`)
        .bind(postId).first();
    if (!post) return c.json({ error: 'Post not found' }, 404);

    const membership = await c.env.DB.prepare(
        `SELECT 1 FROM business_members WHERE business_id = ?1 AND user_id = ?2`
    ).bind(post.business_id, user.id).first();
    if (!membership) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const frontendUrl = new URL(c.req.url).origin;
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'gbp',
                unit_amount: DAILY_RATE_GBP * 100 * days,
                product_data: {
                    name: `Promote a post for ${days} day${days === 1 ? '' : 's'}`,
                    description: post.content.slice(0, 90),
                },
            },
            quantity: 1,
        }],
        metadata: {
            postId: String(postId),
            businessId: String(post.business_id),
            days: String(days),
        },
        success_url: `${frontendUrl}/dashboard?boost=success`,
        cancel_url: `${frontendUrl}/dashboard?boost=cancelled`,
    });

    return c.json({ checkoutUrl: session.url }, 201);
});

export default app;
