require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const regionRoutes = require('./routes/regions');
const businessRoutes = require('./routes/businesses');
const postRoutes = require('./routes/posts');
const referralRoutes = require('./routes/referrals');
const messageRoutes = require('./routes/messages');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const meRoutes = require('./routes/me');
const stripeWebhook = require('./routes/stripeWebhook');

const app = express();
app.use(cors());

// Stripe needs the exact raw request body to verify its signature, so this
// is mounted before express.json() parses everything else.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api', businessRoutes);      // /api/regions/:slug/businesses, /api/businesses/:slug
app.use('/api', postRoutes);          // /api/regions/:slug/feed, /api/posts
app.use('/api/referrals', referralRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api', leaderboardRoutes);   // /api/regions/:slug/leaderboard
app.use('/api/admin', adminRoutes);   // requireAuth + requireAdmin inside the router
app.use('/api/me', meRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`PortSide API listening on port ${port}`));
