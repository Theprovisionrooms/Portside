// Status badge for Southport-based members. Used sparingly - identity marker,
// not a decorative sticker.
export default function SandgrounderMark({ size = 96 }) {
    const s = size;
    return (
        <svg width={s} height={s} viewBox="0 0 96 96" fill="none" aria-hidden="true">
            <polygon
                points="48,4 88,26 88,70 48,92 8,70 8,26"
                stroke="var(--signal, #E7A928)"
                strokeWidth="1.2"
                fill="none"
            />
            <circle cx="48" cy="40" r="7" stroke="var(--sand, #F3F0E8)" strokeWidth="1.2" fill="none" />
            <line x1="48" y1="29" x2="48" y2="34" stroke="var(--sand, #F3F0E8)" strokeWidth="1.2" />
            <line x1="48" y1="46" x2="48" y2="51" stroke="var(--sand, #F3F0E8)" strokeWidth="1.2" />
            <text x="48" y="66" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="8.5" fill="var(--sand, #F3F0E8)" letterSpacing="0.5">
                SANDGROUNDER
            </text>
            <text x="48" y="76" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="6" fill="var(--muted, #747b7f)" letterSpacing="1.5">
                SOUTHPORT
            </text>
        </svg>
    );
}
