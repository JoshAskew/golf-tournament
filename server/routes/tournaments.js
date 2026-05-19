const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const tournaments = db.prepare(`
    SELECT t.*,
      COUNT(DISTINCT s.player_id) AS players_count,
      MIN(s.gross_score) AS low_score
    FROM tournaments t
    LEFT JOIN scores s ON s.tournament_id = t.id
    GROUP BY t.id
    ORDER BY t.date DESC
  `).all();
  res.json(tournaments);
});

router.get('/:id', (req, res) => {
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const leaderboard = db.prepare(`
    SELECT s.*, p.name AS player_name, p.nickname, p.avatar_url, p.handicap
    FROM scores s
    JOIN players p ON p.id = s.player_id
    WHERE s.tournament_id = ?
    ORDER BY s.gross_score ASC
  `).all(req.params.id);

  const awards = db.prepare(`
    SELECT a.*, p.name AS player_name, p.nickname
    FROM awards a
    JOIN players p ON p.id = a.player_id
    WHERE a.tournament_id = ?
  `).all(req.params.id);

  const photos = db.prepare(
    'SELECT * FROM photos WHERE tournament_id = ? ORDER BY uploaded_at DESC'
  ).all(req.params.id);

  res.json({ ...tournament, leaderboard, awards, photos });
});

router.post('/', (req, res) => {
  const { name, year, date, course, location, notes } = req.body;
  if (!name || !year || !date) return res.status(400).json({ error: 'name, year, and date are required' });

  const result = db.prepare(
    'INSERT INTO tournaments (name, year, date, course, location, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, year, date, course || null, location || null, notes || null);

  res.status(201).json(db.prepare('SELECT * FROM tournaments WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  const { name, year, date, course, location, notes } = req.body;
  db.prepare(
    'UPDATE tournaments SET name=?, year=?, date=?, course=?, location=?, notes=? WHERE id=?'
  ).run(
    name || t.name,
    year || t.year,
    date || t.date,
    course !== undefined ? course : t.course,
    location !== undefined ? location : t.location,
    notes !== undefined ? notes : t.notes,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tournaments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ success: true });
});

module.exports = router;
