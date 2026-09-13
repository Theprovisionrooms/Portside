// The network-of-businesses visual: nodes connected by thin lines. This is
// PortSide's signature visual element (more important than illustration).
// Deterministic layout (no randomness) so it renders the same on every load.
const DEFAULT_NODES = [
    { x: 50, y: 15, tone: 'signal' },
    { x: 20, y: 35, tone: 'neutral' },
    { x: 80, y: 30, tone: 'harbour' },
    { x: 12, y: 65, tone: 'neutral' },
    { x: 45, y: 55, tone: 'signal' },
    { x: 75, y: 68, tone: 'neutral' },
    { x: 55, y: 85, tone: 'harbour' },
    { x: 90, y: 85, tone: 'neutral' },
];

const DEFAULT_EDGES = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5],
    [4, 6], [5, 6], [5, 7], [3, 4],
];

const TONE_COLOR = {
    signal: 'var(--signal, #E7A928)',
    harbour: 'var(--harbour-bright, #3a7d97)',
    neutral: 'var(--sand, #F3F0E8)',
};

export default function NetworkGraph({
    nodes = DEFAULT_NODES,
    edges = DEFAULT_EDGES,
    height = 320,
    animate = true,
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height }}
            aria-hidden="true"
        >
            {edges.map(([a, b], i) => {
                const na = nodes[a];
                const nb = nodes[b];
                return (
                    <line
                        key={i}
                        x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                        stroke="var(--ink-line, #262e35)"
                        strokeWidth="0.35"
                    />
                );
            })}
            {nodes.map((n, i) => (
                <circle
                    key={i}
                    cx={n.x} cy={n.y}
                    r={n.tone === 'signal' ? 2.1 : 1.5}
                    fill={TONE_COLOR[n.tone]}
                    className={animate ? 'network-node-pulse' : undefined}
                    style={{ animationDelay: `${i * 0.4}s` }}
                />
            ))}
        </svg>
    );
}
