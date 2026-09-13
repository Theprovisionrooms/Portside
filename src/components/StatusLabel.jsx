// Small navigation-language metadata labels used throughout: "NETWORK / 128",
// "STATUS / ACTIVE". Product information, not decoration.
export default function StatusLabel({ label, value, signal = false, dot = false }) {
    const classes = ['status-label', signal && 'status-label--signal', dot && 'status-label--dot']
        .filter(Boolean)
        .join(' ');
    return (
        <span className={classes}>
            {label} / <b>{value}</b>
        </span>
    );
}
