const express = require('express');
const db = require('../db');

const router = express.Router();

// All-time records and hall of fame stats
router.get('/', (req, res) => {

  // ── Most wins — counted by Tournament Champion awards ──
  const mostWins = db.prepare(`
    SELECT p.id, p.name, p.nickname, p.avatar_url, COUNT(*) AS wins
    FROM awards a
    JOIN players p ON p.id = a.player_id
    WHERE a.award_name = 'Tournament Champion'
    GROUP BY p.id
    ORDER BY wins DESC
  `).all();

  const bestRounds = db.prepare(`
    SELECT s.gross_score, s.net_score, p.name AS player_name, p.nickname,
      t.name AS tournament_name, t.year, t.course
    FROM scores s
    JOIN players p ON p.id = s.player_id
    JOIN tournaments t ON t.id = s.tournament_id
    WHERE s.gross_score IS NOT NULL
    ORDER BY s.gross_score ASC
    LIMIT 10
  `).all();

  const mostTournaments = db.prepare(`
    SELECT p.id, p.name, p.nickname, p.avatar_url,
      (
        SELECT COUNT(DISTINCT tournament_id) FROM (
          SELECT s2.tournament_id FROM scores s2 WHERE s2.player_id = p.id
          UNION
          SELECT te2.tournament_id FROM team_members tm2
          JOIN teams te2 ON te2.id = tm2.team_id
          WHERE tm2.player_id = p.id
        )
      ) AS count,
      MIN(s.gross_score) AS best_score,
      ROUND(AVG(s.gross_score), 1) AS avg_score
    FROM players p
    LEFT JOIN scores s ON s.player_id = p.id
    WHERE EXISTS (SELECT 1 FROM scores s3 WHERE s3.player_id = p.id)
       OR EXISTS (SELECT 1 FROM team_members tm3 WHERE tm3.player_id = p.id)
    GROUP BY p.id
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // ── Yearly winners — handles both individual and team tournaments ──
  const indivYearly = db.prepare(`
    SELECT t.id AS tournament_id, t.year, t.name AS tournament_name, t.course, t.date,
      p.id AS winner_id, p.name AS winner_name, p.nickname, p.avatar_url,
      MIN(s.gross_score) AS winning_score
    FROM tournaments t
    JOIN scores s ON s.tournament_id = t.id AND s.gross_score IS NOT NULL
    JOIN players p ON p.id = s.player_id
    WHERE s.gross_score = (
      SELECT MIN(s2.gross_score) FROM scores s2
      WHERE s2.tournament_id = t.id AND s2.gross_score IS NOT NULL
    )
    AND NOT EXISTS (SELECT 1 FROM teams WHERE tournament_id = t.id)
    GROUP BY t.id
    ORDER BY t.year DESC
  `).all().map(r => ({ ...r, type: 'individual' }));

  const teamYearly = db.prepare(`
    SELECT t.id AS tournament_id, t.year, t.name AS tournament_name, t.course, t.date,
      te.id AS team_id, te.name AS team_name,
      ts.gross_score AS winning_score
    FROM tournaments t
    JOIN teams te ON te.tournament_id = t.id
    JOIN team_scores ts ON ts.team_id = te.id AND ts.gross_score IS NOT NULL
    WHERE ts.gross_score = (
      SELECT MIN(ts2.gross_score) FROM team_scores ts2
      JOIN teams te2 ON te2.id = ts2.team_id
      WHERE te2.tournament_id = t.id AND ts2.gross_score IS NOT NULL
    )
    GROUP BY t.id
    ORDER BY t.year DESC
  `).all().map(r => ({ ...r, type: 'team' }));

  // Hydrate team members for team winners
  const getMembersStmt = db.prepare(`
    SELECT p.id, p.name, p.nickname, p.avatar_url
    FROM team_members tm
    JOIN players p ON p.id = tm.player_id
    WHERE tm.team_id = ?
    ORDER BY p.name
  `);
  teamYearly.forEach(tw => { tw.members = getMembersStmt.all(tw.team_id); });

  const yearlyWinners = [...indivYearly, ...teamYearly]
    .sort((a, b) => b.year - a.year || (b.date || '').localeCompare(a.date || ''));

  const allAwards = db.prepare(`
    SELECT a.award_name, COUNT(*) AS times_won, p.name AS player_name, p.nickname, p.id AS player_id
    FROM awards a
    JOIN players p ON p.id = a.player_id
    GROUP BY a.award_name, a.player_id
    ORDER BY times_won DESC
  `).all();

  res.json({ mostWins, bestRounds, mostTournaments, yearlyWinners, allAwards });
});

module.exports = router;
