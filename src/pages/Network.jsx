import { useEffect, useState } from 'react';
import StatusLabel from '../components/StatusLabel.jsx';
import Connection from '../components/Connection.jsx';
import NetworkGraph from '../components/NetworkGraph.jsx';
import { api } from '../api/client';

const REGION = 'southport';
const STATUS_COPY = {
    pending: 'Awaiting response',
    completed: 'Visit completed',
    declined: 'Declined',
};

export default function Network() {
    const [business, setBusiness] = useState(null);
    const [referrals, setReferrals] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [status, setStatus] = useState('loading');
    const [showForm, setShowForm] = useState(false);
    const [toBusinessId, setToBusinessId] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function load() {
        setStatus('loading');
        try {
            const [myBusinesses, businesses] = await Promise.all([
                api.get('/me/businesses'),
                api.get(`/regions/${REGION}/businesses`),
            ]);
            const mine = myBusinesses[0] || null;
            setBusiness(mine);
            setDirectory(businesses);
            if (mine) {
                const rows = await api.get(`/referrals/business/${mine.id}`);
                setReferrals(rows);
            }
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }

    useEffect(() => { load(); }, []);

    async function handleRefer(e) {
        e.preventDefault();
        setError('');
        if (!toBusinessId) {
            setError('Pick a business to refer to.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/referrals', { fromBusinessId: business.id, toBusinessId: Number(toBusinessId), note });
            setShowForm(false);
            setToBusinessId('');
            setNote('');
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Loading…</p></div>;
    }
    if (status === 'error') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Couldn&apos;t load your network.</p></div>;
    }

    const referableBusinesses = directory.filter((b) => b.id !== business?.id);

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="row spread wrap gap-3" style={{ marginBottom: 'var(--space-5)' }}>
                <div>
                    <div className="eyebrow-block">
                        <span className="rule" />
                        <span className="label">Referrals & network</span>
                    </div>
                    <h2 style={{ marginBottom: 0 }}>Business-to-business</h2>
                </div>
                <StatusLabel label="Referrals" value={referrals.length} signal />
            </div>

            <div className="corner-marks" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
                <NetworkGraph height={260} />
            </div>

            {referrals.length === 0 && <p className="text-small muted">No referrals yet.</p>}
            <div className="stack gap-4">
                {referrals.map((r) => (
                    <div key={r.id} className="card row spread wrap gap-3">
                        <Connection fromLabel={r.from_business_name} toLabel={r.to_business_name} status={r.status === 'pending' ? 'pending' : 'completed'} />
                        <span className={`scope-tag ${r.status === 'pending' ? '' : 'scope-tag--local'}`}>
                            {STATUS_COPY[r.status] || r.status}
                        </span>
                    </div>
                ))}
            </div>

            <hr className="divider" />

            {!business && <p className="text-small muted">Add a business to your account to refer customers.</p>}

            {business && !showForm && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>Refer a customer</button>
            )}

            {business && showForm && (
                <form onSubmit={handleRefer} className="stack gap-4" style={{ maxWidth: 420 }}>
                    <div className="field">
                        <label>Refer to</label>
                        <select value={toBusinessId} onChange={(e) => setToBusinessId(e.target.value)} required>
                            <option value="">Choose a business…</option>
                            {referableBusinesses.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Note (optional)</label>
                        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                    {error && <p className="text-small" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
                    <div className="row gap-3">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Sending…' : 'Send referral'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
}
