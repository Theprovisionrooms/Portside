import Stripe from 'stripe';

// Workers has no persistent process.env - secrets arrive per-request via the
// env object Hono exposes as c.env, so this is a factory rather than a
// module-level singleton. Stripe's default HTTP client uses Node's http
// module, which doesn't exist in the Workers runtime - createFetchHttpClient()
// swaps it for the standard fetch() Workers already has.
export function getStripe(env) {
    if (!env.STRIPE_SECRET_KEY) return null;
    return new Stripe(env.STRIPE_SECRET_KEY, {
        httpClient: Stripe.createFetchHttpClient(),
    });
}
