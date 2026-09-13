import { useEffect, useMemo, useRef } from 'react';

// The network-of-businesses visual: nodes in constant, gentle, never-repeating
// drift, connected by lines that stretch and settle as they move. This is
// PortSide's signature visual element. Positions are pushed straight to the
// DOM via refs on every animation frame rather than through React state, so
// this stays smooth even with a few dozen nodes.

const TONE_COLOR = {
    signal: 'var(--signal, #E7A928)',
    harbour: 'var(--harbour-bright, #3a7d97)',
    neutral: 'var(--sand, #F3F0E8)',
};

function buildNodes(count) {
    return Array.from({ length: count }, (_, i) => ({
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        tone: i % 6 === 0 ? 'signal' : i % 4 === 0 ? 'harbour' : 'neutral',
        r: i % 6 === 0 ? 2.1 : 1.3,
    }));
}

// a light mesh: neighbours plus a few longer skip-links, so it reads as a
// network rather than a chain
function buildEdges(count) {
    const edges = [];
    for (let i = 0; i < count; i++) {
        edges.push([i, (i + 1) % count]);
        if (i % 3 === 0) edges.push([i, (i + 4) % count]);
        if (i % 5 === 0) edges.push([i, (i + 8) % count]);
    }
    return edges;
}

export default function NetworkGraph({ nodeCount = 26, height = 320 }) {
    const nodesRef = useRef(null);
    const circleEls = useRef([]);
    const lineEls = useRef([]);
    if (nodesRef.current === null || nodesRef.current.length !== nodeCount) {
        nodesRef.current = buildNodes(nodeCount);
    }
    const edges = useMemo(() => buildEdges(nodeCount), [nodeCount]);
    const initialNodes = nodesRef.current;

    useEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return undefined;

        let frameId;
        const BOUND_MIN = 3;
        const BOUND_MAX = 97;
        const MAX_SPEED = 0.055;

        const tick = () => {
            const nodes = nodesRef.current;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.x += n.vx;
                n.y += n.vy;

                if (n.x < BOUND_MIN || n.x > BOUND_MAX) n.vx *= -1;
                if (n.y < BOUND_MIN || n.y > BOUND_MAX) n.vy *= -1;
                n.x = Math.min(BOUND_MAX, Math.max(BOUND_MIN, n.x));
                n.y = Math.min(BOUND_MAX, Math.max(BOUND_MIN, n.y));

                // small continuous random nudges so the motion never settles
                // into a repeating bounce pattern
                n.vx += (Math.random() - 0.5) * 0.0025;
                n.vy += (Math.random() - 0.5) * 0.0025;
                n.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, n.vx));
                n.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, n.vy));

                const c = circleEls.current[i];
                if (c) { c.setAttribute('cx', n.x.toFixed(2)); c.setAttribute('cy', n.y.toFixed(2)); }
            }
            for (let i = 0; i < edges.length; i++) {
                const [a, b] = edges[i];
                const l = lineEls.current[i];
                if (l) {
                    l.setAttribute('x1', nodes[a].x.toFixed(2));
                    l.setAttribute('y1', nodes[a].y.toFixed(2));
                    l.setAttribute('x2', nodes[b].x.toFixed(2));
                    l.setAttribute('y2', nodes[b].y.toFixed(2));
                }
            }
            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [edges]);

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height }}
            aria-hidden="true"
        >
            {edges.map(([a, b], i) => (
                <line
                    key={i}
                    ref={(el) => { lineEls.current[i] = el; }}
                    x1={initialNodes[a].x} y1={initialNodes[a].y}
                    x2={initialNodes[b].x} y2={initialNodes[b].y}
                    stroke="var(--ink-line, #262e35)"
                    strokeWidth="0.35"
                />
            ))}
            {initialNodes.map((n, i) => (
                <circle
                    key={i}
                    ref={(el) => { circleEls.current[i] = el; }}
                    cx={n.x} cy={n.y} r={n.r}
                    fill={TONE_COLOR[n.tone]}
                />
            ))}
        </svg>
    );
}
