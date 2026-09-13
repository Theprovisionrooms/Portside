import { verify } from '../lib/jwt.js';

// attaches c.set('user', { id, email, isAdmin }) when a valid bearer token
// is present, otherwise responds 401. Mount only on routes that need a
// logged-in user.
export async function requireAuth(c, next) {
    const header = c.req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return c.json({ error: 'Missing auth token' }, 401);
    }
    try {
        const payload = await verify(token, c.env.JWT_SECRET);
        c.set('user', payload);
        await next();
    } catch {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
}

// mount after requireAuth. Admin status comes from the JWT payload set at
// login/signup, which itself comes from users.is_admin - there is no route
// that lets a user grant this to themselves.
export async function requireAdmin(c, next) {
    const user = c.get('user');
    if (!user?.isAdmin) {
        return c.json({ error: 'Admin access required' }, 403);
    }
    await next();
}
