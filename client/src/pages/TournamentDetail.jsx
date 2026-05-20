import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { TournamentModal } from './Tournaments';
import TeamsSection from '../components/TeamsSection';

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [scoreTeam, setScoreTeam] = useState(null);

  const loadTeams = () => fetch(`/api/teams?tournament_id=${id}`).then(r => r.json()).then(setTeams);
  const load = () => fetch(`/api/tournaments/${id}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  useEffect(() => {
    load();
    loadTeams();
    fetch('/api/players').then(r => r.json()).then(setPlayers);
  }, [id]);

  const deleteTournament = async () => {
    if (!confirm('Delete this tournament and all its scores?')) return;
    await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
    navigate('/tournaments');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!data) return <div className="empty-state"><div className="empty-state-text">Tournament not found</div></div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/tournaments" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.9rem' }}>← Tournaments</Link>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-dark)' }}>{data.name}</h1>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginTop: 4 }}>
                {data.course}{data.location ? ` — ${data.location}` : ''} &middot; {data.year}
              </div>
              {data.notes && <p style={{ color: 'var(--gray-600)', marginTop: 10, fontSize: '0.9rem' }}>{data.notes}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={deleteTournament}>Delete</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowScoreModal(true)}>+ Add Score</button>
            <button className="btn btn-gold" onClick={() => setShowAwardModal(true)}>🏅 Add Award</button>
          </div>
        </div>
      </div>

      {/* ── Teams ── */}
      <TeamsSection tournamentId={id} players={players} />

      <div className="grid-2">
        {/* Leaderboard — teams if they exist, otherwise individual */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Leaderboard</div>
            {teams.length > 0 && (
              <button className="btn btn-gold btn-sm" onClick={() => setScoreTeam('pick')}>
                + Enter Score
              </button>
            )}
            {teams.length === 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowScoreModal(true)}>
                + Add Score
              </button>
            )}
          </div>

          {teams.length > 0 ? (
            /* ── Team leaderboard ── */
            (() => {
              const sorted = [...teams].sort((a, b) => {
                if (a.gross_score == null && b.gross_score == null) return 0;
                if (a.gross_score == null) return 1;
                if (b.gross_score == null) return -1;
                return a.gross_score - b.gross_score;
              });
              return sorted.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-text">No scores yet</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Team</th><th>Gross</th><th>Net</th></tr>
                    </thead>
                    <tbody>
                      {sorted.map((team, i) => {
                        const hasScore = team.gross_score != null;
                        return (
                          <tr key={team.id} style={{ cursor: 'pointer' }} onClick={() => setScoreTeam(team)}>
                            <td>
                              <span className={i === 0 && hasScore ? 'rank-1' : i === 1 && hasScore ? 'rank-2' : i === 2 && hasScore ? 'rank-3' : ''}>
                                {hasScore ? (i === 0 ? '🏆' : i + 1) : '—'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--green-dark)' }}>{team.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                                {team.members.map(m => m.nickname || m.name.split(' ')[0]).join(', ')}
                              </div>
                            </td>
                            <td><strong style={{ fontSize: '1.05rem' }}>{team.gross_score ?? '—'}</strong></td>
                            <td>{team.net_score ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()
          ) : (
            /* ── Individual leaderboard ── */
            data.leaderboard.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-text">No scores yet</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Player</th><th>Gross</th><th>Net</th><th></th></tr>
                  </thead>
                  <tbody>
                    {data.leaderboard.map((s, i) => (
                      <tr key={s.id}>
                        <td>
                          <span className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>
                            {i === 0 ? '🏆' : i + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar src={s.avatar_url} name={s.player_name} size="sm" />
                            <Link to={`/players/${s.player_id}`} style={{ fontWeight: 600, color: 'var(--green-dark)', textDecoration: 'none' }}>
                              {s.player_name}
                            </Link>
                          </div>
                        </td>
                        <td><strong>{s.gross_score ?? '—'}</strong></td>
                        <td>{s.net_score ?? '—'}</td>
                        <td>
                          <button className="btn btn-danger btn-sm"
                            onClick={async () => { await fetch(`/api/scores/${s.id}`, { method: 'DELETE' }); load(); }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Awards */}
        <div className="card">
          <div className="card-header"><div className="card-title">Awards</div></div>
          {data.awards.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-text">No awards yet</div>
            </div>
          ) : (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.awards.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="award-pill">🏅 {a.award_name}</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 4 }}>
                      {a.player_name}{a.nickname ? ` "${a.nickname}"` : ''}
                      {a.description ? ` — ${a.description}` : ''}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={async () => { await fetch(`/api/awards/${a.id}`, { method: 'DELETE' }); load(); }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      <TournamentPhotos tournamentId={id} photos={data.photos} onUpload={load} />

      {showEdit && <TournamentModal tournament={data} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); load(); }} />}
      {showScoreModal && <ScoreModal tournamentId={id} players={players} existing={data.leaderboard} onClose={() => setShowScoreModal(false)} onSave={() => { setShowScoreModal(false); load(); }} />}
      {showAwardModal && <AwardModal tournamentId={id} players={players} onClose={() => setShowAwardModal(false)} onSave={() => { setShowAwardModal(false); load(); }} />}

      {/* Team score entry — show picker if 'pick', else show score modal for specific team */}
      {scoreTeam === 'pick' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setScoreTeam(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Enter Score — Select Team</div>
              <button className="modal-close" onClick={() => setScoreTeam(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map(t => (
                <button key={t.id} className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => setScoreTeam(t)}>
                  <strong>{t.name}</strong>
                  <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem', marginLeft: 8 }}>
                    {t.members.map(m => m.nickname || m.name.split(' ')[0]).join(', ')}
                  </span>
                  {t.gross_score != null && <span style={{ marginLeft: 'auto', color: 'var(--green-dark)', fontWeight: 700 }}>{t.gross_score}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {scoreTeam && scoreTeam !== 'pick' && (
        <TeamScoreModal team={scoreTeam} onClose={() => setScoreTeam(null)} onSave={() => { setScoreTeam(null); loadTeams(); }} />
      )}
    </div>
  );
}

function TournamentPhotos({ tournamentId, photos, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async e => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photos', f));
    fd.append('tournament_id', tournamentId);
    await fetch('/api/photos', { method: 'POST', body: fd });
    setUploading(false);
    onUpload();
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="card-header">
        <div className="card-title">Photos ({photos.length})</div>
        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading…' : '+ Upload Photos'}
          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
        </label>
      </div>
      {photos.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">📷</div>
          <div className="empty-state-text">No photos yet — upload some memories!</div>
        </div>
      ) : (
        <div className="card-body">
          <div className="grid-photos">
            {photos.map(p => (
              <PhotoCard key={p.id} photo={p} onDelete={onUpload} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoCard({ photo, onDelete }) {
  const del = async () => {
    await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
    onDelete();
  };
  return (
    <div className="photo-card">
      <img src={`/uploads/${photo.filename}`} alt={photo.caption || 'Tournament photo'} loading="lazy" />
      <div className="photo-card-overlay">
        {photo.caption && <div className="photo-card-caption">{photo.caption}</div>}
      </div>
      <button className="photo-card-delete" onClick={del} title="Delete photo">✕</button>
    </div>
  );
}

function ScoreModal({ tournamentId, players, existing, onClose, onSave }) {
  const existingIds = new Set(existing.map(e => e.player_id));
  const available = players.filter(p => !existingIds.has(p.id));
  const [form, setForm] = useState({ player_id: available[0]?.id || '', gross_score: '', net_score: '', holes_played: 18 });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tournament_id: tournamentId }),
    });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Score</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Player *</label>
              <select className="form-select" value={form.player_id} onChange={set('player_id')} required>
                {available.length === 0 && <option value="">All players scored</option>}
                {available.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gross Score</label>
                <input className="form-input" type="number" value={form.gross_score} onChange={set('gross_score')} placeholder="72" />
              </div>
              <div className="form-group">
                <label className="form-label">Net Score</label>
                <input className="form-input" type="number" value={form.net_score} onChange={set('net_score')} placeholder="68" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Holes Played</label>
              <select className="form-select" value={form.holes_played} onChange={set('holes_played')}>
                <option value={18}>18 holes</option>
                <option value={9}>9 holes</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || available.length === 0}>{saving ? 'Saving…' : 'Save Score'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AwardModal({ tournamentId, players, onClose, onSave }) {
  const presets = ['Tournament Champion', 'Longest Drive', 'Longest Putt', 'Closest to the Pin', 'Most Pars', 'Best Comeback', 'Worst Shot of the Day', 'Most Improved', 'Spirit Award', 'Greenside Wizard', 'Custom Award'];
  const [form, setForm] = useState({ player_id: players[0]?.id || '', award_name: presets[0], description: '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/awards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tournament_id: tournamentId }),
    });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Award</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Player *</label>
              <select className="form-select" value={form.player_id} onChange={set('player_id')} required>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Award *</label>
              <select className="form-select" value={form.award_name} onChange={set('award_name')}>
                {presets.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {form.award_name === 'Custom Award' && (
              <div className="form-group">
                <label className="form-label">Custom Award Name</label>
                <input className="form-input" onChange={e => setForm(f => ({ ...f, award_name: e.target.value }))} placeholder="Enter award name..." />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" value={form.description} onChange={set('description')} placeholder="e.g. 315 yards on hole 7" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Give Award'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamScoreModal({ team, onClose, onSave }) {
  const [form, setForm] = useState({
    gross_score: team.gross_score ?? '',
    net_score: team.net_score ?? '',
    notes: team.score_notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/teams/${team.id}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gross_score: form.gross_score !== '' ? Number(form.gross_score) : null,
        net_score:   form.net_score   !== '' ? Number(form.net_score)   : null,
        notes: form.notes || null,
      }),
    });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Score — {team.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: 16 }}>
              {team.members.map(m => m.nickname || m.name.split(' ')[0]).join(' · ')}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gross Score</label>
                <input className="form-input" type="number" value={form.gross_score}
                  onChange={set('gross_score')} placeholder="72" />
              </div>
              <div className="form-group">
                <label className="form-label">Net Score</label>
                <input className="form-input" type="number" value={form.net_score}
                  onChange={set('net_score')} placeholder="68" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={form.notes} onChange={set('notes')}
                placeholder="e.g. Hole-in-one on 7" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
