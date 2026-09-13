import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScopeTag from '../components/ScopeTag.jsx';

const SCOPES = ['local', 'national', 'international'];
const TYPES = ['update', 'offer', 'event'];

export default function NewPost() {
    const [content, setContent] = useState('');
    const [scope, setScope] = useState('local');
    const [postType, setPostType] = useState('update');
    const [posted, setPosted] = useState(false);
    const navigate = useNavigate();

    function handleSubmit(e) {
        e.preventDefault();
        // wire to POST /api/posts once the backend is connected
        setPosted(true);
    }

    if (posted) {
        return (
            <div className="shell" style={{ paddingTop: 'var(--space-7)', paddingBottom: 'var(--space-8)', maxWidth: 480 }}>
                <div className="card" style={{ borderColor: 'var(--signal-dim)' }}>
                    <span className="label label--signal">Posted</span>
                    <p style={{ margin: 'var(--space-2) 0 0' }}>Your {scope} {postType} is live on the feed.</p>
                </div>
                <button className="btn btn-outline" style={{ marginTop: 'var(--space-4)' }} onClick={() => navigate('/feed')}>
                    View feed
                </button>
            </div>
        );
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 560 }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Dashboard / New post</span>
            </div>
            <h2>New post</h2>

            <form onSubmit={handleSubmit} className="stack gap-5" style={{ marginTop: 'var(--space-5)' }}>
                <div className="field">
                    <label>What's happening?</label>
                    <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} required />
                </div>

                <div className="field">
                    <label>Scope</label>
                    <div className="row gap-2 wrap">
                        {SCOPES.map((s) => (
                            <button
                                type="button" key={s}
                                className={`btn ${scope === s ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setScope(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="field">
                    <label>Type</label>
                    <div className="row gap-2 wrap">
                        {TYPES.map((t) => (
                            <button
                                type="button" key={t}
                                className={`btn ${postType === t ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setPostType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="row gap-2">
                    <span className="text-small muted">Will show as</span>
                    <ScopeTag scope={scope} />
                </div>

                <button type="submit" className="btn btn-primary">Post</button>
            </form>
        </div>
    );
}
