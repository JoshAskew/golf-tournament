import { useState, useEffect } from 'react';
import Avatar from './Avatar';

export default function TeamsSection({ tournamentId, players }) {
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  const load = () =>
    fetch(`/api/teams?tournament_id=${tournamentId}`)
      .then(r => r.json())
      .then(setTeams);

  useEffect(() => { load(); }, [tournamentId]);

  const deleteTeam = async (id) => {
    if (!confirm('Remove this team?')) return;
    await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="section-heading">
        <h2>🏌️ Teams</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + Add Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: 36 }}>
            <div className="empty-state-icon">🏌️</div>
            <div className="empty-state-text">No teams yet — add teams for this tournament</div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {teams.map(team => (
            <div key={team.id} className="card">
              <div className="card-header">
                <div className="card-title">{team.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditTeam(team)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteTeam(team.id)}>✕</button>
                </div>
              </div>
              <div className="card-body" style={{ padding: '12px 20px' }}>
                {team.members.length === 0 ? (
                  <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No players added yet</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {team.members.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar src={p.avatar_url} name={p.name} size="sm" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          {p.nickname || p.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <TeamModal players={players} tournamentId={tournamentId}
          onClose={() => setShowCreate(false)}
          onSave={() => { setShowCreate(false); load(); }} />
      )}
      {editTeam && (
        <TeamModal team={editTeam} players={players} tournamentId={tournamentId}
          onClose={() => setEditTeam(null)}
          onSave={() => { setEditTeam(null); load(); }} />
      )}
    </div>
  );
}

function TeamModal({ team, players, tournamentId, onClose, onSave }) {
  const [name, setName] = useState(team?.name || '');
  const [selected, setSelected] = useState(new Set(team?.members?.map(m => m.id) || []));
  const [saving, setSaving] = useState(false);

  const toggle = id => setSelected(s => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const body = { name, player_ids: [...selected], tournament_id: tournamentId };
    const url = team ? `/api/teams/${team.id}` : '/api/teams';
    const method = team ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{team ? 'Edit Team' : 'Add Team'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Team Name *</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)}
                placeholder='e.g. "The Bogey Boys"' required />
            </div>
            <div className="form-group">
              <label className="form-label">Players</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {players.map(p => (
                  <label key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px',
                    border: `2px solid ${selected.has(p.id) ? 'var(--green-mid)' : 'var(--gray-200)'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: selected.has(p.id) ? 'rgba(46,170,63,0.06)' : 'white',
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                      style={{ accentColor: 'var(--green-mid)', width: 16, height: 16 }} />
                    <Avatar src={p.avatar_url} name={p.name} size="sm" />
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    {p.nickname && <span style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.85rem' }}>"{p.nickname}"</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : team ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
