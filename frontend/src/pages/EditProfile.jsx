import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBusiness } from '../data/placeholderData.js';

// stands in for the logged-in business until auth is wired to real sessions
const CURRENT_SLUG = 'candymonium';

export default function EditProfile() {
    const business = getBusiness(CURRENT_SLUG);
    const [form, setForm] = useState({
        name: business.name,
        category: business.category,
        description: business.description,
        websiteUrl: business.websiteUrl || '',
        address: business.address || '',
    });
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();

    function update(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        // wire to PATCH /api/businesses/:slug once the backend is connected
        setSaved(true);
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 560 }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Dashboard / Edit profile</span>
            </div>
            <h2>Edit your profile</h2>
            <p className="text-small muted">This is what shows on your public PortSide business page.</p>

            <form onSubmit={handleSubmit} className="stack gap-4" style={{ marginTop: 'var(--space-5)' }}>
                <div className="field">
                    <label>Business name</label>
                    <input value={form.name} onChange={update('name')} required />
                </div>
                <div className="field">
                    <label>Category</label>
                    <input value={form.category} onChange={update('category')} />
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
                <div className="row gap-3">
                    <button type="submit" className="btn btn-primary">Save changes</button>
                    <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
                </div>
                {saved && (
                    <p className="text-small label--signal label" style={{ margin: 0 }}>
                        Saved locally. Wire this form to PATCH /api/businesses/:slug to persist it.
                    </p>
                )}
            </form>
        </div>
    );
}
