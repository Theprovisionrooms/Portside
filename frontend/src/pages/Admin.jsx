import { useEffect, useState } from 'react';
import { api } from '../api/client';

const REGION = 'southport';

export default function Admin() {
    const [overview, setOverview] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState('loading');

    function loadAll() {
        setStatus('loading');
        Promise.all([
            api.get(`/admin/overview?region=${REGION}`),
            api.get(`/admin/businesses?region=${REGION}`),
            api.get(`/admin/posts?region=${REGION}`),
        ])
            .then(([overviewRes, businessesRes, postsRes]) => {
                setOverview(overviewRes);
                setBusinesses(businessesRes);
                setPosts(postsRes);
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }

    useEffect(loadAll, []);

    async function toggleFeature(id) {
        await api.post(`/admin/businesses/${id}/feature`);
        loadAll();
    }
    async function toggleSuspend(id) {
        await api.post(`/admin/businesses/${id}/suspend`);
        loadAll();
    }
    async function removePost(id) {
        await api.del(`/admin/posts/${id}`);
        loadAll();
    }

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Loading…</p></div>;
    }
    if (status === 'error') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Couldn&apos;t load admin data.</p></div>;
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Admin / Southport</span>
            </div>
            <h2>Network overview</h2>

            <div className="dashboard-stats">
                <div className="card">
                    <div className="label">Businesses</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{overview.businesses}</div>
                </div>
                <div className="card">
                    <div className="label">Posts</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{overview.posts}</div>
                </div>
                <div className="card">
                    <div className="label">Founding members</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)', color: 'var(--signal)' }}>
                        {overview.founding_members}
                    </div>
                </div>
                <div className="card">
                    <div className="label">Suspended</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{overview.suspended_businesses}</div>
                </div>
            </div>

            <h3>Businesses</h3>
            <div className="stack gap-3" style={{ marginBottom: 'var(--space-6)' }}>
                {businesses.map((b) => (
                    <div key={b.id} className="card row spread wrap gap-3">
                        <div className="row gap-3">
                            <span className="mark">{b.name.charAt(0)}</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{b.name}</div>
                                <div className="text-small muted">
                                    {b.category} · {b.tier}{b.suspended ? ' · suspended' : ''}{b.featured ? ' · featured' : ''}
                                </div>
                            </div>
                        </div>
                        <div className="row gap-2">
                            <button className="btn btn-outline" onClick={() => toggleFeature(b.id)}>
                                {b.featured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button className="btn btn-outline" onClick={() => toggleSuspend(b.id)}>
                                {b.suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h3>Recent posts</h3>
            <div className="stack gap-3">
                {posts.map((p) => (
                    <div key={p.id} className="card row spread wrap gap-3">
                        <p className="text-small" style={{ margin: 0, maxWidth: '50ch' }}>
                            <strong>{p.business_name}:</strong> {p.content}
                        </p>
                        <button className="btn btn-outline" onClick={() => removePost(p.id)}>Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
