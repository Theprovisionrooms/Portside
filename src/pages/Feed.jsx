import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ScopeTag from '../components/ScopeTag.jsx';
import StatusLabel from '../components/StatusLabel.jsx';
import { api } from '../api/client';

const SCOPES = ['all', 'local', 'national', 'international'];
const REGION = 'southport';

export default function Feed() {
    const [scope, setScope] = useState('all');
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        setStatus('loading');
        const query = scope === 'all' ? '' : `?scope=${scope}`;
        api.get(`/regions/${REGION}/feed${query}`)
            .then((rows) => { setPosts(rows); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, [scope]);

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="row spread wrap gap-3" style={{ marginBottom: 'var(--space-5)' }}>
                <div>
                    <div className="eyebrow-block">
                        <span className="rule" />
                        <span className="label">Community feed</span>
                    </div>
                    <h2 style={{ marginBottom: 0 }}>Southport, this week</h2>
                </div>
                {status === 'ready' && <StatusLabel label="Posts" value={posts.length} signal />}
            </div>

            <div className="row gap-2 wrap" style={{ marginBottom: 'var(--space-5)' }}>
                {SCOPES.map((s) => (
                    <button
                        key={s}
                        className={`btn ${scope === s ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setScope(s)}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {status === 'error' && (
                <p className="text-small muted">Couldn&apos;t load the feed right now. Try again shortly.</p>
            )}
            {status === 'loading' && <p className="text-small muted">Loading feed…</p>}
            {status === 'ready' && posts.length === 0 && (
                <p className="text-small muted">No posts in this scope yet.</p>
            )}

            <div style={{ maxWidth: 640 }}>
                {status === 'ready' && posts.map((post) => (
                    <article key={post.id} className="post-card">
                        <div className="post-card__head">
                            <div className="post-card__author">
                                <span className="post-card__avatar">{post.business_name.charAt(0)}</span>
                                <div>
                                    <Link to={`/business/${post.business_slug}`} style={{ fontWeight: 600 }}>{post.business_name}</Link>
                                    <div className="text-small muted">
                                        {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                            </div>
                            <div className="row gap-2">
                                {post.is_boosted && <span className="partner-tag">Promoted</span>}
                                <ScopeTag scope={post.scope} />
                            </div>
                        </div>
                        <p style={{ margin: 0 }}>{post.content}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}
