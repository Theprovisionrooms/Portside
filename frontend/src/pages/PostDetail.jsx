import { useParams, Link } from 'react-router-dom';
import ScopeTag from '../components/ScopeTag.jsx';
import Connection from '../components/Connection.jsx';
import { posts, getBusiness } from '../data/placeholderData.js';

export default function PostDetail() {
    const { id } = useParams();
    const post = posts.find((p) => p.id === id);

    if (!post) {
        return <div className="shell" style={{ paddingTop: 'var(--space-7)' }}><p>Post not found.</p></div>;
    }

    const business = getBusiness(post.businessSlug);

    return (
        <div className="shell" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)', maxWidth: 640 }}>
            <Link to="/feed" className="text-small muted">← Back to feed</Link>

            <article className="post-card" style={{ borderBottom: 'none', marginTop: 'var(--space-5)' }}>
                <div className="post-card__head">
                    <div className="post-card__author">
                        <span className="post-card__avatar">{business.name.charAt(0)}</span>
                        <div>
                            <Link to={`/business/${business.slug}`} style={{ fontWeight: 600 }}>{business.name}</Link>
                            <div className="text-small muted">{business.category} · {post.createdAt}</div>
                        </div>
                    </div>
                    <div className="row gap-2">
                        {post.sponsored && <span className="partner-tag">Partner</span>}
                        <ScopeTag scope={post.scope} />
                    </div>
                </div>
                <p style={{ fontSize: 'var(--size-lg)' }}>{post.content}</p>
            </article>

            <hr className="divider" />

            <div className="label" style={{ marginBottom: 'var(--space-3)' }}>Referred from this post</div>
            <Connection fromLabel={business.name} toLabel="Customer" status="active" />
        </div>
    );
}
