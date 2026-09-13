import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ScopeTag from '../components/ScopeTag.jsx';
import { api } from '../api/client';

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        setStatus('loading');
        api.get(`/posts/${id}`)
            .then((row) => { setPost(row); setStatus('ready'); })
            .catch(() => setStatus('not-found'));
    }, [id]);

    if (status === 'loading') {
        return <div className="shell" style={{ paddingTop: 'var(--space-7)' }}><p className="text-small muted">Loading…</p></div>;
    }
    if (status === 'not-found' || !post) {
        return <div className="shell" style={{ paddingTop: 'var(--space-7)' }}><p>Post not found.</p></div>;
    }

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 640 }}>
            <Link to="/feed" className="text-small muted">← Back to feed</Link>

            <article className="post-card" style={{ borderBottom: 'none', marginTop: 'var(--space-5)' }}>
                <div className="post-card__head">
                    <div className="post-card__author">
                        <span className="post-card__avatar">{post.business_name.charAt(0)}</span>
                        <div>
                            <Link to={`/business/${post.business_slug}`} style={{ fontWeight: 600 }}>{post.business_name}</Link>
                            <div className="text-small muted">
                                {post.category} · {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                    </div>
                    <div className="row gap-2">
                        {post.is_boosted && <span className="partner-tag">Promoted</span>}
                        <ScopeTag scope={post.scope} />
                    </div>
                </div>
                <p style={{ fontSize: 'var(--size-lg)' }}>{post.content}</p>
            </article>
        </div>
    );
}
