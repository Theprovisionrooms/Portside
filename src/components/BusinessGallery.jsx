import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export default function BusinessGallery({ businessId }) {
    const [items, setItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInput = useRef(null);

    useEffect(() => {
        api.get(`/businesses/${businessId}/media`).then(setItems).catch(() => {});
    }, [businessId]);

    async function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const created = await api.upload(`/businesses/${businessId}/media`, form);
            setItems((prev) => [created, ...prev]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = '';
        }
    }

    async function handleDelete(id) {
        try {
            await api.del(`/businesses/${businessId}/media/${id}`);
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <div className="eyebrow-block">
                <span className="rule" />
                <span className="label">Gallery</span>
            </div>

            <div className="gallery-grid" style={{ marginTop: 'var(--space-4)' }}>
                {items.map((item) => (
                    <div key={item.id} className="gallery-grid__item">
                        <img src={item.url} alt={item.caption || ''} loading="lazy" />
                        <button
                            type="button"
                            className="gallery-grid__remove"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Remove photo"
                        >
                            ×
                        </button>
                    </div>
                ))}
                <label className="gallery-grid__add">
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFile}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                    <span className="text-small muted">{uploading ? 'Uploading…' : '+ Add photo'}</span>
                </label>
            </div>
            {error && <p className="text-small" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
            <p className="text-small muted" style={{ marginTop: 'var(--space-2)' }}>JPEG, PNG or WebP, up to 5MB.</p>
        </div>
    );
}
