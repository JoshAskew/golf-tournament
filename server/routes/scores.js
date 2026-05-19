const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const { tournament_id, player_id, gross_score, net_score, holes_played, notes } = req.body;
  if (!tournament_id || !player_id) {
    return res.status(400).json({ error: 'tournament_id and player_id are required' });
  }

  const result = db.prepare(`
    INSERT INTO scores (tournament_id, player_id, gross_score, net_score, holes_played, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(tournament_id, player_id) DO UPDATE SET
      gross_score = excluded.gross_score,
      net_score = excluded.net_score,
      holes_played = excluded.holes_played,
      notes = excluded.notes
  `).run(tournament_id, player_id, gross_score || null, net_score || null, holes_played || 18, notes || null);

  res.status(201).json({ id: result.lastInsertRowid, tournament_id, player_id, gross_score, net_score });
});

router.put('/:id', (req, res) => {
  const score = db.prepare('SELECT * FROM scores WHERE id = ?').get(req.params.id);
  if (!score) return res.status(404).json({ error: 'Score not found' });

  const { gross_score, net_score, holes_played, notes } = req.body;
  db.prepare(
    'UPDATE scores SET gross_score=?, net_score=?, holes_played=?, notes=? WHERE id=?'
  ).run(
    gross_score !== undefined ? gross_score : score.gross_score,
    net_score !== undefined ? net_score : score.net_score,
    holes_played || score.holes_played,
    notes !== undefined ? notes : score.notes,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM scores WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM scores WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Score not found' });
  res.json({ success: true });
});

module.exports = router;
