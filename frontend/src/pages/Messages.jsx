import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Messages() {
    const [business, setBusiness] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [thread, setThread] = useState([]);
    const [draft, setDraft] = useState('');
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/me/businesses')
            .then((rows) => {
                const mine = rows[0] || null;
                setBusiness(mine);
                if (!mine) { setStatus('empty'); return; }
                return api.get(`/conversations?businessId=${mine.id}`).then((rows2) => {
                    setConversations(rows2);
                    setStatus('ready');
                    if (rows2[0]) setActiveId(rows2[0].id);
                });
            })
            .catch(() => setStatus('error'));
    }, []);

    useEffect(() => {
        if (!activeId) return;
        api.get(`/conversations/${activeId}/messages`).then(setThread).catch(() => setThread([]));
    }, [activeId]);

    async function handleSend(e) {
        e.preventDefault();
        setError('');
        if (!draft.trim()) return;
        try {
            const message = await api.post(`/conversations/${activeId}/messages`, { businessId: business.id, content: draft });
            setThread((t) => [...t, message]);
            setDraft('');
        } catch (err) {
            setError(err.message);
        }
    }

    const active = conversations.find((c) => c.id === activeId);

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Loading…</p></div>;
    }
    if (status === 'error') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Couldn&apos;t load your messages.</p></div>;
    }
    if (status === 'empty') {
        return <div className="shell" style={{ paddingTop: 'var(--space-6)' }}><p className="text-small muted">Add a business to your account to message other members.</p></div>;
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Messages</span>
            </div>
            <h2>Business-to-business</h2>

            {conversations.length === 0 && (
                <p className="text-small muted">No conversations yet. Message a business from its profile page to start one.</p>
            )}

            {conversations.length > 0 && (
                <div className="messages-layout">
                    <div className="stack messages-list">
                        {conversations.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveId(c.id)}
                                className={`messages-list__item ${c.id === activeId ? 'is-active' : ''}`}
                            >
                                <span className="mark">{c.other_business_name.charAt(0)}</span>
                                <span className="stack" style={{ minWidth: 0, alignItems: 'flex-start' }}>
                                    <span style={{ fontWeight: 600 }}>{c.other_business_name}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="card messages-thread">
                        {active && (
                            <>
                                <div className="row gap-3" style={{ marginBottom: 'var(--space-4)' }}>
                                    <span className="mark">{active.other_business_name.charAt(0)}</span>
                                    <div style={{ fontWeight: 600 }}>{active.other_business_name}</div>
                                </div>
                                <div className="stack gap-3" style={{ marginBottom: 'var(--space-5)' }}>
                                    {thread.length === 0 && <p className="text-small muted">No messages yet - say hello.</p>}
                                    {thread.map((m) => (
                                        <div key={m.id} className={`message-bubble ${m.sender_business_id === business.id ? 'message-bubble--me' : ''}`}>
                                            {m.content}
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSend} className="field">
                                    <input placeholder="Write a message" value={draft} onChange={(e) => setDraft(e.target.value)} />
                                </form>
                                {error && <p className="text-small" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
