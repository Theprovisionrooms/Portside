import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import { api } from '../api/client';

const REGION = 'southport';

export default function Directory() {
    const [query, setQuery] = useState('');
    const [businesses, setBusinesses] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        api.get(`/regions/${REGION}/businesses`)
            .then((rows) => { setBusinesses(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    const visible = businesses.filter((b) =>
        (b.name + (b.category || '')).toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="row spread wrap gap-3" style={{ marginBottom: 'var(--space-5)' }}>
                <div>
                    <div className="eyebrow-block">
                        <span className="rule" />
                        <span className="label">Directory</span>
                    </div>
                    <h2 style={{ marginBottom: 0 }}>Southport businesses</h2>
                </div>
                {status === 'ready' && <StatusLabel label="Members" value={businesses.length} signal />}
            </div>

            <div className="field" style={{ maxWidth: 360, marginBottom: 'var(--space-6)' }}>
                <input
                    placeholder="Search by name or category"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {status === 'error' && (
                <p className="text-small muted">Couldn&apos;t load the directory right now. Try again shortly.</p>
            )}
            {status === 'loading' && <p className="text-small muted">Loading directory…</p>}

            <div className="directory-grid">
                {status === 'ready' && visible.map((b) => (
                    <Link key={b.slug} to={`/business/${b.slug}`} className="business-card">
                        <div className="row spread">
                            <span className="mark">{b.name.charAt(0)}</span>
                            {b.tier === 'founding' && <span className="partner-tag">Founding</span>}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{b.name}</div>
                            <div className="text-small muted">{b.category}</div>
                        </div>
                        <p className="text-small muted" style={{ margin: 0 }}>{b.description}</p>
                        <div className="text-small label--signal label">+{b.connections} connections</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
