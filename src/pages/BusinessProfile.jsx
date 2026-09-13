import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import ScopeTag from '../components/ScopeTag.jsx';
import Connection from '../components/Connection.jsx';
import { api } from '../api/client';

export default function BusinessProfile() {
    const { slug } = useParams();
    const [business, setBusiness] = useState(null);
    const [posts, setPosts] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');

        async function load() {
            try {
                const biz = await api.get(`/businesses/${slug}`);
                const businessPosts = await api.get(`/businesses/${slug}/posts`);
                if (cancelled) return;
                setBusiness(biz);
                setPosts(businessPosts);
                setStatus('ready');

                // referral activity is only visible to logged-in members - allowed
                // to fail quietly for anonymous visitors
                try {
                    const rows = await api.get(`/referrals/business/${biz.id}`);
                    if (!cancelled) setReferrals(rows);
                } catch {
                    if (!cancelled) setReferrals([]);
                }
            } catch {
                if (!cancelled) setStatus('not-found');
            }
        }
        load();
        return () => { cancelled = true; };
    }, [slug]);

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-7)' }}><p className="text-small muted">Loading…</p></div>;
    }
    if (status === 'not-found' || !business) {
        return <div className="shell" style={{ paddingTop: 'var(--space-7)' }}><p>Business not found.</p></div>;
    }

    return (
        <div>
            <div className="tex-line-grid" style={{ borderBottom: 'var(--border-thin)' }}>
                <div className="shell" style={{ paddingTop: 'var(--space-7)', paddingBottom: 'var(--space-6)' }}>
                    <div className="row gap-4 wrap" style={{ marginBottom: 'var(--space-4)' }}>
                        <StatusLabel label="PORTSIDE" value="SOUTHPORT" />
                        {business.tier === 'founding' && <StatusLabel label="STATUS" value="FOUNDING MEMBER" signal />}
                    </div>
                    <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
                        <span className="mark corner-marks" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                            {business.name.charAt(0)}
                        </span>
                        <div>
                            <h1 style={{ fontSize: 'var(--size-h1)', marginBottom: 'var(--space-1)' }}>{business.name}</h1>
                            <p className="muted" style={{ margin: 0 }}>{business.category} · Southport</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
                <div className="business-profile-grid">
                    <div>
                        <h3>About</h3>
                        <p className="muted">{business.description}</p>

                        <hr className="divider" />

                        <h3>Recent posts</h3>
                        {posts.length === 0 && <p className="text-small muted">No posts yet.</p>}
                        {posts.map((post) => (
                            <article key={post.id} className="post-card">
                                <div className="row spread">
                                    <span className="text-small muted">
                                        {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <div className="row gap-2">
                                        {post.is_boosted && <span className="partner-tag">Promoted</span>}
                                        <ScopeTag scope={post.scope} />
                                    </div>
                                </div>
                                <p style={{ margin: 0 }}>{post.content}</p>
                            </article>
                        ))}
                    </div>

                    <aside className="stack gap-5">
                        <div className="card">
                            <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Network</div>
                            <div className="stack gap-3">
                                {business.connections !== undefined && (
                                    <StatusLabel label="Connections" value={business.connections} signal />
                                )}
                                <StatusLabel label="Tier" value={business.tier} />
                            </div>
                            <Link to="/messages" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', width: '100%', justifyContent: 'center' }}>
                                Message business
                            </Link>
                        </div>

                        {referrals.length > 0 && (
                            <div className="card">
                                <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Referral activity</div>
                                <div className="stack gap-3">
                                    {referrals.map((r) => (
                                        <Connection
                                            key={r.id}
                                            fromLabel={r.from_business_name}
                                            toLabel={r.to_business_name}
                                            status={r.status}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
