import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Signup() {
    const [form, setForm] = useState({ fullName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    function update(field) {
        return (e) => setForm({ ...form, [field]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            const { token } = await api.post('/auth/signup', { ...form, regionSlug: 'southport' });
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
                <span className="label">Founding member / Southport</span>
            </div>
            <h2>Join PortSide</h2>
            <form onSubmit={handleSubmit} className="stack gap-4">
                <div className="field">
                    <label>Full name</label>
                    <input value={form.fullName} onChange={update('fullName')} required />
                </div>
                <div className="field">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={update('email')} required />
                </div>
                <div className="field">
                    <label>Password</label>
                    <input type="password" value={form.password} onChange={update('password')} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Sign up</button>
            </form>
            {error && <p className="text-small" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
            <p className="text-small muted" style={{ marginTop: 'var(--space-5)' }}>
                Already a member? <Link to="/login" className="label--signal label">Log in</Link>
            </p>
        </div>
    );
}
