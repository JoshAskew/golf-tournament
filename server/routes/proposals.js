const express = require('express');
const db = require('../db');
const router = express.Router();

// Attach options + votes to a proposal
function hydrate(proposal) {
  const options = db.prepare(`
    SELECT o.*, COUNT(v.id) AS vote_count
    FROM proposal_options o
    LEFT JOIN votes v ON v.option_id = o.id
    WHERE o.proposal_id = ?
    GROUP BY o.id
    ORDER BY o.sort_order, o.id
  `).all(proposal.id);

  options.forEach(o => {
    o.voters = db.prepare(
      'SELECT voter_name FROM votes WHERE option_id = ? ORDER BY created_at'
    ).all(o.id).map(v => v.voter_name);
  });

  return { ...proposal, options };
}

// GET all proposals (open first)
router.get('/', (req, res) => {
  const rows = db.prepare(
    `SELECT * FROM proposals ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC`
  ).all();
  res.json(rows.map(hydrate));
});

// POST create proposal
router.post('/', (req, res) => {
  const { title, description, multi_select = 1, options = [] } = req.body;
  if (!title || options.length < 2)
    return res.status(400).json({ error: 'title and at least 2 options required' });

  const p = db.prepare(
    'INSERT INTO proposals (title, description, multi_select) VALUES (?, ?, ?)'
  ).run(title, description || null, multi_select ? 1 : 0);

  options.forEach((label, i) => {
    db.prepare('INSERT INTO proposal_options (proposal_id, label, sort_order) VALUES (?, ?, ?)')
      .run(p.lastInsertRowid, label, i);
  });

  res.status(201).json(hydrate(db.prepare('SELECT * FROM proposals WHERE id = ?').get(p.lastInsertRowid)));
});

// PATCH update status (open/closed)
router.patch('/:id', (req, res) => {
  const { status } = req.body;
  if (!['open', 'closed'].includes(status))
    return res.status(400).json({ error: 'status must be open or closed' });
  db.prepare('UPDATE proposals SET status = ? WHERE id = ?').run(status, req.params.id);
  const p = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(hydrate(p));
});

// DELETE proposal
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM proposals WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// POST vote — replaces all votes for this voter in this proposal
router.post('/:id/vote', (req, res) => {
  const { voter_name, option_ids = [] } = req.body;
  if (!voter_name) return res.status(400).json({ error: 'voter_name required' });

  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Not found' });
  if (proposal.status === 'closed') return res.status(400).json({ error: 'Poll is closed' });

  // Get all option ids for this proposal
  const validIds = db.prepare('SELECT id FROM proposal_options WHERE proposal_id = ?')
    .all(req.params.id).map(o => o.id);

  // Delete existing votes from this voter in this proposal
  const placeholders = validIds.map(() => '?').join(',');
  if (validIds.length) {
    db.prepare(
      `DELETE FROM votes WHERE option_id IN (${placeholders}) AND voter_name = ?`
    ).run(...validIds, voter_name);
  }

  // Insert new votes
  const insert = db.prepare('INSERT OR IGNORE INTO votes (option_id, voter_name) VALUES (?, ?)');
  option_ids.filter(id => validIds.includes(id)).forEach(id => insert.run(id, voter_name));

  res.json(hydrate(proposal));
});

module.exports = router;
