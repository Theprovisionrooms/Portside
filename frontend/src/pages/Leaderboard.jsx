import { Link } from 'react-router-dom';
import StatusLabel from '../components/StatusLabel.jsx';
import { leaderboard } from '../data/placeholderData.js';

export default function Leaderboard() {
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

            {leaderboard.map((row) => (
                <Link key={row.slug} to={`/business/${row.slug}`} className="leaderboard-row" style={{ textDecoration: 'none' }}>
                    <div className={`leaderboard-row__rank ${row.rank === 1 ? 'leaderboard-row__rank--top' : ''}`}>
                        {String(row.rank).padStart(2, '0')}
                    </div>
                    <div className="leaderboard-row__body">
                        <div className="leaderboard-row__name">{row.name}</div>
                        <div className="text-small muted">+{row.connections} connections</div>
                    </div>
                    <div className={`leaderboard-row__trend ${row.trend === 'down' ? 'leaderboard-row__trend--down' : ''}`}>
                        {row.trend === 'up' ? '↑' : '↓'}
                    </div>
                </Link>
            ))}

            <p className="text-small muted" style={{ marginTop: 'var(--space-5)' }}>
                Ranking is calculated from posts, referrals given and referrals received over the last 30 days.
            </p>
        </div>
    );
}
