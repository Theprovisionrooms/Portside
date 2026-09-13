import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import { api } from '../api/client';

const REGION = 'southport';

export default function Leaderboard() {
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        api.get(`/regions/${REGION}/leaderboard`)
            .then((data) => { setRows(data); setStatus('ready'); })
            .catch(() => setStatus('error'));
    }, []);

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 640 }}>
            <div className="row spread wrap gap-3" style={{ marginBottom: 'var(--space-5)' }}>
                <div>
                    <div className="eyebrow-block">
                        <span className="rule" />
                        <span className="label">Leaderboard</span>
                    </div>
                    <h2 style={{ marginBottom: 0 }}>Busiest this month</h2>
                </div>
                <StatusLabel label="Period" value="30 DAYS" />
            </div>

            {status === 'loading' && <p className="text-small muted">Loading…</p>}
            {status === 'error' && <p className="text-small muted">Couldn&apos;t load the leaderboard right now.</p>}

            {status === 'ready' && rows.map((row, i) => {
                const connections = Number(row.referrals_given_30d) + Number(row.referrals_received_30d);
                return (
                    <Link key={row.business_id} to={`/business/${row.slug}`} className="leaderboard-row" style={{ textDecoration: 'none' }}>
                        <div className={`leaderboard-row__rank ${i === 0 ? 'leaderboard-row__rank--top' : ''}`}>
                            {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="leaderboard-row__body">
                            <div className="leaderboard-row__name">{row.name}</div>
                            <div className="text-small muted">+{connections} connections · {row.posts_last_30d} posts</div>
                        </div>
                    </Link>
                );
            })}

            <p className="text-small muted" style={{ marginTop: 'var(--space-5)' }}>
                Ranking is calculated from posts, referrals given and referrals received over the last 30 days.
            </p>
        </div>
    );
}
