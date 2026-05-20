const express = require('express');
const db = require('../db');
const router = express.Router();

function hydrateTeam(team) {
  const members = db.prepare(`
    SELECT p.id, p.name, p.nickname, p.avatar_url, p.handicap
    FROM team_members tm
    JOIN players p ON p.id = tm.player_id
    WHERE tm.team_id = ?
    ORDER BY p.name
  `).all(team.id);

  const score = db.prepare('SELECT * FROM team_scores WHERE team_id = ?').get(team.id) || {};
  return { ...team, members, gross_score: score.gross_score ?? null, net_score: score.net_score ?? null, score_notes: score.notes ?? null };
}

// GET all teams for a tournament
router.get('/', (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  const teams = db.prepare(
    'SELECT * FROM teams WHERE tournament_id = ? ORDER BY id'
  ).all(tournament_id);
  res.json(teams.map(hydrateTeam));
});

// POST create team
router.post('/', (req, res) => {
  const { tournament_id, name, player_ids = [] } = req.body;
  if (!tournament_id || !name) return res.status(400).json({ error: 'tournament_id and name required' });

  const result = db.prepare('INSERT INTO teams (tournament_id, name) VALUES (?, ?)').run(tournament_id, name);
  const teamId = result.lastInsertRowid;

  player_ids.forEach(pid => {
    db.prepare('INSERT OR IGNORE INTO team_members (team_id, player_id) VALUES (?, ?)').run(teamId, pid);
  });

  res.status(201).json(hydrateTeam(db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId)));
});

// PUT update team name
router.put('/:id', (req, res) => {
  const { name, player_ids } = req.body;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  if (name) db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, req.params.id);

  if (player_ids) {
    db.prepare('DELETE FROM team_members WHERE team_id = ?').run(req.params.id);
    player_ids.forEach(pid => {
      db.prepare('INSERT OR IGNORE INTO team_members (team_id, player_id) VALUES (?, ?)').run(req.params.id, pid);
    });
  }

  res.json(hydrateTeam(db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id)));
});

// POST set/update team score
router.post('/:id/score', (req, res) => {
  const { gross_score, net_score, notes } = req.body;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  db.prepare(`
    INSERT INTO team_scores (team_id, gross_score, net_score, notes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(team_id) DO UPDATE SET
      gross_score = excluded.gross_score,
      net_score   = excluded.net_score,
      notes       = excluded.notes
  `).run(req.params.id, gross_score ?? null, net_score ?? null, notes ?? null);

  res.json(hydrateTeam(team));
});

// DELETE team
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Team not found' });
  res.json({ success: true });
});

module.exports = router;
