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

      {/* ── Champions by Year ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div className="card-title">🏆 Champions by Year</div></div>
        {stats.yearlyWinners.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">🏆</div>
            <div className="empty-state-text">No tournament results yet — enter some scores!</div>
          </div>
        ) : (
          <div className="card-body" style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.yearlyWinners.map((w, i) => (
              <ChampionRow key={`${w.tournament_id}-${i}`} winner={w} />
            ))}
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
            <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
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
                <thead><tr><th>Score</th><th>Player &amp; Tournament</th></tr></thead>
                <tbody>
                  {stats.bestRounds.map((r, i) => (
                    <tr key={i}>
                      <td style={{ width: 64, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          fontWeight: 900,
                          fontSize: '1.1rem',
                          color: i === 0 ? 'var(--gold)' : 'var(--green-dark)',
                        }}>
                          {r.gross_score}
                        </span>
                        {i === 0 && <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: 2 }}>RECORD</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {r.player_name}{r.nickname ? ` "${r.nickname}"` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>
                          {r.tournament_name} &middot; {r.year}
                        </div>
                      </td>
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

// ── Champion row component ────────────────────────────────────────────────────
function ChampionRow({ winner: w }) {
  const isTeam = w.type === 'team';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 16px',
      borderRadius: 'var(--radius)',
      background: 'var(--cream)',
      border: '1px solid var(--gray-200)',
      flexWrap: 'wrap',
    }}>
      {/* Year */}
      <div style={{
        minWidth: 52,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--green-dark)', lineHeight: 1 }}>{w.year}</div>
      </div>

      {/* Divider */}
      <div style={{ width: 2, height: 40, background: 'var(--gold)', borderRadius: 2, flexShrink: 0 }} />

      {/* Tournament info */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <Link
          to={`/tournaments/${w.tournament_id}`}
          style={{ fontWeight: 700, color: 'var(--green-dark)', textDecoration: 'none', fontSize: '0.95rem' }}
        >
          {w.tournament_name}
        </Link>
        {w.course && (
          <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 2 }}>{w.course}</div>
        )}
      </div>

      {/* Winner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.1rem' }}>🏆</span>
        {isTeam ? (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-dark)' }}>{w.team_name}</div>
            {w.members?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {w.members.map(m => (
                  <Link key={m.id} to={`/players/${m.id}`} title={m.nickname || m.name}>
                    <Avatar src={m.avatar_url} name={m.name} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to={`/players/${w.winner_id}`}>
              <Avatar src={w.avatar_url} name={w.winner_name} size="sm" />
            </Link>
            <div>
              <Link
                to={`/players/${w.winner_id}`}
                style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-dark)', textDecoration: 'none' }}
              >
                {w.winner_name}
              </Link>
              {w.nickname && (
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>"{w.nickname}"</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score */}
      <div style={{
        background: 'var(--green-dark)',
        color: 'white',
        borderRadius: 8,
        padding: '4px 12px',
        fontWeight: 800,
        fontSize: '1rem',
        flexShrink: 0,
      }}>
        {w.winning_score}
      </div>
    </div>
  );
}
