import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => fetch('/api/tournaments').then(r => r.json()).then(t => { setTournaments(t); setLoading(false); });
  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tournaments</div>
          <div className="page-subtitle">{tournaments.length} total events</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Tournament</button>
      </div>

      {tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏌️</div>
          <div className="empty-state-text">No tournaments yet — add your first one!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tournaments.map(t => (
            <Link key={t.id} to={`/tournaments/${t.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px', borderLeft: '4px solid var(--green-mid)' }}>
                  <div style={{ textAlign: 'center', minWidth: 56 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1 }}>{t.year}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--green-dark)' }}>{t.name}</div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginTop: 2 }}>
                      {t.course}{t.location ? ` — ${t.location}` : ''} &middot; {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'right', flexShrink: 0 }}>
                    {t.players_count > 0 && (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--green-dark)' }}>{t.players_count}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>players</div>
                      </div>
                    )}
                    {t.low_score && (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{t.low_score}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>low score</div>
                      </div>
                    )}
                    <div style={{ color: 'var(--gray-400)', alignSelf: 'center' }}>→</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <TournamentModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

export function TournamentModal({ onClose, onSave, tournament }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: tournament?.name || 'Annual Golf Tournament',
    year: tournament?.year || new Date().getFullYear(),
    date: tournament?.date || today,
    course: tournament?.course || '',
    location: tournament?.location || '',
    notes: tournament?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    const url = tournament ? `/api/tournaments/${tournament.id}` : '/api/tournaments';
    const method = tournament ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{tournament ? 'Edit Tournament' : 'Add Tournament'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tournament Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year *</label>
                <input className="form-input" type="number" value={form.year} onChange={set('year')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={set('date')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Golf Course</label>
                <input className="form-input" value={form.course} onChange={set('course')} placeholder="Pebble Beach" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={set('location')} placeholder="Monterey, CA" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Any notes about the event..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Tournament'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
