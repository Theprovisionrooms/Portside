// One glyph per primary nav destination, drawn in the same weight and
// construction as ArrowIcon (1.6 stroke, square caps, miter joins, no fill
// except the small solid nodes) so the mobile tab bar doesn't lean on a
// generic icon font. The network glyph deliberately echoes the NetworkGraph
// hero motif at a small scale.
export default function NavIcon({ name, size = 20, color = 'currentColor' }) {
    const common = { stroke: color, strokeWidth: '1.6', fill: 'none' };

    switch (name) {
        case 'feed':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6h16M4 12h16M4 18h9" {...common} strokeLinecap="square" />
                </svg>
            );
        case 'directory':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="4" width="7" height="7" {...common} />
                    <rect x="13" y="4" width="7" height="7" {...common} />
                    <rect x="4" y="13" width="7" height="7" {...common} />
                    <rect x="13" y="13" width="7" height="7" {...common} />
                </svg>
            );
        case 'network':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 17L12 6M18 17L12 6M6 17H18" stroke={color} strokeWidth="1.3" />
                    <circle cx="12" cy="6" r="2" fill={color} />
                    <circle cx="6" cy="17" r="2" fill={color} />
                    <circle cx="18" cy="17" r="2" fill={color} />
                </svg>
            );
        case 'leaderboard':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 19V13M12 19V5M19 19V10" {...common} strokeLinecap="square" />
                </svg>
            );
        case 'messages':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h16v10H10l-4.5 4V15H4V5z" {...common} strokeLinejoin="miter" />
                </svg>
            );
        default:
            return null;
    }
}
