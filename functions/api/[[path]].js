// Single catch-all Pages Function. Cloudflare Pages only scans the
// functions/ directory for routes - everything the API actually does lives
// in server/ (untouched by that scan) and is just wired in here. Hono does
// its own internal routing for everything under /api/*, so this stays a
// one-line adapter rather than one physical file per route.
import { handle } from 'hono/cloudflare-pages';
import app from '../../server/index.js';

export const onRequest = handle(app);
