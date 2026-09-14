const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
    const token = localStorage.getItem('portside_token');
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    del: (path) => request(path, { method: 'DELETE' }),
};

// Decodes the JWT payload for UI gating only (which nav links to show,
// whether to render the admin page) - never trust this for anything that
// actually matters, the real check is the server verifying the signature on
// every request. Returns null if there's no token or it can't be parsed.
export function getCurrentUser() {
    const token = localStorage.getItem('portside_token');
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded;
    } catch {
        return null;
    }
}

export function logout() {
    localStorage.removeItem('portside_token');
}
