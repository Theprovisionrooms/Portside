import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import SandgrounderMark from '../components/SandgrounderMark.jsx';
import { api } from '../api/client';

export default function Dashboard() {
    const [business, setBusiness] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        api.get('/me/businesses')
            .then((rows) => {
                if (rows.length === 0) { setStatus('empty'); return; }
                setBusiness(rows[0]);
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, []);

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Loading your dashboard…</p></div>;
    }
    if (status === 'error') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Couldn&apos;t load your dashboard. Try logging in again.</p></div>;
    }
    if (status === 'empty') {
        return (
            <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
                <h2>No business on this account yet</h2>
                <p className="text-small muted" style={{ maxWidth: '52ch' }}>
                    Add a business profile to start posting and referring customers.
                </p>
                <Link to="/dashboard/edit-profile" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                    Create your business
                </Link>
            </div>
        );
    }

    const connections = Number(business.referrals_given) + Number(business.referrals_received);

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
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{connections}</div>
                </div>
                <div className="card">
                    <div className="label">Posts</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{business.posts_count}</div>
                </div>
                <div className="card">
                    <div className="label">Referrals given</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)', color: 'var(--signal)' }}>{business.referrals_given}</div>
                </div>
                <div className="card">
                    <div className="label">Referrals received</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)' }}>{business.referrals_received}</div>
                </div>
            </div>

            <div className="dashboard-lower">
                <div>
                    <h3>Quick actions</h3>
                    <div className="row gap-3 wrap">
                        <Link to="/dashboard/new-post" className="btn btn-primary">New post</Link>
                        <Link to="/network" className="btn btn-outline">Refer a customer</Link>
                        <Link to="/messages" className="btn btn-outline">Messages</Link>
                        <Link to="/membership" className="btn btn-outline">Pricing</Link>
                    </div>
                </div>

                {business.tier !== 'free' && (
                    <div className="card row gap-5" style={{ alignItems: 'center' }}>
                        <SandgrounderMark size={72} />
                        <div>
                            <div className="label label--signal">Member status</div>
                            <p className="text-small muted" style={{ margin: 0 }}>
                                Verified Southport founding member — one of the first businesses on the network.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
