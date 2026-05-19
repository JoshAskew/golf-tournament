import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => fetch('/api/players').then(r => r.json()).then(p => { setPlayers(p); setLoading(false); });
  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Players</div>
          <div className="page-subtitle">{players.length} registered players</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Player</button>
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">No players yet — add your crew!</div>
        </div>
      ) : (
        <div className="grid-2">
          {players.map(p => (
            <Link key={p.id} to={`/players/${p.id}`} className="player-card">
              <Avatar src={p.avatar_url} name={p.name} size="lg" />
              <div className="player-card-name">{p.name}</div>
              {p.nickname && <div className="player-card-nick">"{p.nickname}"</div>}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <div className="player-card-stat">
                  <strong style={{ color: 'var(--green-dark)' }}>{p.tournaments_played}</strong> tournaments
                </div>
                {p.best_gross && (
                  <div className="player-card-stat">
                    Best: <strong style={{ color: 'var(--green-dark)' }}>{p.best_gross}</strong>
                  </div>
                )}
                {p.handicap > 0 && (
                  <div className="player-card-stat">HCP {p.handicap}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <PlayerModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function PlayerModal({ onClose, onSave, player }) {
  const [form, setForm] = useState({ name: player?.name || '', nickname: player?.nickname || '', bio: player?.bio || '', handicap: player?.handicap || 0 });
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (avatar) fd.append('avatar', avatar);

    const url = player ? `/api/players/${player.id}` : '/api/players';
    const method = player ? 'PUT' : 'POST';
    await fetch(url, { method, body: fd });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{player ? 'Edit Player' : 'Add Player'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nickname</label>
                <input className="form-input" value={form.nickname} onChange={set('nickname')} placeholder='"Big Dog"' />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={form.bio} onChange={set('bio')} placeholder="Tell us about this golfer..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Handicap</label>
                <input className="form-input" type="number" step="0.1" value={form.handicap} onChange={set('handicap')} />
              </div>
              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <input className="form-input" type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Player'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { PlayerModal };
