import StatusLabel from '../components/StatusLabel.jsx';

const TIERS = [
    {
        name: 'Free',
        price: '£0',
        note: 'per month',
        features: ['Business profile & directory listing', 'Local-scope posts', 'Business-to-business DMs'],
    },
    {
        name: 'Founding member',
        price: '£0',
        note: 'for your first 6 months, Southport launch only',
        highlight: true,
        features: ['Everything in Free', 'National & international scope posts', 'Priority placement in the directory', 'Founding badge on your profile'],
    },
    {
        name: 'Premium',
        price: '£19',
        note: 'per month, after founding period',
        features: ['Everything in Founding', 'Referral analytics', 'Boosted leaderboard placement', 'Sponsored post credits'],
    },
];

export default function Membership() {
    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Membership</span>
            </div>
            <h2>Founding-member pricing</h2>
            <p className="muted" style={{ maxWidth: '52ch' }}>
                Southport is the first town on the network. Early members get founding pricing
                while the network reaches critical mass here.
            </p>

            <div className="membership-grid">
                {TIERS.map((t) => (
                    <div key={t.name} className={`card ${t.highlight ? 'membership-card--highlight' : ''}`}>
                        {t.highlight && <StatusLabel label="Status" value="Recommended" signal />}
                        <h3 style={{ marginTop: t.highlight ? 'var(--space-3)' : 0 }}>{t.name}</h3>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-h2)', margin: 'var(--space-2) 0' }}>
                            {t.price}
                        </div>
                        <p className="text-small muted">{t.note}</p>
                        <ul className="stack gap-2" style={{ margin: 'var(--space-4) 0' }}>
                            {t.features.map((f) => (
                                <li key={f} className="text-small row gap-2">
                                    <span style={{ color: 'var(--signal)' }}>—</span> {f}
                                </li>
                            ))}
                        </ul>
                        <button className={`btn ${t.highlight ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'center' }}>
                            {t.highlight ? 'Claim founding pricing' : `Choose ${t.name}`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
