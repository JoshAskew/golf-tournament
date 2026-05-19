const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { UPLOADS_DIR } = require('../config');

const router = express.Router();

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const { tournament_id } = req.query;
  const query = tournament_id
    ? 'SELECT p.*, t.name AS tournament_name, t.year FROM photos p LEFT JOIN tournaments t ON t.id = p.tournament_id WHERE p.tournament_id = ? ORDER BY p.uploaded_at DESC'
    : 'SELECT p.*, t.name AS tournament_name, t.year FROM photos p LEFT JOIN tournaments t ON t.id = p.tournament_id ORDER BY p.uploaded_at DESC';

  const photos = tournament_id
    ? db.prepare(query).all(tournament_id)
    : db.prepare(query).all();

  res.json(photos);
});

router.post('/', upload.array('photos', 20), (req, res) => {
  const { tournament_id, caption } = req.body;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const inserted = req.files.map(file => {
    const result = db.prepare(
      'INSERT INTO photos (tournament_id, caption, filename) VALUES (?, ?, ?)'
    ).run(tournament_id || null, caption || null, file.filename);
    return { id: result.lastInsertRowid, filename: file.filename, url: `/uploads/${file.filename}` };
  });

  res.status(201).json(inserted);
});

router.delete('/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  const filePath = path.join(UPLOADS_DIR, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
