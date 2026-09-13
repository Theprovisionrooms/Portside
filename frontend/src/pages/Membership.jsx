import StatusLabel from '../components/StatusLabel.jsx';

const FREE_FEATURES = [
    'Business profile & directory listing',
    'Local, national & international posts',
    'Business-to-business referrals',
    'Business-to-business DMs',
    'Leaderboard placement',
    'Founding badge for early Southport joiners',
];

const BOOST_STEPS = [
    { label: 'Write your post', detail: 'Nothing changes here — post as normal, no separate "ad" format.' },
    { label: 'Choose to promote it', detail: 'Pick how many days. £10 a day, no subscription, no minimum run.' },
    { label: 'It reaches more people', detail: 'Shown to more businesses across the feed, tagged Promoted. It never bumps other businesses down or sits pinned at the top.' },
];

export default function Membership() {
    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Pricing</span>
            </div>
            <h2>Free for every business on the network</h2>
            <p className="muted" style={{ maxWidth: '52ch' }}>
                Profile, posts, referrals, DMs, the leaderboard — all of it, for every business
                in Southport, for as long as PortSide exists. No tiers, no trial period, no card
                needed to join.
            </p>

            <div className="card" style={{ marginTop: 'var(--space-6)', maxWidth: '520px' }}>
                <StatusLabel label="Plan" value="Free, always" signal />
                <ul className="stack gap-2" style={{ margin: 'var(--space-4) 0 0' }}>
                    {FREE_FEATURES.map((f) => (
                        <li key={f} className="text-small row gap-2">
                            <span style={{ color: 'var(--signal)' }}>—</span> {f}
                        </li>
                    ))}
                </ul>
            </div>

            <hr className="divider" style={{ margin: 'var(--space-7) 0' }} />

            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">The one thing we charge for</span>
            </div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Promote a post — £10/day</h3>
            <p className="text-small muted" style={{ maxWidth: '58ch', marginBottom: 'var(--space-5)' }}>
                Promoting a post doesn&apos;t buy a slot at the top of the feed or push anyone
                else&apos;s post down. It just makes your post more likely to be shown, and shown
                to more people, over the day it&apos;s running — always marked Promoted, never
                mixed in as if it were organic.
            </p>

            <div className="stack gap-4" style={{ maxWidth: '560px' }}>
                {BOOST_STEPS.map((s, i) => (
                    <div key={s.label} className="row gap-3">
                        <span className="label label--signal" style={{ minWidth: '1.5rem' }}>0{i + 1}</span>
                        <div>
                            <div className="text-small" style={{ fontWeight: 600 }}>{s.label}</div>
                            <div className="text-small muted">{s.detail}</div>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-small muted" style={{ maxWidth: '58ch', marginTop: 'var(--space-6)' }}>
                Cancel anytime — you&apos;re only ever charged day by day. You can promote a post
                from the post itself once it&apos;s live.
            </p>
        </div>
    );
}
