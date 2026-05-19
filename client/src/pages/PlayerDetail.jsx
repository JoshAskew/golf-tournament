import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { PlayerModal } from './Players';

export default function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = () => fetch(`/api/players/${id}`).then(r => r.json()).then(p => { setPlayer(p); setLoading(false); });
  useEffect(() => { load(); }, [id]);

  const deletePlayer = async () => {
    if (!confirm(`Delete ${player.name}? This will remove all their scores.`)) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    navigate('/players');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!player) return <div className="empty-state"><div className="empty-state-text">Player not found</div></div>;

  const bestScore = player.scores.length ? Math.min(...player.scores.filter(s => s.gross_score).map(s => s.gross_score)) : null;
  const avgScore = player.scores.length
    ? (player.scores.filter(s => s.gross_score).reduce((a, s) => a + s.gross_score, 0) / player.scores.filter(s => s.gross_score).length).toFixed(1)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/players" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontSize: '0.9rem' }}>← Players</Link>
      </div>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar src={player.avatar_url} name={player.name} size="lg" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-dark)' }}>{player.name}</h1>
                {player.nickname && <div style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '1rem' }}>"{player.nickname}"</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={deletePlayer}>Delete</button>
              </div>
            </div>
            {player.bio && <p style={{ color: 'var(--gray-600)', marginTop: 10, fontSize: '0.9rem' }}>{player.bio}</p>}
            <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
              <div className="stat-chip">
                <div className="stat-chip-value">{player.scores.length}</div>
                <div className="stat-chip-label">Tournaments</div>
              </div>
              {bestScore && (
                <div className="stat-chip">
                  <div className="stat-chip-value">{bestScore}</div>
                  <div className="stat-chip-label">Best Score</div>
                </div>
              )}
              {avgScore && (
                <div className="stat-chip">
                  <div className="stat-chip-value">{avgScore}</div>
                  <div className="stat-chip-label">Avg Score</div>
                </div>
              )}
              {player.handicap > 0 && (
                <div className="stat-chip">
                  <div className="stat-chip-value">{player.handicap}</div>
                  <div className="stat-chip-label">Handicap</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Score history */}
        <div className="card">
          <div className="card-header"><div className="card-title">Tournament History</div></div>
          {player.scores.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-text">No scores yet</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Year</th><th>Tournament</th><th>Course</th><th>Gross</th><th>Net</th></tr>
                </thead>
                <tbody>
                  {player.scores.map(s => (
                    <tr key={s.id}>
                      <td>{s.year}</td>
                      <td><Link to={`/tournaments/${s.tournament_id}`} style={{ color: 'var(--green-dark)', textDecoration: 'none', fontWeight: 600 }}>{s.tournament_name}</Link></td>
                      <td>{s.course || '—'}</td>
                      <td>{s.gross_score ?? '—'}</td>
                      <td>{s.net_score ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Awards */}
        <div className="card">
          <div className="card-header"><div className="card-title">Awards & Honors</div></div>
          {player.awards.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-text">No awards yet</div></div>
          ) : (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {player.awards.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="award-pill">🏅 {a.award_name}</span>
                    {a.description && <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 4, marginLeft: 4 }}>{a.description}</div>}
                  </div>
                  <span className="badge badge-gray">{a.year}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <PlayerModal player={player} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); load(); }} />
      )}
    </div>
  );
}
