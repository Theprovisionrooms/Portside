// PortSide's logomark. An abstract signal flag built from stacked directional
// bars, brass yellow - not literal maritime iconography (no anchors/wheels).
export default function SignalMark({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M8 6h9v9H8z" fill="var(--signal, #E7A928)" />
            <path d="M20 6h12v4.5H20z" fill="var(--signal, #E7A928)" opacity="0.85" />
            <path d="M20 13h9v4.5h-9z" fill="var(--signal, #E7A928)" opacity="0.65" />
            <path d="M20 20h6v4.5h-6z" fill="var(--signal, #E7A928)" opacity="0.45" />
            <path d="M8 18v16l6-6-6-6z" fill="none" stroke="var(--signal, #E7A928)" strokeWidth="1.6" />
        </svg>
    );
}
