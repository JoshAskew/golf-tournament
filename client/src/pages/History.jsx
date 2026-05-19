import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function History() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">History & Records</div>
          <div className="page-subtitle">All-time stats and hall of fame</div>
        </div>
      </div>

      {/* Yearly champions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div className="card-title">Champions by Year</div></div>
        {stats.yearlyWinners.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-text">No tournament results yet</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Year</th><th>Tournament</th><th>Course</th><th>Champion</th><th>Score</th></tr>
              </thead>
              <tbody>
                {stats.yearlyWinners.map(w => (
                  <tr key={w.year}>
                    <td><strong>{w.year}</strong></td>
                    <td>{w.tournament_name}</td>
                    <td>{w.course || '—'}</td>
                    <td>🏆 <strong>{w.winner_name}</strong>{w.nickname ? ` "${w.nickname}"` : ''}</td>
                    <td><strong style={{ color: 'var(--green-dark)' }}>{w.winning_score}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Most wins */}
        <div className="card">
          <div className="card-header"><div className="card-title">Most Tournament Wins</div></div>
          {stats.mostWins.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-text">No wins recorded</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Player</th><th>Wins</th></tr></thead>
                <tbody>
                  {stats.mostWins.map((p, i) => (
                    <tr key={p.id}>
                      <td><span className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>{i + 1}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar src={p.avatar_url} name={p.name} size="sm" />
                          <Link to={`/players/${p.id}`} style={{ fontWeight: 600, color: 'var(--green-dark)', textDecoration: 'none' }}>{p.name}</Link>
                        </div>
                      </td>
                      <td><strong>{p.wins}</strong> {i === 0 ? '🏆' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Best single rounds */}
        <div className="card">
          <div className="card-header"><div className="card-title">Best Rounds Ever</div></div>
          {stats.bestRounds.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-text">No scores recorded</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Score</th><th>Player</th><th>Tournament</th><th>Year</th></tr></thead>
                <tbody>
                  {stats.bestRounds.map((r, i) => (
                    <tr key={i}>
                      <td><strong style={{ color: i === 0 ? 'var(--gold)' : 'var(--green-dark)' }}>{r.gross_score}</strong></td>
                      <td>{r.player_name}{r.nickname ? ` "${r.nickname}"` : ''}</td>
                      <td>{r.tournament_name}</td>
                      <td>{r.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Participation */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><div className="card-title">Player Stats (All Time)</div></div>
        {stats.mostTournaments.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-text">No stats yet</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Player</th><th>Events</th><th>Best Score</th><th>Avg Score</th></tr>
              </thead>
              <tbody>
                {stats.mostTournaments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar src={p.avatar_url} name={p.name} size="sm" />
                        <Link to={`/players/${p.id}`} style={{ fontWeight: 600, color: 'var(--green-dark)', textDecoration: 'none' }}>{p.name}</Link>
                        {p.nickname && <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem', fontStyle: 'italic' }}>"{p.nickname}"</span>}
                      </div>
                    </td>
                    <td>{p.count}</td>
                    <td>{p.best_score ?? '—'}</td>
                    <td>{p.avg_score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Awards hall of fame */}
      {stats.allAwards.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><div className="card-title">Awards Hall of Fame</div></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {stats.allAwards.map((a, i) => (
              <Link key={i} to={`/players/${a.player_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--gray-100)', borderRadius: 'var(--radius)', padding: '10px 14px', border: '1px solid var(--gray-200)' }}>
                  <div className="award-pill">🏅 {a.award_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginTop: 6 }}>
                    {a.player_name} &middot; {a.times_won}×
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
