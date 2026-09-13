const jwt = require('jsonwebtoken');

// attaches req.user = { id, email } when a valid bearer token is present,
// otherwise responds 401. mount only on routes that need a logged-in user.
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth };
