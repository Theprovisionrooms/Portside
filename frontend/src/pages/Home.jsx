import { useEffect, useState } from 'react';
import { api } from '../api/client';

const REGION = 'southport';

export default function Home() {
    const [posts, setPosts] = useState([]);
    const [scope, setScope] = useState('');

    useEffect(() => {
        api.get(`/regions/${REGION}/feed${scope ? `?scope=${scope}` : ''}`).then(setPosts).catch(console.error);
    }, [scope]);

    return (
        <section>
            <h1>Southport feed</h1>
            <div>
                {['', 'local', 'national', 'international'].map((s) => (
                    <button key={s} onClick={() => setScope(s)}>{s || 'all'}</button>
                ))}
            </div>
            <ul>
                {posts.map((p) => (
                    <li key={p.id}>
                        <strong>{p.business_name}</strong> — {p.content}
                        {p.is_sponsored && <em> (sponsored)</em>}
                    </li>
                ))}
            </ul>
        </section>
    );
}
