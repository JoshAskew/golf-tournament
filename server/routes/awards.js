const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/tournament/:tournamentId', (req, res) => {
  const awards = db.prepare(`
    SELECT a.*, p.name AS player_name, p.nickname, p.avatar_url
    FROM awards a
    JOIN players p ON p.id = a.player_id
    WHERE a.tournament_id = ?
  `).all(req.params.tournamentId);
  res.json(awards);
});

router.post('/', (req, res) => {
  const { tournament_id, player_id, award_name, description } = req.body;
  if (!tournament_id || !player_id || !award_name) {
    return res.status(400).json({ error: 'tournament_id, player_id, and award_name are required' });
  }

  const result = db.prepare(
    'INSERT INTO awards (tournament_id, player_id, award_name, description) VALUES (?, ?, ?, ?)'
  ).run(tournament_id, player_id, award_name, description || null);

  res.status(201).json({ id: result.lastInsertRowid, tournament_id, player_id, award_name, description });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM awards WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Award not found' });
  res.json({ success: true });
});

module.exports = router;
