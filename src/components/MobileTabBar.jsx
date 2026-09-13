import { Link, useLocation } from 'react-router-dom';
import NavIcon from './NavIcon.jsx';

const TABS = [
    { to: '/feed', label: 'Feed', icon: 'feed' },
    { to: '/directory', label: 'Directory', icon: 'directory' },
    { to: '/network', label: 'Network', icon: 'network' },
    { to: '/leaderboard', label: 'Rank', icon: 'leaderboard' },
    { to: '/messages', label: 'DMs', icon: 'messages' },
];

export default function MobileTabBar() {
    const { pathname } = useLocation();
    return (
        <nav className="mobile-tab-bar">
            {TABS.map((t) => (
                <Link key={t.to} to={t.to} className={pathname === t.to ? 'is-active' : ''}>
                    <NavIcon name={t.icon} size={19} color={pathname === t.to ? 'var(--signal)' : 'var(--muted)'} />
                    {t.label}
                </Link>
            ))}
        </nav>
    );
}
