import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            const { token } = await api.post('/auth/login', { email, password });
            localStorage.setItem('portside_token', token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-7)', paddingBottom: 'var(--space-8)', maxWidth: 400 }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Members</span>
            </div>
            <h2>Log in</h2>
            <form onSubmit={handleSubmit} className="stack gap-4">
                <div className="field">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="field">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Log in</button>
            </form>
            {error && <p className="text-small" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
            <p className="text-small muted" style={{ marginTop: 'var(--space-5)' }}>
                New to PortSide? <Link to="/signup" className="label--signal label">Join as a business</Link>
            </p>
        </div>
    );
}
