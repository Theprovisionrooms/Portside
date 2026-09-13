const Stripe = require('stripe');

// Boosts won't actually charge anything until STRIPE_SECRET_KEY is set to a
// real secret key from the Stripe dashboard - see .env.example. Everything
// that uses this checks for null first rather than assuming it's configured.
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

module.exports = stripe;
