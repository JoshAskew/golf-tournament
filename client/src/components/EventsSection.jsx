import { useState, useEffect } from 'react';

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtShort(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EventsSection() {
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [voting, setVoting] = useState(null);
  const [rsvping, setRsvping] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () =>
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/players').then(r => r.json()),
    ]).then(([e, p]) => { setEvents(e); setPlayers(p); });

  useEffect(() => { load(); }, []);

  const active = events.filter(e => e.status !== 'cancelled');

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--green-dark)', margin: 0 }}>
          Upcoming Events
        </h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Event</button>
      </div>

      {active.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon">🗓</div>
            <div className="empty-state-text">No upcoming events — plan something!</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {active.map(ev => (
          <EventCard
            key={ev.id}
            event={ev}
            onVote={() => setVoting(ev)}
            onRsvp={() => setRsvping(ev)}
            onConfirm={() => setConfirming(ev)}
            onEdit={() => setEditing(ev)}
            onDelete={async () => {
              if (!confirm(`Delete "${ev.title}"?`)) return;
              await fetch(`/api/events/${ev.id}`, { method: 'DELETE' });
              load();
            }}
            onCancel={async () => {
              if (!confirm('Mark this event as cancelled?')) return;
              await fetch(`/api/events/${ev.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
              });
              load();
            }}
            onReopen={async () => {
              await fetch(`/api/events/${ev.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'planning', confirmed_date: null }),
              });
              load();
            }}
          />
        ))}
      </div>

      {showCreate && (
        <EventModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />
      )}
      {editing && (
        <EventModal event={editing} onClose={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />
      )}
      {voting && (
        <VoteModal
          event={voting}
          players={players}
          onClose={() => setVoting(null)}
          onSave={() => { setVoting(null); load(); }}
        />
      )}
      {confirming && (
        <ConfirmModal
          event={confirming}
          onClose={() => setConfirming(null)}
          onSave={() => { setConfirming(null); load(); }}
        />
      )}
      {rsvping && (
        <RsvpModal
          event={rsvping}
          players={players}
          onClose={() => setRsvping(null)}
          onSave={() => { setRsvping(null); load(); }}
        />
      )}
    </div>
  );
}

function EventCard({ event: ev, onVote, onRsvp, onConfirm, onEdit, onDelete, onCancel, onReopen }) {
  const isPlanning  = ev.status === 'planning';
  const isConfirmed = ev.status === 'confirmed';

  // Best proposed date = most "yes" votes
  const bestDateId = isPlanning && ev.dates.length > 0
    ? ev.dates.reduce((bestId, d) => {
        const yes = d.votes.filter(v => v.availability === 'yes').length;
        const bestYes = bestId != null
          ? ev.dates.find(x => x.id === bestId)?.votes.filter(v => v.availability === 'yes').length ?? -1
          : -1;
        return yes > bestYes ? d.id : bestId;
      }, null)
    : null;

  const going    = ev.rsvps.filter(r => r.status === 'yes');
  const maybe    = ev.rsvps.filter(r => r.status === 'maybe');
  const notGoing = ev.rsvps.filter(r => r.status === 'no');

  const statusBadge = isPlanning
    ? { label: '📋 PLANNING',   bg: 'var(--gold)',  color: '#000' }
    : isConfirmed
    ? { label: '✅ CONFIRMED',  bg: '#d4edda',       color: '#155724' }
    : { label: '❌ CANCELLED',  bg: '#f8d7da',       color: '#721c24' };

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                padding: '2px 9px', borderRadius: 999,
                background: statusBadge.bg, color: statusBadge.color,
              }}>
                {statusBadge.label}
              </span>
              {ev.format && (
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{ev.format}</span>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--green-dark)' }}>{ev.title}</div>
            {ev.location && (
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: 2 }}>📍 {ev.location}</div>
            )}
            {isConfirmed && ev.confirmed_date && (
              <div style={{ fontSize: '0.9rem', color: 'var(--green-mid)', fontWeight: 600, marginTop: 4 }}>
                🗓 {fmtDate(ev.confirmed_date)}
              </div>
            )}
            {ev.description && (
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginTop: 6 }}>{ev.description}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
          </div>
        </div>

        {/* Planning: date vote tallies */}
        {isPlanning && ev.dates.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: 8,
            }}>When works?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ev.dates.map(d => {
                const yes = d.votes.filter(v => v.availability === 'yes').length;
                const mbe = d.votes.filter(v => v.availability === 'maybe').length;
                const no  = d.votes.filter(v => v.availability === 'no').length;
                const isBest = d.id === bestDateId && yes > 0;
                return (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '7px 12px', borderRadius: 8,
                    background: isBest ? '#e8f5e9' : '#f7f7f7',
                    border: `1px solid ${isBest ? 'var(--green-mid)' : 'transparent'}`,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', minWidth: 60 }}>
                      {fmtShort(d.date)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.82rem', flex: 1 }}>
                      {yes > 0 && <span>✅ {yes}</span>}
                      {mbe > 0 && <span>🟡 {mbe}</span>}
                      {no  > 0 && <span>❌ {no}</span>}
                      {yes === 0 && mbe === 0 && no === 0 && (
                        <span style={{ color: 'var(--gray-400)' }}>No votes yet</span>
                      )}
                    </div>
                    {isBest && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green-mid)', letterSpacing: '0.04em' }}>
                        BEST
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirmed: RSVP summary */}
        {isConfirmed && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {going.length > 0 && (
              <div style={{ fontSize: '0.85rem' }}>
                <strong>✅ Going ({going.length}):</strong>{' '}
                <span style={{ color: 'var(--gray-600)' }}>{going.map(r => r.player_name).join(', ')}</span>
              </div>
            )}
            {maybe.length > 0 && (
              <div style={{ fontSize: '0.85rem' }}>
                <strong>🟡 Maybe ({maybe.length}):</strong>{' '}
                <span style={{ color: 'var(--gray-600)' }}>{maybe.map(r => r.player_name).join(', ')}</span>
              </div>
            )}
            {notGoing.length > 0 && (
              <div style={{ fontSize: '0.85rem' }}>
                <strong>❌ Can't make it ({notGoing.length}):</strong>{' '}
                <span style={{ color: 'var(--gray-600)' }}>{notGoing.map(r => r.player_name).join(', ')}</span>
              </div>
            )}
            {ev.rsvps.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>No RSVPs yet</div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {isPlanning && (
            <>
              <button className="btn btn-primary btn-sm" onClick={onVote}>
                🗓 Vote on Dates
              </button>
              {ev.dates.length > 0 && (
                <button className="btn btn-gold btn-sm" onClick={onConfirm}>✅ Confirm Date</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel Event</button>
            </>
          )}
          {isConfirmed && (
            <>
              <button className="btn btn-primary btn-sm" onClick={onRsvp}>RSVP</button>
              <button className="btn btn-outline btn-sm" onClick={onReopen}>Reopen Planning</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit Event Modal ─────────────────────────────────────────────────
function EventModal({ event, onClose, onSave }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title:       event?.title       || '',
    description: event?.description || '',
    location:    event?.location    || '',
    format:      event?.format      || '',
    notes:       event?.notes       || '',
  });
  const [dates, setDates] = useState(['']);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const addDate    = () => setDates(d => [...d, '']);
  const removeDate = i  => setDates(d => d.filter((_, idx) => idx !== i));
  const setDate    = (i, val) => setDates(d => d.map((x, idx) => idx === i ? val : x));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    if (isEdit) {
      await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, dates: dates.filter(Boolean) }),
      });
    }
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Event' : 'New Event'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input className="form-input" value={form.title} onChange={set('title')} placeholder="Summer Scramble" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={set('location')} placeholder="Topgolf Austin" />
              </div>
              <div className="form-group">
                <label className="form-label">Format</label>
                <input className="form-input" value={form.format} onChange={set('format')} placeholder="Scramble, Best Ball…" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={set('description')} placeholder="Any extra details…" />
            </div>
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Proposed Dates</label>
                {dates.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className="form-input"
                      type="date"
                      value={d}
                      onChange={e => setDate(i, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {dates.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDate(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={addDate}>+ Add Another Date</button>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vote on Dates Modal ───────────────────────────────────────────────────────
function VoteModal({ event: ev, players, onClose, onSave }) {
  const [name, setName] = useState('');
  const [votes, setVotes] = useState({});
  const [saving, setSaving] = useState(false);

  const prefill = (voterName) => {
    const pre = {};
    ev.dates.forEach(d => {
      const v = d.votes.find(v => v.voter_name.toLowerCase() === voterName.toLowerCase());
      if (v) pre[d.id] = v.availability;
    });
    setVotes(pre);
  };

  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/events/${ev.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voter_name: name.trim(),
        votes: ev.dates.map(d => ({ date_id: d.id, availability: votes[d.id] || 'no' })),
      }),
    });
    onSave();
  };

  const btnStyle = (dateId, val) => {
    const active = votes[dateId] === val;
    const colors = { yes: ['#e8f5e9', 'var(--green-mid)'], maybe: ['#fffbeb', '#f59e0b'], no: ['#fef2f2', '#dc2626'] };
    return {
      padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
      border: `2px solid ${active ? colors[val][1] : 'var(--gray-200, #e5e5e5)'}`,
      background: active ? colors[val][0] : 'white',
    };
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Vote on Dates — {ev.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input
                className="form-input"
                list="vote-players-list"
                value={name}
                onChange={e => { setName(e.target.value); prefill(e.target.value); }}
                placeholder="Enter your name"
                required
              />
              <datalist id="vote-players-list">
                {players.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>

            {ev.dates.length === 0 ? (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>No dates proposed yet.</div>
            ) : (
              ev.dates.map(d => (
                <div key={d.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 7 }}>{fmtDate(d.date)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['yes', '✅ Available'], ['maybe', '🟡 Maybe'], ['no', '❌ Busy']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        style={btnStyle(d.id, val)}
                        onClick={() => setVotes(v => ({ ...v, [d.id]: val }))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || ev.dates.length === 0}>
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Date Modal ────────────────────────────────────────────────────────
function ConfirmModal({ event: ev, onClose, onSave }) {
  const [selected, setSelected] = useState('');
  const [custom, setCustom]     = useState('');
  const [saving, setSaving]     = useState(false);

  const confirm = async () => {
    const date = selected || custom;
    if (!date) return;
    setSaving(true);
    await fetch(`/api/events/${ev.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed', confirmed_date: date }),
    });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Confirm Date — {ev.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {ev.dates.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 10 }}>
                Pick a proposed date:
              </div>
              {ev.dates.map(d => {
                const yes = d.votes.filter(v => v.availability === 'yes').length;
                const mbe = d.votes.filter(v => v.availability === 'maybe').length;
                const isActive = selected === d.date;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { setSelected(d.date); setCustom(''); }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', padding: '10px 14px', marginBottom: 8, borderRadius: 8,
                      border: `2px solid ${isActive ? 'var(--green-mid)' : 'var(--gray-200, #e5e5e5)'}`,
                      background: isActive ? '#e8f5e9' : 'white',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{fmtDate(d.date)}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                      {yes > 0 ? `✅ ${yes}` : ''}{yes > 0 && mbe > 0 ? '  ' : ''}{mbe > 0 ? `🟡 ${mbe}` : ''}
                    </span>
                  </button>
                );
              })}
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)', margin: '12px 0 8px' }}>
                — or pick a custom date —
              </div>
            </>
          )}
          <input
            className="form-input"
            type="date"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(''); }}
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-gold"
            disabled={saving || (!selected && !custom)}
            onClick={confirm}
          >
            {saving ? 'Confirming…' : '✅ Confirm This Date'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RSVP Modal ────────────────────────────────────────────────────────────────
function RsvpModal({ event: ev, players, onClose, onSave }) {
  const [name, setName]     = useState('');
  const [status, setStatus] = useState('yes');
  const [saving, setSaving] = useState(false);

  const prefill = (voterName) => {
    const ex = ev.rsvps.find(r => r.player_name.toLowerCase() === voterName.toLowerCase());
    if (ex) setStatus(ex.status);
  };

  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/events/${ev.id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: name.trim(), status }),
    });
    onSave();
  };

  const options = [
    ['yes',   '✅ Going'],
    ['maybe', '🟡 Maybe'],
    ['no',    "❌ Can't Make It"],
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">RSVP — {ev.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {ev.confirmed_date && (
              <div style={{ fontSize: '0.9rem', color: 'var(--green-mid)', fontWeight: 600, marginBottom: 16 }}>
                🗓 {fmtDate(ev.confirmed_date)}{ev.location ? ` · ${ev.location}` : ''}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input
                className="form-input"
                list="rsvp-players-list"
                value={name}
                onChange={e => { setName(e.target.value); prefill(e.target.value); }}
                placeholder="Enter your name"
                required
              />
              <datalist id="rsvp-players-list">
                {players.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map(([val, label]) => {
                const active = status === val;
                const colors = { yes: '#e8f5e9', maybe: '#fffbeb', no: '#fef2f2' };
                const borders = { yes: 'var(--green-mid)', maybe: '#f59e0b', no: '#dc2626' };
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatus(val)}
                    style={{
                      padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                      fontSize: '0.95rem', fontWeight: 700, textAlign: 'left',
                      border: `2px solid ${active ? borders[val] : 'var(--gray-200, #e5e5e5)'}`,
                      background: active ? colors[val] : 'white',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Submit RSVP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
