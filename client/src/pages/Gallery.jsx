import { useState, useEffect, useRef } from 'react';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const inputRef = useRef();

  const load = () => {
    const url = filter ? `/api/photos?tournament_id=${filter}` : '/api/photos';
    fetch(url).then(r => r.json()).then(p => { setPhotos(p); setLoading(false); });
  };

  useEffect(() => { fetch('/api/tournaments').then(r => r.json()).then(setTournaments); }, []);
  useEffect(() => { load(); }, [filter]);

  const handleFiles = async e => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photos', f));
    if (filter) fd.append('tournament_id', filter);
    await fetch('/api/photos', { method: 'POST', body: fd });
    setUploading(false);
    load();
  };

  const deletePhoto = async id => {
    if (!confirm('Delete this photo?')) return;
    await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    load();
    if (lightbox?.id === id) setLightbox(null);
  };

  // Lightbox keyboard nav
  useEffect(() => {
    if (!lightbox) return;
    const idx = photos.findIndex(p => p.id === lightbox.id);
    const handler = e => {
      if (e.key === 'ArrowRight') setLightbox(photos[(idx + 1) % photos.length]);
      if (e.key === 'ArrowLeft') setLightbox(photos[(idx - 1 + photos.length) % photos.length]);
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, photos]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Photo Gallery</div>
          <div className="page-subtitle">{photos.length} photos</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Tournaments</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
          </select>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : '+ Upload Photos'}
            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : photos.length === 0 ? (
        <div>
          <div
            className="upload-zone"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
            onDrop={async e => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (!files.length) return;
              setUploading(true);
              const fd = new FormData();
              files.forEach(f => fd.append('photos', f));
              if (filter) fd.append('tournament_id', filter);
              await fetch('/api/photos', { method: 'POST', body: fd });
              setUploading(false);
              load();
            }}
          >
            <div className="upload-zone-icon">📷</div>
            <div>Drop photos here or click to upload</div>
          </div>
        </div>
      ) : (
        <div className="grid-photos">
          {photos.map(p => (
            <div key={p.id} className="photo-card" onClick={() => setLightbox(p)} style={{ cursor: 'pointer' }}>
              <img src={`/uploads/${p.filename}`} alt={p.caption || 'Tournament photo'} loading="lazy" />
              <div className="photo-card-overlay">
                <div>
                  {p.caption && <div className="photo-card-caption">{p.caption}</div>}
                  {p.tournament_name && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>{p.tournament_name} {p.year}</div>}
                </div>
              </div>
              <button className="photo-card-delete" onClick={e => { e.stopPropagation(); deletePhoto(p.id); }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); const idx = photos.findIndex(p => p.id === lightbox.id); setLightbox(photos[(idx - 1 + photos.length) % photos.length]); }}
            style={{ position: 'absolute', left: 24, color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: '1.2rem', cursor: 'pointer' }}
          >‹</button>
          <img
            src={`/uploads/${lightbox.filename}`}
            alt={lightbox.caption || ''}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
          />
          <button
            onClick={e => { e.stopPropagation(); const idx = photos.findIndex(p => p.id === lightbox.id); setLightbox(photos[(idx + 1) % photos.length]); }}
            style={{ position: 'absolute', right: 24, color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: '1.2rem', cursor: 'pointer' }}
          >›</button>
          {lightbox.caption && (
            <div style={{ position: 'absolute', bottom: 24, color: 'white', fontSize: '0.9rem', textAlign: 'center' }}>{lightbox.caption}</div>
          )}
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, color: 'white', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}
