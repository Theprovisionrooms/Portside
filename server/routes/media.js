import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

// Images only for now - logo and gallery. Video is deliberately not in
// here yet: R2 stores raw bytes, it doesn't compress anything, and "auto
// compressed video" needs a real transcoding step. Cloudflare Stream is
// the fit for that (per-minute stored + delivered pricing), but that's a
// cost decision, not a code decision, so it's not wired up until that's
// confirmed. See the comment on business_media.media_type in schema.sql.

const app = new Hono();

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function randomKey(businessId, filename) {
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    return `businesses/${businessId}/${crypto.randomUUID()}.${ext}`;
}

async function isMember(c, businessId, userId) {
    return c.env.DB.prepare(
        `SELECT 1 FROM business_members WHERE business_id = ?1 AND user_id = ?2`
    ).bind(businessId, userId).first();
}

async function readImageFile(c) {
    const form = await c.req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
        return { error: c.json({ error: 'file is required' }, 400) };
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return { error: c.json({ error: 'Image must be JPEG, PNG or WebP' }, 400) };
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return { error: c.json({ error: 'Image must be under 5MB' }, 400) };
    }
    return { file, caption: form.get('caption') || null };
}

// POST /api/businesses/:id/logo - replaces the business logo
app.post('/businesses/:id/logo', requireAuth, async (c) => {
    const businessId = c.req.param('id');
    const user = c.get('user');
    if (!(await isMember(c, businessId, user.id))) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const { file, error } = await readImageFile(c);
    if (error) return error;

    const key = randomKey(businessId, file.name || 'logo.jpg');
    await c.env.MEDIA.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
    });

    const url = `/api/media/${key}`;
    await c.env.DB.prepare(`UPDATE businesses SET logo_url = ?2 WHERE id = ?1`)
        .bind(businessId, url).run();

    return c.json({ logoUrl: url }, 201);
});

// POST /api/businesses/:id/media - add a gallery image
app.post('/businesses/:id/media', requireAuth, async (c) => {
    const businessId = c.req.param('id');
    const user = c.get('user');
    if (!(await isMember(c, businessId, user.id))) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const { file, caption, error } = await readImageFile(c);
    if (error) return error;

    const key = randomKey(businessId, file.name || 'gallery.jpg');
    await c.env.MEDIA.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
    });

    const url = `/api/media/${key}`;
    const row = await c.env.DB.prepare(
        `INSERT INTO business_media (business_id, media_type, url, caption)
         VALUES (?1, 'image', ?2, ?3) RETURNING *`
    ).bind(businessId, url, caption).first();

    return c.json(row, 201);
});

// GET /api/businesses/:id/media - a business's gallery, public
app.get('/businesses/:id/media', async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT * FROM business_media WHERE business_id = ?1 ORDER BY position, created_at DESC`
    ).bind(c.req.param('id')).all();
    return c.json(results);
});

// DELETE /api/businesses/:id/media/:mediaId
app.delete('/businesses/:id/media/:mediaId', requireAuth, async (c) => {
    const businessId = c.req.param('id');
    const user = c.get('user');
    if (!(await isMember(c, businessId, user.id))) {
        return c.json({ error: 'You are not a member of this business' }, 403);
    }

    const row = await c.env.DB.prepare(
        `SELECT * FROM business_media WHERE id = ?1 AND business_id = ?2`
    ).bind(c.req.param('mediaId'), businessId).first();
    if (!row) return c.json({ error: 'Not found' }, 404);

    await c.env.MEDIA.delete(row.url.replace('/api/media/', ''));
    await c.env.DB.prepare(`DELETE FROM business_media WHERE id = ?1`).bind(row.id).run();

    return c.json({ deleted: true });
});

// GET /api/media/:key(*) - serves the uploaded file straight from R2, so
// there's no separate public bucket URL to configure in Cloudflare
app.get('/media/*', async (c) => {
    const key = c.req.path.replace('/api/media/', '');
    const object = await c.env.MEDIA.get(key);
    if (!object) return c.json({ error: 'Not found' }, 404);

    return new Response(object.body, {
        headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
});

export default app;
