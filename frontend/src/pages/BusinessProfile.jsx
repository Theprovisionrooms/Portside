import { useParams, Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import ScopeTag from '../components/ScopeTag.jsx';
import Connection from '../components/Connection.jsx';
import CornerMarks from '../components/CornerMarks.jsx';
import { getBusiness, posts, referrals } from '../data/placeholderData.js';

export default function BusinessProfile() {
    const { slug } = useParams();
    const business = getBusiness(slug);

    if (!business) {
        return <div className="shell" style={{ paddingTop: 'var(--space-7)' }}><p>Business not found.</p></div>;
    }

    const businessPosts = posts.filter((p) => p.businessSlug === slug);
    const businessReferrals = referrals.filter((r) => r.fromSlug === slug || r.toSlug === slug);

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
                        {businessPosts.length === 0 && <p className="text-small muted">No posts yet.</p>}
                        {businessPosts.map((post) => (
                            <article key={post.id} className="post-card">
                                <div className="row spread">
                                    <span className="text-small muted">{post.createdAt}</span>
                                    <ScopeTag scope={post.scope} />
                                </div>
                                <p style={{ margin: 0 }}>{post.content}</p>
                            </article>
                        ))}
                    </div>

                    <aside className="stack gap-5">
                        <div className="card">
                            <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Network</div>
                            <div className="stack gap-3">
                                <StatusLabel label="Connections" value={business.connections} signal />
                                <StatusLabel label="Tier" value={business.tier} />
                            </div>
                            <Link to="/messages" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', width: '100%', justifyContent: 'center' }}>
                                Message business
                            </Link>
                        </div>

                        {businessReferrals.length > 0 && (
                            <div className="card">
                                <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Referral activity</div>
                                <div className="stack gap-3">
                                    {businessReferrals.map((r, i) => (
                                        <Connection key={i} fromLabel={getBusiness(r.fromSlug)?.name} toLabel={getBusiness(r.toSlug)?.name} status={r.status} />
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
