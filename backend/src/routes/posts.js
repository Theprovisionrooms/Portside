const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const stripe = require('../lib/stripe');

const router = express.Router();

// A boosted post doesn't get pinned above everything else and it doesn't push
// other businesses' posts down a slot - that stacks every promoted post into
// a wall at the top of the feed and reads as an ads takeover. Instead, an
// active boost gives a post's *effective* timestamp a fixed forward nudge, so
// it competes for feed position the same way a newer organic post would: it
// surfaces near the top more often, gets seen more, and naturally cycles down
// again as real new activity comes in. Flat rate, no auction, so two boosted
// posts still rank against each other by genuine recency.
const BOOST_TIME_NUDGE = '5 hours';
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
router.get('/regions/:regionSlug/feed', async (req, res) => {
    const { regionSlug } = req.params;
    const { scope } = req.query;

    const result = await pool.query(
        `SELECT p.id, p.content, p.media_urls, p.scope, p.post_type, p.created_at,
                b.id AS business_id, b.name AS business_name, b.slug AS business_slug, b.logo_url,
                (boost.id IS NOT NULL) AS is_boosted
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         JOIN regions r ON r.id = b.region_id
         LEFT JOIN LATERAL (
             SELECT s.id
             FROM sponsorships s
             WHERE s.post_id = p.id
               AND s.type = 'boosted_post'
               AND s.status = 'active'
               AND now() BETWEEN s.starts_at AND s.ends_at
             LIMIT 1
         ) boost ON true
         WHERE r.slug = $1
           AND ($2::text IS NULL OR p.scope = $2)
         ORDER BY (p.created_at + CASE WHEN boost.id IS NOT NULL THEN INTERVAL '${BOOST_TIME_NUDGE}' ELSE INTERVAL '0' END) DESC
         LIMIT 50`,
        [regionSlug, scope || null]
    );

    res.json(declusterBoosted(result.rows));
});

// GET /api/posts/:id - single post, for the post detail page
router.get('/posts/:id', async (req, res) => {
    const result = await pool.query(
        `SELECT p.id, p.content, p.media_urls, p.scope, p.post_type, p.created_at,
                b.id AS business_id, b.name AS business_name, b.slug AS business_slug, b.category, b.logo_url,
                (boost.id IS NOT NULL) AS is_boosted
         FROM posts p
         JOIN businesses b ON b.id = p.business_id
         LEFT JOIN LATERAL (
             SELECT s.id FROM sponsorships s
             WHERE s.post_id = p.id AND s.type = 'boosted_post' AND s.status = 'active'
               AND now() BETWEEN s.starts_at AND s.ends_at
             LIMIT 1
         ) boost ON true
         WHERE p.id = $1`,
        [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
});

// POST /api/posts - businessId must belong to the logged-in user
router.post('/posts', requireAuth, async (req, res) => {
    const { businessId, content, mediaUrls, scope, postType } = req.body;

    if (!businessId || !content) {
        return res.status(400).json({ error: 'businessId and content are required' });
    }

    const membership = await pool.query(
        `SELECT 1 FROM business_members WHERE business_id = $1 AND user_id = $2`,
        [businessId, req.user.id]
    );
    if (!membership.rows[0]) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const result = await pool.query(
        `INSERT INTO posts (business_id, author_user_id, content, media_urls, scope, post_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [businessId, req.user.id, content, JSON.stringify(mediaUrls || []), scope || 'local', postType || 'update']
    );
    res.status(201).json(result.rows[0]);
});

// POST /api/posts/:postId/boost - starts a Stripe Checkout for the boost,
// flat £10/day. This endpoint never writes to sponsorships itself - the
// boost only becomes active once Stripe confirms the charge, via the
// /api/stripe/webhook handler. Returns a checkout URL for the frontend to
// redirect to.
router.post('/posts/:postId/boost', requireAuth, async (req, res) => {
    const { postId } = req.params;
    const days = Number(req.body.days);

    if (!Number.isInteger(days) || days < 1 || days > MAX_BOOST_DAYS) {
        return res.status(400).json({ error: `days must be a whole number between 1 and ${MAX_BOOST_DAYS}` });
    }
    if (!stripe) {
        return res.status(503).json({ error: 'Payments are not configured yet - set STRIPE_SECRET_KEY' });
    }

    const postResult = await pool.query(`SELECT business_id, content FROM posts WHERE id = $1`, [postId]);
    const post = postResult.rows[0];
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    const membership = await pool.query(
        `SELECT 1 FROM business_members WHERE business_id = $1 AND user_id = $2`,
        [post.business_id, req.user.id]
    );
    if (!membership.rows[0]) {
        return res.status(403).json({ error: 'You are not a member of this business' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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

    res.status(201).json({ checkoutUrl: session.url });
});

module.exports = router;
