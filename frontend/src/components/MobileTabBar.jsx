import { Link, useLocation } from 'react-router-dom';
import ArrowIcon from './ArrowIcon.jsx';

const TABS = [
    { to: '/feed', label: 'Feed' },
    { to: '/directory', label: 'Directory' },
    { to: '/network', label: 'Network' },
    { to: '/leaderboard', label: 'Rank' },
    { to: '/messages', label: 'DMs' },
];

export default function MobileTabBar() {
    const { pathname } = useLocation();
    return (
        <nav className="mobile-tab-bar">
            {TABS.map((t) => (
                <Link key={t.to} to={t.to} className={pathname === t.to ? 'is-active' : ''}>
                    <ArrowIcon size={14} color={pathname === t.to ? 'var(--signal)' : 'var(--muted)'} />
                    {t.label}
                </Link>
            ))}
        </nav>
    );
}
