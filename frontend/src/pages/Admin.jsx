import { businesses, posts } from '../data/placeholderData.js';

export default function Admin() {
    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 'var(--space-6)' }}>
                <span className="label" style={{ color: 'var(--danger)' }}>Not gated yet</span>
                <p className="text-small muted" style={{ margin: 'var(--space-2) 0 0' }}>
                    This route has no auth check in front of it, anyone with the URL can see it
                    right now. Add an admin role on the users table and a login gate on this
                    route before it goes anywhere near production.
                </p>
            </div>

            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Admin / Southport</span>
            </div>
            <h2>Network overview</h2>

            <div className="dashboard-stats">
                <div className="card">
                    <div className="label">Businesses</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{businesses.length}</div>
                </div>
                <div className="card">
                    <div className="label">Posts</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{posts.length}</div>
                </div>
                <div className="card">
                    <div className="label">Founding members</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)', color: 'var(--signal)' }}>
                        {businesses.filter((b) => b.tier === 'founding').length}
                    </div>
                </div>
                <div className="card">
                    <div className="label">Pending review</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>0</div>
                </div>
            </div>

            <h3>Businesses</h3>
            <div className="stack gap-3" style={{ marginBottom: 'var(--space-6)' }}>
                {businesses.map((b) => (
                    <div key={b.slug} className="card row spread wrap gap-3">
                        <div className="row gap-3">
                            <span className="mark">{b.name.charAt(0)}</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{b.name}</div>
                                <div className="text-small muted">{b.category} · {b.tier}</div>
                            </div>
                        </div>
                        <div className="row gap-2">
                            <button className="btn btn-outline">Feature</button>
                            <button className="btn btn-outline">Suspend</button>
                        </div>
                    </div>
                ))}
            </div>

            <h3>Recent posts</h3>
            <div className="stack gap-3">
                {posts.map((p) => (
                    <div key={p.id} className="card row spread wrap gap-3">
                        <p className="text-small" style={{ margin: 0, maxWidth: '50ch' }}>{p.content}</p>
                        <button className="btn btn-outline">Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
