import StatusLabel from '../components/StatusLabel.jsx';
import Connection from '../components/Connection.jsx';
import NetworkGraph from '../components/NetworkGraph.jsx';
import { referrals, getBusiness } from '../data/placeholderData.js';

const STATUS_COPY = {
    pending: 'Awaiting response',
    active: 'Customer referred',
    completed: 'Visit completed',
};

export default function Network() {
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

            <div className="card corner-marks" style={{ marginBottom: 'var(--space-6)' }}>
                <NetworkGraph height={260} />
            </div>

            <div className="stack gap-4">
                {referrals.map((r, i) => (
                    <div key={i} className="card row spread wrap gap-3">
                        <Connection fromLabel={getBusiness(r.fromSlug)?.name} toLabel={getBusiness(r.toSlug)?.name} status={r.status} />
                        <span className={`scope-tag ${r.status === 'pending' ? '' : 'scope-tag--local'}`}>
                            {STATUS_COPY[r.status]}
                        </span>
                    </div>
                ))}
            </div>

            <hr className="divider" />

            <button className="btn btn-primary">Refer a customer</button>
        </div>
    );
}
