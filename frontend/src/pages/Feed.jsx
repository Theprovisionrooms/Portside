import { useState } from 'react';
import { Link } from 'react-router-dom';
import ScopeTag from '../components/ScopeTag.jsx';
import StatusLabel from '../components/StatusLabel.jsx';
import { posts, getBusiness } from '../data/placeholderData.js';

const SCOPES = ['all', 'local', 'national', 'international'];

export default function Feed() {
    const [scope, setScope] = useState('all');
    const visible = scope === 'all' ? posts : posts.filter((p) => p.scope === scope);

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
                <StatusLabel label="Posts" value={posts.length} signal />
            </div>

            <div className="row gap-2" style={{ marginBottom: 'var(--space-5)' }}>
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

            <div style={{ maxWidth: 640 }}>
                {visible.map((post) => {
                    const business = getBusiness(post.businessSlug);
                    return (
                        <article key={post.id} className="post-card">
                            <div className="post-card__head">
                                <div className="post-card__author">
                                    <span className="post-card__avatar">{business.name.charAt(0)}</span>
                                    <div>
                                        <Link to={`/business/${business.slug}`} style={{ fontWeight: 600 }}>{business.name}</Link>
                                        <div className="text-small muted">{business.category} · {post.createdAt}</div>
                                    </div>
                                </div>
                                <div className="row gap-2">
                                    {post.sponsored && <span className="partner-tag">Partner</span>}
                                    <ScopeTag scope={post.scope} />
                                </div>
                            </div>
                            <p style={{ margin: 0 }}>{post.content}</p>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
