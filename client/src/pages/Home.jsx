import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import PlanningSection from '../components/PlanningSection';

const NAV_CARDS = [
  { to: '/tournaments', icon: '⛳', label: 'Tournaments', desc: 'Scores & leaderboards', color: 'var(--green-mid)' },
  { to: '/players',    icon: '👤', label: 'Players',     desc: 'Profiles & stats',       color: 'var(--green-dark)' },
  { to: '/gallery',    icon: '📷', label: 'Gallery',     desc: 'Tournament photos',      color: '#1a6b8a' },
  { to: '/history',    icon: '🏆', label: 'History',     desc: 'Records & hall of fame', color: '#8a5a1a' },
];

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tournaments').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/photos').then(r => r.json()),
      fetch('/api/players').then(r => r.json()),
    ]).then(([t, s, p, pl]) => {
      setTournaments(t);
      setStats(s);
      setPhotos(p.slice(0, 4));
      setPlayers(pl);
      setLoading(false);
    });
  }, []);

  const latest = tournaments[0];
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      {/* ── Hero ── */}
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

      {/* ── Quick nav cards ── */}
      <div className="nav-cards">
        {NAV_CARDS.map(c => (
          <Link key={c.to} to={c.to} className="nav-card" style={{ borderTopColor: c.color }}>
            <div className="nav-card-icon">{c.icon}</div>
            <div className="nav-card-title">{c.label}</div>
            <div className="nav-card-desc">{c.desc}</div>
          </Link>
        ))}
      </div>

      {/* ── Stats bar ── */}
      <div className="stat-row">
        <div className="stat-chip">
          <div className="stat-chip-value">{tournaments.length}</div>
          <div className="stat-chip-label">Tournaments</div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-value">{players.length}</div>
          <div className="stat-chip-label">Players</div>
        </div>
        {stats?.mostWins?.[0] && (
          <div className="stat-chip">
            <div className="stat-chip-value">{stats.mostWins[0].wins}</div>
            <div className="stat-chip-label">Most Wins ({stats.mostWins[0].name.split(' ')[0]})</div>
          </div>
        )}
        {stats?.bestRounds?.[0] && (
          <div className="stat-chip">
            <div className="stat-chip-value">{stats.bestRounds[0].gross_score}</div>
            <div className="stat-chip-label">Course Record</div>
          </div>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>

        {/* Latest leaderboard */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {latest ? `Latest: ${latest.name}` : 'Latest Tournament'}
              </div>
              {latest && (
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 2 }}>
                  {latest.course} · {latest.year}
                </div>
              )}
            </div>
            {latest && <Link to={`/tournaments/${latest.id}`} className="btn btn-outline btn-sm">View →</Link>}
          </div>
          {latest ? (
            latest.players_count > 0 ? (
              <LatestLeaderboard tournamentId={latest.id} />
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No scores entered yet</div>
              </div>
            )
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon">⛳</div>
              <div className="empty-state-text">
                <Link to="/tournaments" style={{ color: 'var(--green-mid)' }}>Add your first tournament</Link> to get started
              </div>
            </div>
          )}
        </div>

        {/* Recent photos or champions */}
        {photos.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Photos</div>
              <Link to="/gallery" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div className="card-body" style={{ paddingBottom: 16 }}>
              <div className="photo-strip">
                {photos.map(p => (
                  <Link key={p.id} to="/gallery" className="photo-strip-item">
                    <img src={`/uploads/${p.filename}`} alt={p.caption || 'Tournament photo'} loading="lazy" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="card-title">All-Time Winners</div>
              <Link to="/history" className="btn btn-outline btn-sm">Full History →</Link>
            </div>
            {stats?.mostWins?.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Player</th><th>Wins</th></tr></thead>
                  <tbody>
                    {stats.mostWins.map((p, i) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-text">No results yet</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Planning / polls ── */}
      <PlanningSection />

      {/* ── Champions by year ── */}
      {stats?.yearlyWinners?.length > 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Champions by Year</div>
              <Link to="/history" className="btn btn-outline btn-sm">Full History →</Link>
            </div>
            <div className="card-body" style={{ padding: '8px 20px 16px' }}>
              <div className="champions-strip">
                {stats.yearlyWinners.map(w => (
                  <div key={w.year} className="champion-row">
                    <div className="champion-year">{w.year}</div>
                    <div>🏆</div>
                    <div className="champion-name">
                      {w.winner_name}{w.nickname ? ` "${w.nickname}"` : ''}
                    </div>
                    <div className="champion-score">{w.winning_score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All-time winners alongside champions if we have photos */}
          {photos.length > 0 && stats?.mostWins?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">All-Time Wins</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Player</th><th>Wins</th></tr></thead>
                  <tbody>
                    {stats.mostWins.map((p, i) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            </div>
          )}
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
          {data.leaderboard.slice(0, 6).map((s, i) => (
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
              <td>{s.gross_score ?? '—'}</td>
              <td>{s.net_score ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
