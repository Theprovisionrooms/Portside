import { useState } from 'react';
import { getBusiness } from '../data/placeholderData.js';

const CONVERSATIONS = [
    { slug: 'the-victoria-hotel', preview: 'Function room is free for the 14th if you want it.', unread: true,
      thread: [
          { from: 'them', text: "We've got a launch night booked, want to cross-promote?" },
          { from: 'me', text: 'Yes, send over the date and we\'ll post it through the network.' },
          { from: 'them', text: 'Function room is free for the 14th if you want it.' },
      ] },
    { slug: 'joyces-irish-whiskey', preview: 'Sent through the stockist list, let us know.', unread: false,
      thread: [
          { from: 'them', text: 'Sent through the stockist list, let us know if any Southport shops fit.' },
      ] },
    { slug: 'lord-street-roasters', preview: 'Happy to trial a wholesale order for the studio.', unread: false,
      thread: [
          { from: 'me', text: 'Any chance of a wholesale account for the studio?' },
          { from: 'them', text: 'Happy to trial a wholesale order for the studio.' },
      ] },
];

export default function Messages() {
    const [activeSlug, setActiveSlug] = useState(CONVERSATIONS[0].slug);
    const active = CONVERSATIONS.find((c) => c.slug === activeSlug);
    const activeBusiness = getBusiness(activeSlug);

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Messages</span>
            </div>
            <h2>Business-to-business</h2>

            <div className="messages-layout">
                <div className="stack messages-list">
                    {CONVERSATIONS.map((c) => {
                        const b = getBusiness(c.slug);
                        return (
                            <button
                                key={c.slug}
                                onClick={() => setActiveSlug(c.slug)}
                                className={`messages-list__item ${c.slug === activeSlug ? 'is-active' : ''}`}
                            >
                                <span className="mark">{b.name.charAt(0)}</span>
                                <span className="stack" style={{ minWidth: 0, alignItems: 'flex-start' }}>
                                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                                    <span className="text-small muted" style={{
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                                    }}>{c.preview}</span>
                                </span>
                                {c.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal)', marginLeft: 'auto' }} />}
                            </button>
                        );
                    })}
                </div>

                <div className="card messages-thread">
                    <div className="row gap-3" style={{ marginBottom: 'var(--space-4)' }}>
                        <span className="mark">{activeBusiness.name.charAt(0)}</span>
                        <div>
                            <div style={{ fontWeight: 600 }}>{activeBusiness.name}</div>
                            <div className="text-small muted">{activeBusiness.category}</div>
                        </div>
                    </div>
                    <div className="stack gap-3" style={{ marginBottom: 'var(--space-5)' }}>
                        {active.thread.map((m, i) => (
                            <div key={i} className={`message-bubble ${m.from === 'me' ? 'message-bubble--me' : ''}`}>
                                {m.text}
                            </div>
                        ))}
                    </div>
                    <div className="field">
                        <input placeholder="Write a message" />
                    </div>
                </div>
            </div>
        </div>
    );
}
