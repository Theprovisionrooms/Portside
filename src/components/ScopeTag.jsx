export default function ScopeTag({ scope = 'local' }) {
    return <span className={`scope-tag scope-tag--${scope}`}>{scope}</span>;
}
