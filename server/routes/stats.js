const express = require('express');
const db = require('../db');

const router = express.Router();

// All-time records and hall of fame stats
router.get('/', (req, res) => {
  const mostWins = db.prepare(`
    SELECT p.id, p.name, p.nickname, p.avatar_url,
      COUNT(*) AS wins
    FROM scores s
    JOIN players p ON p.id = s.player_id
    WHERE s.gross_score = (
      SELECT MIN(s2.gross_score) FROM scores s2 WHERE s2.tournament_id = s.tournament_id
    )
    GROUP BY p.id
    ORDER BY wins DESC
    LIMIT 5
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
      COUNT(DISTINCT s.tournament_id) AS count,
      MIN(s.gross_score) AS best_score,
      ROUND(AVG(s.gross_score), 1) AS avg_score
    FROM scores s
    JOIN players p ON p.id = s.player_id
    GROUP BY p.id
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const yearlyWinners = db.prepare(`
    SELECT t.year, t.name AS tournament_name, t.course,
      p.name AS winner_name, p.nickname,
      MIN(s.gross_score) AS winning_score
    FROM tournaments t
    JOIN scores s ON s.tournament_id = t.id
    JOIN players p ON p.id = s.player_id
    WHERE s.gross_score = (
      SELECT MIN(s2.gross_score) FROM scores s2 WHERE s2.tournament_id = t.id
    )
    GROUP BY t.id
    ORDER BY t.year DESC
  `).all();

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
