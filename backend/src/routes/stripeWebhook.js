const pool = require('../db/pool');
const stripe = require('../lib/stripe');

// Mounted directly as a request handler (not a router) on
// POST /api/stripe/webhook, ahead of express.json() in server.js, because
// Stripe's signature check needs the exact raw request body - once JSON
// middleware has parsed and re-serialized it the signature no longer matches.
//
// This is the only place a boost is ever marked active. The checkout-session
// endpoint in posts.js never writes to sponsorships itself - it just starts
// a Checkout Session and waits for Stripe to confirm the charge here.
module.exports = async function stripeWebhook(req, res) {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).send('Stripe is not configured');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { postId, businessId, days } = session.metadata || {};

        if (postId && businessId && days) {
            await pool.query(
                `INSERT INTO sponsorships (business_id, type, post_id, starts_at, ends_at, amount_paid_gbp, status)
                 VALUES ($1, 'boosted_post', $2, now(), now() + make_interval(days => $3::int), $4, 'active')`,
                [businessId, postId, Number(days), (session.amount_total || 0) / 100]
            );
        }
    }

    res.json({ received: true });
};
