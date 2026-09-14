import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NetworkGraph from '../components/NetworkGraph.jsx';
import ArrowIcon from '../components/ArrowIcon.jsx';
import CornerMarks from '../components/CornerMarks.jsx';
import StatusLabel from '../components/StatusLabel.jsx';
import Connection from '../components/Connection.jsx';
import { api } from '../api/client';

const REGION = 'southport';

const STEPS = [
    { label: 'Find businesses', detail: 'Every independent business in the network, searchable by street and category.' },
    { label: 'Share opportunities', detail: 'Post updates, offers and events, tagged local, national or international.' },
    { label: 'Refer customers', detail: 'Send a customer to another member, tracked from referral to visit.' },
    { label: 'Build your network', detail: 'Direct message other businesses, no middleman.' },
];

export default function Landing() {
    const [topRows, setTopRows] = useState([]);
    const [businessCount, setBusinessCount] = useState(null);

    useEffect(() => {
        api.get(`/regions/${REGION}/leaderboard`).then((rows) => setTopRows(rows.slice(0, 3))).catch(() => {});
        api.get(`/regions/${REGION}/businesses`).then((rows) => setBusinessCount(rows.length)).catch(() => {});
    }, []);

    return (
        <div className="page">
            {/* hero */}
            <section className="hero-chart-wash">
                <div className="hero-corner-mark">
                    <CornerMarks size={72} />
                </div>
                <div className="shell" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-7)', position: 'relative' }}>
                    <div className="row gap-4 wrap" style={{ marginBottom: 'var(--space-5)' }}>
                        <StatusLabel label="PORTSIDE" value="SOUTHPORT" />
                        <StatusLabel label="STATUS" value="ACTIVE" signal dot />
                        <StatusLabel label="53.6407° N" value="3.0014° W" />
                    </div>

                    <div className="landing-hero-grid">
                        <div>
                            <h1 style={{ fontSize: 'var(--size-display)' }}>
                                Southport<br />businesses,<br /><span style={{ color: 'var(--signal)' }}>connected.</span>
                            </h1>
                            <p className="text-small" style={{ maxWidth: '38ch', color: 'var(--text-on-ink-muted)', marginTop: 'var(--space-4)' }}>
                                PortSide is the digital network for independent businesses in Southport.
                                Find businesses. Share opportunities. Refer customers. Build your network.
                            </p>
                            <div className="row gap-3" style={{ marginTop: 'var(--space-6)' }}>
                                <Link to="/signup" className="btn btn-primary">Join as a business</Link>
                                <Link to="/directory" className="btn btn-outline">View directory</Link>
                            </div>
                        </div>

                        <div className="corner-marks" style={{ padding: 'var(--space-4)' }}>
                            <NetworkGraph height={300} />
                        </div>
                    </div>
                </div>
            </section>

            <hr className="divider shell" />

            {/* how it works - flow, not a feature-card grid */}
            <section className="shell" style={{ paddingBottom: 'var(--space-7)' }}>
                <div className="eyebrow-block">
                    <span className="rule" />
                    <span className="label">How the network works</span>
                </div>
                <div className="how-it-works-flow">
                    {STEPS.map((s, i) => (
                        <div key={s.label} className="how-it-works-flow__item-wrap">
                            <div className="how-it-works-flow__item">
                                <span className="label label--signal">0{i + 1}</span>
                                <h3>{s.label}</h3>
                                <p className="text-small muted">{s.detail}</p>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="how-it-works-flow__arrow">
                                    <ArrowIcon size={18} color="var(--ink-line)" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <hr className="divider shell" />

            {/* live network preview */}
            <section className="shell" style={{ paddingBottom: 'var(--space-7)' }}>
                <div className="landing-preview-grid">
                    <div>
                        <div className="eyebrow-block">
                            <span className="rule" />
                            <span className="label">Leaderboard / this month</span>
                        </div>
                        {topRows.map((row, i) => (
                            <div key={row.business_id} className="leaderboard-row">
                                <div className={`leaderboard-row__rank ${i === 0 ? 'leaderboard-row__rank--top' : ''}`}>
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div className="leaderboard-row__body">
                                    <div className="leaderboard-row__name">{row.name}</div>
                                    <div className="text-small muted">
                                        +{Number(row.referrals_given_30d) + Number(row.referrals_received_30d)} connections
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Link to="/leaderboard" className="text-small label--signal label" style={{ display: 'inline-block', marginTop: 'var(--space-4)' }}>
                            Full leaderboard →
                        </Link>
                    </div>

                    <div>
                        <div className="eyebrow-block">
                            <span className="rule" />
                            <span className="label">Referrals / how it works</span>
                        </div>
                        <div className="stack gap-4">
                            <Connection fromLabel="A hotel" toLabel="A sweet shop" status="completed" />
                            <Connection fromLabel="A tattoo studio" toLabel="A coffee roaster" status="active" />
                            <Connection fromLabel="An RC cafe" toLabel="A bakery" status="pending" />
                        </div>
                    </div>
                </div>
            </section>

            <hr className="divider shell" />

            {/* founding member */}
            <section className="shell" style={{ paddingBottom: 'var(--space-8)' }}>
                <div className="card" style={{ borderColor: 'var(--signal-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
                    <div>
                        <span className="label label--signal">Founding member / Southport</span>
                        <h3 style={{ marginTop: 'var(--space-2)' }}>
                            {businessCount === null ? 'Southport businesses are' : `${businessCount} businesses are`} already on the network
                        </h3>
                        <p className="text-small muted" style={{ margin: 0 }}>Free to join, free to use. Early Southport businesses get a founding badge on their profile.</p>
                    </div>
                    <Link to="/membership" className="btn btn-primary">See pricing</Link>
                </div>
            </section>
        </div>
    );
}
