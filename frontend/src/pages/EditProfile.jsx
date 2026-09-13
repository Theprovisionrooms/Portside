import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const REGION = 'southport';
const EMPTY_FORM = { name: '', category: '', description: '', websiteUrl: '', address: '' };

export default function EditProfile() {
    const [business, setBusiness] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/me/businesses')
            .then((rows) => {
                const existing = rows[0] || null;
                setBusiness(existing);
                if (existing) {
                    setForm({
                        name: existing.name || '',
                        category: existing.category || '',
                        description: existing.description || '',
                        websiteUrl: existing.website_url || '',
                        address: existing.address || '',
                    });
                }
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, []);

    function update(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSaved(false);
        setSaving(true);
        try {
            if (business) {
                await api.patch(`/businesses/${business.id}`, form);
            } else {
                const created = await api.post('/businesses', { ...form, regionSlug: REGION });
                setBusiness(created);
            }
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Loading…</p></div>;
    }
    if (status === 'error') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Couldn&apos;t load your business.</p></div>;
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 560 }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Dashboard / {business ? 'Edit profile' : 'Create your business'}</span>
            </div>
            <h2>{business ? 'Edit your profile' : 'Add your business'}</h2>
            <p className="text-small muted">This is what shows on your public PortSide business page.</p>

            <form onSubmit={handleSubmit} className="stack gap-4" style={{ marginTop: 'var(--space-5)' }}>
                <div className="field">
                    <label>Business name</label>
                    <input value={form.name} onChange={update('name')} required />
                </div>
                <div className="field">
                    <label>Category</label>
                    <input value={form.category} onChange={update('category')} placeholder="e.g. Coffee roaster & cafe" />
                </div>
                <div className="field">
                    <label>Description</label>
                    <textarea rows={4} value={form.description} onChange={update('description')} />
                </div>
                <div className="field">
                    <label>Website</label>
                    <input value={form.websiteUrl} onChange={update('websiteUrl')} placeholder="https://" />
                </div>
                <div className="field">
                    <label>Address</label>
                    <input value={form.address} onChange={update('address')} placeholder="Street, Southport" />
                </div>
                {error && <p className="text-small" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
                <div className="row gap-3">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : business ? 'Save changes' : 'Create business'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
                </div>
                {saved && (
                    <p className="text-small label--signal label" style={{ margin: 0 }}>
                        {business ? 'Saved.' : 'Business created — head back to your dashboard.'}
                    </p>
                )}
            </form>
        </div>
    );
}
