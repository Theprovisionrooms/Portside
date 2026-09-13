import { useState } from 'react';
import { Link } from 'react-router-dom';
import { businesses, posts, getBusiness } from '../data/placeholderData.js';

export default function Search() {
    const [query, setQuery] = useState('');
    const q = query.toLowerCase().trim();

    const businessResults = q ? businesses.filter((b) => (b.name + b.category).toLowerCase().includes(q)) : [];
    const postResults = q ? posts.filter((p) => p.content.toLowerCase().includes(q)) : [];

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 640 }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Search the network</span>
            </div>
            <div className="field" style={{ marginBottom: 'var(--space-6)' }}>
                <input
                    autoFocus
                    placeholder="Search businesses, categories or posts"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {q && businessResults.length === 0 && postResults.length === 0 && (
                <p className="muted text-small">No matches for &ldquo;{query}&rdquo;.</p>
            )}

            {businessResults.length > 0 && (
                <>
                    <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Businesses</div>
                    <div className="stack gap-3" style={{ marginBottom: 'var(--space-6)' }}>
                        {businessResults.map((b) => (
                            <Link key={b.slug} to={`/business/${b.slug}`} className="row gap-3 card">
                                <span className="mark">{b.name.charAt(0)}</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                                    <div className="text-small muted">{b.category}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {postResults.length > 0 && (
                <>
                    <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Posts</div>
                    <div className="stack gap-3">
                        {postResults.map((p) => (
                            <Link key={p.id} to={`/post/${p.id}`} className="card">
                                <div className="text-small muted">{getBusiness(p.businessSlug)?.name}</div>
                                <p style={{ margin: 0 }}>{p.content}</p>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
