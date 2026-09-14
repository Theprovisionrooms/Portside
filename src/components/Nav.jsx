import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SignalMark from './SignalMark.jsx';
import StatusLabel from './StatusLabel.jsx';

const LINKS = [
    { to: '/feed', label: 'Feed' },
    { to: '/directory', label: 'Directory' },
    { to: '/network', label: 'Network' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/messages', label: 'Messages' },
];

export default function Nav() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    return (
        <header className="nav">
            <div className="shell nav-inner">
                <Link to="/" className="row gap-2" onClick={() => setOpen(false)}>
                    <SignalMark size={24} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.02em' }}>
                        PORTSIDE
                    </span>
                </Link>

                <nav className="nav-links">
                    {LINKS.map((l) => (
                        <Link key={l.to} to={l.to} className={`nav-link ${pathname === l.to ? 'is-active' : ''}`}>
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="row gap-4">
                    <span className="row gap-4 nav-status-labels">
                        <StatusLabel label="PORTSIDE" value="SOUTHPORT" />
                        <StatusLabel label="NETWORK" value="128" signal />
                    </span>
                    <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>
                    <button
                        className="nav-mobile-toggle"
                        aria-label="Toggle menu"
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </div>

            <div className={`nav-mobile-panel shell ${open ? 'is-open' : ''}`}>
                {LINKS.map((l) => (
                    <Link key={l.to} to={l.to} className="nav-link" onClick={() => setOpen(false)}>
                        {l.label}
                    </Link>
                ))}
                <Link to="/dashboard" className="nav-link" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/membership" className="nav-link" onClick={() => setOpen(false)}>Pricing</Link>
            </div>
        </header>
    );
}
