import { useEffect, useRef } from 'react';

// The network-of-businesses visual: PortSide's signature graphic. Nodes drift
// in constant, gentle, never-repeating motion at varying depth; connections
// between them carry small travelling pulses, standing in for referrals and
// posts moving through the network. Rendered on canvas rather than SVG so the
// glow, depth and gradient work needed to make it read as alive is cheap to
// draw every frame, even with several dozen nodes and pulses in flight.
//
// Three node tiers, echoing the product itself: hub nodes (the leaderboard's
// most-connected businesses), mid nodes (active members), minor nodes (the
// wider directory). Minor nodes bias their connections toward a hub, so the
// mesh reads as hub-and-spoke with real texture, not a uniform lattice.

const DEFAULT_COLORS = {
    inkLine: '#262e35',
    sandSecondary: '#d9d3c7',
    muted: '#747b7f',
    signal: '#e7a928',
    harbourBright: '#3a7d97',
};

function readColors() {
    if (typeof window === 'undefined') return DEFAULT_COLORS;
    const style = getComputedStyle(document.documentElement);
    const pick = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return {
        inkLine: pick('--ink-line', DEFAULT_COLORS.inkLine),
        sandSecondary: pick('--sand-secondary', DEFAULT_COLORS.sandSecondary),
        muted: pick('--muted', DEFAULT_COLORS.muted),
        signal: pick('--signal', DEFAULT_COLORS.signal),
        harbourBright: pick('--harbour-bright', DEFAULT_COLORS.harbourBright),
    };
}

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const int = parseInt(full, 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgba(rgb, a) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

const TIER_SHAPE = {
    hub: { rMin: 3.0, rMax: 4.0, glow: 15 },
    mid: { rMin: 1.6, rMax: 2.2, glow: 6 },
    minor: { rMin: 0.75, rMax: 1.25, glow: 0 },
};

function assignTiers(count) {
    const hubTarget = Math.max(2, Math.round(count * 0.07));
    const midTarget = Math.max(3, Math.round(count * 0.22));
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    const tiers = new Array(count).fill('minor');
    order.slice(0, hubTarget).forEach((i) => { tiers[i] = 'hub'; });
    order.slice(hubTarget, hubTarget + midTarget).forEach((i) => { tiers[i] = 'mid'; });
    return tiers;
}

function buildNodes(count) {
    const tiers = assignTiers(count);
    return Array.from({ length: count }, (_, i) => {
        const tier = tiers[i];
        const shape = TIER_SHAPE[tier];
        return {
            x: 5 + Math.random() * 90,
            y: 5 + Math.random() * 90,
            vx: (Math.random() - 0.5) * 0.05,
            vy: (Math.random() - 0.5) * 0.05,
            z: 0.35 + Math.random() * 0.65,
            tier,
            r: shape.rMin + Math.random() * (shape.rMax - shape.rMin),
            glow: shape.glow,
            breathePhase: Math.random() * Math.PI * 2,
            breatheSpeed: 0.35 + Math.random() * 0.35,
        };
    });
}

// mesh of neighbours plus longer skip-links, with minor nodes routed back
// toward a hub now and again so the network reads as hub-and-spoke, not a ring
function buildEdges(nodes) {
    const n = nodes.length;
    const hubIndices = nodes.reduce((acc, node, i) => {
        if (node.tier === 'hub') acc.push(i);
        return acc;
    }, []);
    const edges = [];
    const seen = new Set();
    const addEdge = (a, b) => {
        if (a === b) return;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push([a, b]);
    };
    for (let i = 0; i < n; i++) {
        addEdge(i, (i + 1) % n);
        if (i % 3 === 0) addEdge(i, (i + 4) % n);
        if (i % 5 === 0) addEdge(i, (i + 8) % n);
        if (nodes[i].tier === 'minor' && hubIndices.length && i % 4 === 1) {
            addEdge(i, hubIndices[i % hubIndices.length]);
        }
    }
    return edges;
}

function tierRgb(tier, colors) {
    if (tier === 'hub') return hexToRgb(colors.signal);
    if (tier === 'mid') return hexToRgb(colors.harbourBright);
    return hexToRgb(colors.sandSecondary);
}

const MAX_PULSES = 6;
const BOUND_MIN = 4;
const BOUND_MAX = 96;
const MAX_SPEED = 0.055;

export default function NetworkGraph({ nodeCount = 26, height = 320 }) {
    const canvasRef = useRef(null);
    const nodesRef = useRef(null);
    const edgesRef = useRef(null);
    const pulsesRef = useRef([]);
    const colorsRef = useRef(DEFAULT_COLORS);

    if (nodesRef.current === null || nodesRef.current.length !== nodeCount) {
        nodesRef.current = buildNodes(nodeCount);
        edgesRef.current = buildEdges(nodesRef.current);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        colorsRef.current = readColors();

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
            scale = (Math.min(rect.width, rect.height) / 100) * dpr;
            offsetX = (rect.width * dpr - 100 * scale) / 2;
            offsetY = (rect.height * dpr - 100 * scale) / 2;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const toPx = (x, y) => [offsetX + x * scale, offsetY + y * scale];

        const drawFrame = (now, animate) => {
            const nodes = nodesRef.current;
            const edges = edgesRef.current;
            const colors = colorsRef.current;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // connections first, underneath the nodes
            for (let i = 0; i < edges.length; i++) {
                const [a, b] = edges[i];
                const na = nodes[a];
                const nb = nodes[b];
                const [ax, ay] = toPx(na.x, na.y);
                const [bx, by] = toPx(nb.x, nb.y);
                const dx = na.x - nb.x;
                const dy = na.y - nb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const lengthFade = Math.max(0.25, 1 - dist / 130);
                const avgZ = (na.z + nb.z) / 2;
                const baseAlpha = 0.16 * lengthFade * (0.5 + 0.5 * avgZ);
                const aBoost = na.tier === 'hub' ? 2.2 : na.tier === 'mid' ? 1.3 : 1;
                const bBoost = nb.tier === 'hub' ? 2.2 : nb.tier === 'mid' ? 1.3 : 1;

                const grad = ctx.createLinearGradient(ax, ay, bx, by);
                grad.addColorStop(0, rgba(tierRgb(na.tier, colors), baseAlpha * aBoost));
                grad.addColorStop(1, rgba(tierRgb(nb.tier, colors), baseAlpha * bBoost));
                ctx.strokeStyle = grad;
                ctx.lineWidth = Math.max(0.5, scale * 0.045 * (0.5 + 0.5 * avgZ));
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by);
                ctx.stroke();
            }

            // travelling pulses, mid-layer: referrals moving through the network
            const pulses = pulsesRef.current;
            for (let i = 0; i < pulses.length; i++) {
                const p = pulses[i];
                const [a, b] = edges[p.edgeIndex];
                const na = nodes[a];
                const nb = nodes[b];
                const color = p.color;
                for (let trail = 0; trail < 4; trail++) {
                    const t = p.t - trail * 0.045;
                    if (t < 0) continue;
                    const px = na.x + (nb.x - na.x) * t;
                    const py = na.y + (nb.y - na.y) * t;
                    const [cx, cy] = toPx(px, py);
                    const alpha = (1 - trail / 4) * (1 - Math.abs(p.t - 0.5) * 0.6);
                    ctx.shadowColor = rgba(color, 0.9);
                    ctx.shadowBlur = (trail === 0 ? 10 : 4) * scale * 0.09;
                    ctx.fillStyle = rgba(color, alpha);
                    ctx.beginPath();
                    ctx.arc(cx, cy, (trail === 0 ? 1.1 : 0.6) * scale * 0.09, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.shadowBlur = 0;

            // nodes on top: glow halo, then a solid core
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const [x, y] = toPx(n.x, n.y);
                const color = tierRgb(n.tier, colors);
                const depthMul = 0.8 + 0.35 * n.z;
                const radius = n.r * scale * 0.09 * depthMul;

                if (n.glow > 0) {
                    const breathe = animate
                        ? 0.7 + 0.3 * Math.sin((now / 1000) * n.breatheSpeed + n.breathePhase)
                        : 0.85;
                    ctx.shadowColor = rgba(color, 0.85);
                    ctx.shadowBlur = n.glow * scale * 0.09 * breathe;
                } else {
                    ctx.shadowBlur = 0;
                }

                const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
                halo.addColorStop(0, rgba(color, 0.5 + 0.3 * n.z));
                halo.addColorStop(1, rgba(color, 0));
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = rgba(color, 0.85 + 0.15 * n.z);
                ctx.beginPath();
                ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        if (reduceMotion) {
            drawFrame(0, false);
            return () => ro.disconnect();
        }

        let frameId;
        let lastTime = performance.now();
        let nextSpawn = lastTime + 400;
        const pulseColors = [hexToRgb(colorsRef.current.signal), hexToRgb(colorsRef.current.harbourBright)];

        const tick = (now) => {
            const dt = Math.min(48, now - lastTime);
            lastTime = now;
            const step = dt / 16.67;
            const nodes = nodesRef.current;
            const edges = edgesRef.current;

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.x += n.vx * step;
                n.y += n.vy * step;

                if (n.x < BOUND_MIN || n.x > BOUND_MAX) n.vx *= -1;
                if (n.y < BOUND_MIN || n.y > BOUND_MAX) n.vy *= -1;
                n.x = Math.min(BOUND_MAX, Math.max(BOUND_MIN, n.x));
                n.y = Math.min(BOUND_MAX, Math.max(BOUND_MIN, n.y));

                // continuous small random nudges so the drift never settles
                // into a repeating bounce pattern
                n.vx += (Math.random() - 0.5) * 0.0025 * step;
                n.vy += (Math.random() - 0.5) * 0.0025 * step;
                n.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, n.vx));
                n.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, n.vy));
            }

            if (now > nextSpawn && pulsesRef.current.length < MAX_PULSES) {
                pulsesRef.current.push({
                    edgeIndex: Math.floor(Math.random() * edges.length),
                    t: 0,
                    speed: 0.006 + Math.random() * 0.006,
                    color: pulseColors[Math.random() < 0.65 ? 0 : 1],
                });
                nextSpawn = now + 450 + Math.random() * 900;
            }
            pulsesRef.current = pulsesRef.current
                .map((p) => ({ ...p, t: p.t + p.speed * step }))
                .filter((p) => p.t < 1);

            drawFrame(now, true);
            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frameId);
            ro.disconnect();
        };
    }, [nodeCount]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height, display: 'block', background: 'transparent' }}
            aria-hidden="true"
        />
    );
}
