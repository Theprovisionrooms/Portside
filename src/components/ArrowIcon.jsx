// The directional arrow is the recurring PortSide motif: business-to-business,
// customer-to-business, local-to-national. One glyph, used everywhere a
// relationship or a transition needs to be shown.
export default function ArrowIcon({ size = 16, color = 'currentColor', variant = 'single' }) {
    if (variant === 'chevrons') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 12h8" stroke={color} strokeWidth="1.6" />
                <path d="M13 6l6 6-6 6" stroke={color} strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M18 6l4 6-4 6" stroke={color} strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" opacity="0.55" />
            </svg>
        );
    }
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12h16" stroke={color} strokeWidth="1.6" />
            <path d="M14 6l6 6-6 6" stroke={color} strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
    );
}
