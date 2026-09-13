// A small, dependency-free JWT (HS256) implementation using the Web Crypto
// API, which is natively available in the Workers runtime. jsonwebtoken
// (the Express-era choice) leans on Node's crypto module in ways that need
// the nodejs_compat flag and aren't guaranteed to behave the same in Workers
// - this sidesteps that entirely with the same primitive Workers ships with.

function base64UrlEncode(bytes) {
    let binary = '';
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
    const binary = atob(withPadding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function encodeJson(obj) {
    return base64UrlEncode(new TextEncoder().encode(JSON.stringify(obj)));
}

function decodeJson(str) {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(str)));
}

async function getKey(secret) {
    return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export async function sign(payload, secret, expiresInSeconds = THIRTY_DAYS_SECONDS) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
    const data = `${encodeJson(header)}.${encodeJson(fullPayload)}`;
    const key = await getKey(secret);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return `${data}.${base64UrlEncode(signature)}`;
}

export async function verify(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
    const [headerB64, payloadB64, sigB64] = parts;

    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        base64UrlDecode(sigB64),
        new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) throw new Error('Invalid signature');

    const payload = decodeJson(payloadB64);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        throw new Error('Token expired');
    }
    return payload;
}
