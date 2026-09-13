import ArrowIcon from './ArrowIcon.jsx';

// The referral graphic: BUSINESS A -----> BUSINESS B
// status: 'pending' (dashed, outline nodes) | 'active' (solid line, filled from-node)
// | 'completed' (solid line, both nodes filled)
export default function Connection({ fromLabel, toLabel, status = 'pending' }) {
    const fromFilled = status !== 'pending';
    const toFilled = status === 'completed';
    const lineClass =
        status === 'pending' ? 'connection__line connection__line--dashed' : 'connection__line connection__line--active';

    return (
        <div className="connection">
            <span className={`connection__node ${fromFilled ? 'connection__node--filled' : ''}`} />
            <span className={lineClass} />
            <ArrowIcon size={13} color="var(--muted)" />
            <span className={lineClass} />
            <span className={`connection__node ${toFilled ? 'connection__node--harbour' : ''}`} />
            {(fromLabel || toLabel) && (
                <span className="text-small muted" style={{ marginLeft: 8, whiteSpace: 'nowrap' }}>
                    {fromLabel} → {toLabel}
                </span>
            )}
        </div>
    );
}
