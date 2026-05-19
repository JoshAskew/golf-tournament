import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tournaments').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([t, s]) => {
      setTournaments(t);
      setStats(s);
      setLoading(false);
    });
  }, []);

  const latest = tournaments[0];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="hero">
        <div className="hero-inner">
          <img
            src="/logo.png"
            alt="Buc-ee's Classic"
            className="hero-logo"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span className="hero-logo-fallback" style={{ display: 'none' }}>⛳</span>
          <div className="hero-text">
            <div className="hero-eyebrow">Annual Golf Tournament</div>
            <div className="hero-title">The Buc-ee's Classic</div>
            <div className="hero-sub">Track scores, stats, and memories with the boys</div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-chip">
          <div className="stat-chip-value">{tournaments.length}</div>
          <div className="stat-chip-label">Tournaments</div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-value">{stats?.mostTournaments?.length ?? 0}</div>
          <div className="stat-chip-label">Players</div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-value">{stats?.mostWins?.[0]?.wins ?? 0}</div>
          <div className="stat-chip-label">Most Wins</div>
        </div>
        {stats?.bestRounds?.[0] && (
          <div className="stat-chip">
            <div className="stat-chip-value">{stats.bestRounds[0].gross_score}</div>
            <div className="stat-chip-label">Course Record</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Latest tournament leaderboard */}
        {latest ? (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Latest: {latest.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 2 }}>
                  {latest.course} &middot; {latest.year}
                </div>
              </div>
              <Link to={`/tournaments/${latest.id}`} className="btn btn-outline btn-sm">View</Link>
            </div>
            {latest.players_count > 0 ? (
              <LatestLeaderboard tournamentId={latest.id} />
            ) : (
              <div className="empty-state" style={{ padding: '32px' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No scores yet</div>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">⛳</div>
                <div className="empty-state-text">No tournaments yet — <Link to="/tournaments">add one</Link></div>
              </div>
            </div>
          </div>
        )}

        {/* All-time winners */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All-Time Winners</div>
            <Link to="/history" className="btn btn-outline btn-sm">Full History</Link>
          </div>
          {stats?.mostWins?.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostWins.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar src={p.avatar_url} name={p.name} size="sm" />
                          <Link to={`/players/${p.id}`} style={{ fontWeight: 600, color: 'var(--green-dark)', textDecoration: 'none' }}>
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <span className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>
                          {i === 0 ? '🏆 ' : ''}{p.wins}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-text">No winners recorded yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Yearly champions */}
      {stats?.yearlyWinners?.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-title">Champions by Year</div>
          </div>
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
                    <td>🏆 {w.winner_name}{w.nickname ? ` "${w.nickname}"` : ''}</td>
                    <td>{w.winning_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LatestLeaderboard({ tournamentId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`).then(r => r.json()).then(setData);
  }, [tournamentId]);

  if (!data) return <div className="loading" style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Player</th><th>Gross</th><th>Net</th></tr>
        </thead>
        <tbody>
          {data.leaderboard.slice(0, 5).map((s, i) => (
            <tr key={s.id}>
              <td>
                <span className={i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}>
                  {i + 1}
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
              <td>{s.gross_score ?? '—'}</td>
              <td>{s.net_score ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
