const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { UPLOADS_DIR } = require('../config');

const router = express.Router();

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const players = db.prepare(`
    SELECT p.*,
      COUNT(DISTINCT s.tournament_id) AS tournaments_played,
      MIN(s.gross_score) AS best_gross,
      ROUND(AVG(s.gross_score), 1) AS avg_gross
    FROM players p
    LEFT JOIN scores s ON s.player_id = p.id
    GROUP BY p.id
    ORDER BY p.name
  `).all();
  res.json(players);
});

router.get('/:id', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const scores = db.prepare(`
    SELECT s.*, t.name AS tournament_name, t.year, t.course, t.date
    FROM scores s
    JOIN tournaments t ON t.id = s.tournament_id
    WHERE s.player_id = ?
    ORDER BY t.date DESC
  `).all(req.params.id);

  const awards = db.prepare(`
    SELECT a.*, t.name AS tournament_name, t.year
    FROM awards a
    JOIN tournaments t ON t.id = a.tournament_id
    WHERE a.player_id = ?
    ORDER BY t.date DESC
  `).all(req.params.id);

  res.json({ ...player, scores, awards });
});

router.post('/', upload.single('avatar'), (req, res) => {
  const { name, nickname, bio, handicap } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(
    'INSERT INTO players (name, nickname, bio, handicap, avatar_url) VALUES (?, ?, ?, ?, ?)'
  ).run(name, nickname || null, bio || null, handicap || 0, avatar_url);

  res.status(201).json(db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', upload.single('avatar'), (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const { name, nickname, bio, handicap } = req.body;
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : player.avatar_url;

  db.prepare(
    'UPDATE players SET name=?, nickname=?, bio=?, handicap=?, avatar_url=? WHERE id=?'
  ).run(
    name || player.name,
    nickname !== undefined ? nickname : player.nickname,
    bio !== undefined ? bio : player.bio,
    handicap !== undefined ? handicap : player.handicap,
    avatar_url,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Player not found' });
  res.json({ success: true });
});

module.exports = router;
