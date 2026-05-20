import { useState, useEffect } from 'react';

export default function PlanningSection() {
  const [proposals, setProposals] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => fetch('/api/proposals').then(r => r.json()).then(setProposals);
  useEffect(() => { load(); }, []);

  const open = proposals.filter(p => p.status === 'open');
  const closed = proposals.filter(p => p.status === 'closed');

  return (
    <div style={{ marginTop: 28 }}>
      <div className="section-heading">
        <h2>📅 Planning</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + New Poll
        </button>
      </div>

      {proposals.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: 36 }}>
            <div className="empty-state-icon">🗳️</div>
            <div className="empty-state-text">No polls yet — create one to start planning the next event!</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {open.map(p => (
          <ProposalCard key={p.id} proposal={p} onUpdate={load} />
        ))}
        {closed.map(p => (
          <ProposalCard key={p.id} proposal={p} onUpdate={load} />
        ))}
      </div>

      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onSave={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function ProposalCard({ proposal, onUpdate }) {
  const [showVote, setShowVote] = useState(false);
  const totalVoters = new Set(proposal.options.flatMap(o => o.voters)).size;
  const maxVotes = Math.max(...proposal.options.map(o => o.vote_count), 1);

  const closePoll = async () => {
    const newStatus = proposal.status === 'open' ? 'closed' : 'open';
    await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onUpdate();
  };

  const deleteProposal = async () => {
    if (!confirm('Delete this poll?')) return;
    await fetch(`/api/proposals/${proposal.id}`, { method: 'DELETE' });
    onUpdate();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="card-title">{proposal.title}</div>
            <span className={`badge ${proposal.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
              {proposal.status}
            </span>
          </div>
          {proposal.description && (
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: 2 }}>
              {proposal.description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {proposal.status === 'open' && (
            <button className="btn btn-gold btn-sm" onClick={() => setShowVote(true)}>
              Vote
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={closePoll}>
            {proposal.status === 'open' ? 'Close' : 'Reopen'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={deleteProposal}>✕</button>
        </div>
      </div>

      <div className="card-body" style={{ paddingTop: 12 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 12 }}>
          {proposal.multi_select ? 'Pick all that work for you' : 'Vote for one'} · {totalVoters} {totalVoters === 1 ? 'person' : 'people'} voted
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {proposal.options.map(opt => {
            const pct = maxVotes ? Math.round((opt.vote_count / maxVotes) * 100) : 0;
            const isLeader = opt.vote_count === maxVotes && opt.vote_count > 0;
            return (
              <div key={opt.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: isLeader ? 700 : 500, fontSize: '0.9rem', color: isLeader ? 'var(--green-dark)' : 'inherit' }}>
                    {isLeader && '✓ '}{opt.label}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gray-400)', fontWeight: 600 }}>
                    {opt.vote_count}
                  </span>
                </div>
                <div style={{ background: 'var(--gray-100)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: isLeader ? 'var(--green-mid)' : 'var(--gray-200)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                {opt.voters.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 3 }}>
                    {opt.voters.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showVote && (
        <VoteModal
          proposal={proposal}
          onClose={() => setShowVote(false)}
          onSave={() => { setShowVote(false); onUpdate(); }}
        />
      )}
    </div>
  );
}

function VoteModal({ proposal, onClose, onSave }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [players, setPlayers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setPlayers);
  }, []);

  const toggle = (id) => {
    if (proposal.multi_select) {
      setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    } else {
      setSelected([id]);
    }
  };

  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter your name');
    if (selected.length === 0) return alert('Please select at least one option');
    setSaving(true);
    await fetch(`/api/proposals/${proposal.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voter_name: name.trim(), option_ids: selected }),
    });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Vote: {proposal.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Your name *</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                list="player-names"
                required
              />
              <datalist id="player-names">
                {players.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">
                {proposal.multi_select ? 'Select all that work for you' : 'Pick one'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {proposal.options.map(opt => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      border: `2px solid ${selected.includes(opt.id) ? 'var(--green-mid)' : 'var(--gray-200)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: selected.includes(opt.id) ? 'rgba(46,170,63,0.06)' : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type={proposal.multi_select ? 'checkbox' : 'radio'}
                      checked={selected.includes(opt.id)}
                      onChange={() => toggle(opt.id)}
                      style={{ accentColor: 'var(--green-mid)', width: 16, height: 16 }}
                    />
                    <span style={{ fontWeight: 500 }}>{opt.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                      {opt.vote_count} {opt.vote_count === 1 ? 'vote' : 'votes'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePollModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', multi_select: true });
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const updateOption = (i, val) => setOptions(o => o.map((x, j) => j === i ? val : x));
  const addOption = () => setOptions(o => [...o, '']);
  const removeOption = i => setOptions(o => o.filter((_, j) => j !== i));

  const submit = async e => {
    e.preventDefault();
    const filled = options.filter(o => o.trim());
    if (filled.length < 2) return alert('Add at least 2 options');
    setSaving(true);
    await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, options: filled }),
    });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Create New Poll</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Poll question *</label>
              <input className="form-input" value={form.title} onChange={set('title')}
                placeholder="e.g. When works for the 2026 Classic?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" value={form.description} onChange={set('description')}
                placeholder="e.g. Weekend dates only, let us know what works" />
            </div>
            <div className="form-group">
              <label className="form-label">Vote type</label>
              <select className="form-select" value={form.multi_select}
                onChange={e => setForm(f => ({ ...f, multi_select: e.target.value === 'true' }))}>
                <option value="true">Pick all that work (availability poll)</option>
                <option value="false">Pick one (preference poll)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Options *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" value={opt} onChange={e => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`} />
                    {options.length > 2 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOption(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={addOption}
                  style={{ alignSelf: 'flex-start' }}>
                  + Add option
                </button>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
