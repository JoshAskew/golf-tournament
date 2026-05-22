const express = require('express');
const db = require('../db');

const router = express.Router();

// GET all events with hydrated dates + votes + rsvps
router.get('/', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();

  events.forEach(ev => {
    const dates = db.prepare('SELECT * FROM event_dates WHERE event_id = ? ORDER BY date').all(ev.id);
    dates.forEach(d => {
      d.votes = db.prepare('SELECT * FROM event_date_votes WHERE event_date_id = ?').all(d.id);
    });
    ev.dates = dates;
    ev.rsvps = db.prepare('SELECT * FROM event_rsvps WHERE event_id = ? ORDER BY created_at').all(ev.id);
  });

  res.json(events);
});

// POST create event (with optional proposed dates)
router.post('/', (req, res) => {
  const { title, description, location, format, notes, dates } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const result = db.prepare(
    'INSERT INTO events (title, description, location, format, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description || null, location || null, format || null, notes || null);

  const eventId = result.lastInsertRowid;

  if (Array.isArray(dates) && dates.length) {
    const insertDate = db.prepare('INSERT INTO event_dates (event_id, date) VALUES (?, ?)');
    dates.filter(Boolean).forEach(d => insertDate.run(eventId, d));
  }

  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  ev.dates = db.prepare('SELECT * FROM event_dates WHERE event_id = ?').all(eventId);
  ev.dates.forEach(d => { d.votes = []; });
  ev.rsvps = [];

  res.status(201).json(ev);
});

// PUT update event fields (title, description, location, format, notes, status, confirmed_date)
router.put('/:id', (req, res) => {
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found' });

  const { title, description, location, format, notes, status, confirmed_date } = req.body;

  db.prepare(`
    UPDATE events SET
      title = ?, description = ?, location = ?, format = ?,
      notes = ?, status = ?, confirmed_date = ?
    WHERE id = ?
  `).run(
    title         ?? ev.title,
    description   ?? ev.description,
    location      ?? ev.location,
    format        ?? ev.format,
    notes         ?? ev.notes,
    status        ?? ev.status,
    confirmed_date !== undefined ? confirmed_date : ev.confirmed_date,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

// DELETE event
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
});

// POST add a proposed date to an existing event
router.post('/:id/dates', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const result = db.prepare('INSERT INTO event_dates (event_id, date) VALUES (?, ?)').run(req.params.id, date);
  res.status(201).json(db.prepare('SELECT * FROM event_dates WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE a proposed date
router.delete('/dates/:dateId', (req, res) => {
  const result = db.prepare('DELETE FROM event_dates WHERE id = ?').run(req.params.dateId);
  if (result.changes === 0) return res.status(404).json({ error: 'Date not found' });
  res.json({ success: true });
});

// POST vote on dates (batch — all dates for one voter in one call)
// body: { voter_name, votes: [{ date_id, availability }] }
router.post('/:id/vote', (req, res) => {
  const { voter_name, votes } = req.body;
  if (!voter_name || !Array.isArray(votes)) {
    return res.status(400).json({ error: 'voter_name and votes array required' });
  }

  const upsert = db.prepare(`
    INSERT INTO event_date_votes (event_date_id, voter_name, availability)
    VALUES (?, ?, ?)
    ON CONFLICT(event_date_id, voter_name) DO UPDATE SET availability = excluded.availability
  `);

  db.transaction(() => {
    votes.forEach(v => upsert.run(v.date_id, voter_name, v.availability));
  })();

  res.json({ success: true });
});

// POST RSVP to a confirmed event
// body: { player_name, status: 'yes'|'maybe'|'no' }
router.post('/:id/rsvp', (req, res) => {
  const { player_name, status } = req.body;
  if (!player_name || !status) {
    return res.status(400).json({ error: 'player_name and status required' });
  }

  db.prepare(`
    INSERT INTO event_rsvps (event_id, player_name, status)
    VALUES (?, ?, ?)
    ON CONFLICT(event_id, player_name) DO UPDATE SET status = excluded.status
  `).run(req.params.id, player_name, status);

  res.json({ success: true });
});

module.exports = router;
