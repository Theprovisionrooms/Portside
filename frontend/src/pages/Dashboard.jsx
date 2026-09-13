import { Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import SandgrounderMark from '../components/SandgrounderMark.jsx';
import { getBusiness, posts, referrals } from '../data/placeholderData.js';

// stands in for the logged-in business until auth is wired to real sessions
const CURRENT_SLUG = 'candymonium';

export default function Dashboard() {
    const business = getBusiness(CURRENT_SLUG);
    const myPosts = posts.filter((p) => p.businessSlug === CURRENT_SLUG);
    const given = referrals.filter((r) => r.fromSlug === CURRENT_SLUG);
    const received = referrals.filter((r) => r.toSlug === CURRENT_SLUG);

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="row spread wrap gap-4" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="row gap-4">
                    <span className="mark" style={{ width: 56, height: 56 }}>{business.name.charAt(0)}</span>
                    <div>
                        <h2 style={{ marginBottom: 'var(--space-1)' }}>{business.name}</h2>
                        <StatusLabel label="Tier" value={business.tier} signal={business.tier !== 'free'} />
                    </div>
                </div>
                <div className="row gap-3">
                    <Link to="/dashboard/edit-profile" className="btn btn-outline">Edit profile</Link>
                    <Link to={`/business/${business.slug}`} className="btn btn-outline">View public profile</Link>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="card">
                    <div className="label">Connections</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{business.connections}</div>
                </div>
                <div className="card">
                    <div className="label">Posts</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{myPosts.length}</div>
                </div>
                <div className="card">
                    <div className="label">Referrals given</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)', color: 'var(--signal)' }}>{given.length}</div>
                </div>
                <div className="card">
                    <div className="label">Referrals received</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{received.length}</div>
                </div>
            </div>

            <div className="dashboard-lower">
                <div>
                    <h3>Quick actions</h3>
                    <div className="row gap-3 wrap">
                        <Link to="/dashboard/new-post" className="btn btn-primary">New post</Link>
                        <Link to="/network" className="btn btn-outline">Refer a customer</Link>
                        <Link to="/messages" className="btn btn-outline">Messages</Link>
                        <Link to="/membership" className="btn btn-outline">Manage membership</Link>
                    </div>
                </div>

                {business.tier !== 'free' && (
                    <div className="card row gap-5" style={{ alignItems: 'center' }}>
                        <SandgrounderMark size={72} />
                        <div>
                            <div className="label label--signal">Member status</div>
                            <p className="text-small muted" style={{ margin: 0 }}>
                                Verified Southport member, eligible for founding-member pricing while it lasts.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
