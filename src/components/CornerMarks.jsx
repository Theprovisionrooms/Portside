// Viewfinder-style coordinate marks, borrowed from navigation instrumentation.
// Purely decorative, used to frame a hero moment or a key stat.
export default function CornerMarks({ size = 64, color = 'var(--signal-dim, #8a6a2c)' }) {
    const s = size;
    const arm = s * 0.28;
    return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden="true">
            <path d={`M0 ${arm} V0 H${arm}`} stroke={color} strokeWidth="1.2" />
            <path d={`M${s - arm} 0 H${s} V${arm}`} stroke={color} strokeWidth="1.2" />
            <path d={`M${s} ${s - arm} V${s} H${s - arm}`} stroke={color} strokeWidth="1.2" />
            <path d={`M${arm} ${s} H0 V${s - arm}`} stroke={color} strokeWidth="1.2" />
        </svg>
    );
}
