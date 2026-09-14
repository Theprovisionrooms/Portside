import { Hono } from 'hono';

import authRoutes from './routes/auth.js';
import regionRoutes from './routes/regions.js';
import businessRoutes from './routes/businesses.js';
import postRoutes from './routes/posts.js';
import referralRoutes from './routes/referrals.js';
import messageRoutes from './routes/messages.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import meRoutes from './routes/me.js';
import mediaRoutes from './routes/media.js';
import { stripeWebhookHandler } from './routes/stripeWebhook.js';

const app = new Hono();

// No CORS setup needed - the frontend and this API are served from the same
// Cloudflare Pages project, so every request is same-origin.

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Mounted before the JSON-parsing routes touch the body anywhere - Hono
// doesn't parse the body until a handler asks for it, so this route is free
// to read the exact raw text Stripe signed, same idea as mounting ahead of
// express.json() in the old Express server.
app.post('/api/stripe/webhook', stripeWebhookHandler);

app.route('/api/auth', authRoutes);
app.route('/api/regions', regionRoutes);
app.route('/api', businessRoutes);     // /api/regions/:slug/businesses, /api/businesses/:slug
app.route('/api', postRoutes);         // /api/regions/:slug/feed, /api/posts
app.route('/api/referrals', referralRoutes);
app.route('/api/conversations', messageRoutes);
app.route('/api', leaderboardRoutes);  // /api/regions/:slug/leaderboard
app.route('/api/admin', adminRoutes);  // requireAuth + requireAdmin inside the router
app.route('/api/me', meRoutes);
app.route('/api', mediaRoutes);        // /api/businesses/:id/logo, /media, /api/media/*

export default app;
