import { getStripe } from '../lib/stripe.js';

// Mounted directly as a handler on POST /api/stripe/webhook. This is the
// only place a boost is ever marked active - the checkout-session endpoint
// in posts.js never writes to sponsorships itself, it just starts a
// Checkout Session and waits for Stripe to confirm the charge here.
//
// Uses constructEventAsync rather than constructEvent because Stripe's sync
// signature check relies on Node's crypto module; the async variant uses
// Web Crypto, which is what the Workers runtime actually has.
export async function stripeWebhookHandler(c) {
    const stripe = getStripe(c.env);
    if (!stripe || !c.env.STRIPE_WEBHOOK_SECRET) {
        return c.text('Stripe is not configured', 503);
    }

    const rawBody = await c.req.text();
    const signature = c.req.header('stripe-signature');

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(rawBody, signature, c.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return c.text(`Webhook signature verification failed: ${err.message}`, 400);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { postId, businessId, days } = session.metadata || {};

        if (postId && businessId && days) {
            await c.env.DB.prepare(
                `INSERT INTO sponsorships (business_id, type, post_id, starts_at, ends_at, amount_paid_gbp, status)
                 VALUES (?1, 'boosted_post', ?2, datetime('now'), datetime('now', '+' || ?3 || ' days'), ?4, 'active')`
            ).bind(businessId, postId, Number(days), (session.amount_total || 0) / 100).run();
        }
    }

    return c.json({ received: true });
}
