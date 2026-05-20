import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/players', label: 'Players' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/history', label: 'History' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand" onClick={close}>
          <img
            src="/logo.png"
            alt="Buc-ee's Classic"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span style={{ display: 'none', fontSize: '2rem' }}>⛳</span>
          <div className="brand-text">
            <span className="brand-top">Annual Golf Tournament</span>
            <span className="brand-name">The Buc-ee's Classic</span>
          </div>
        </NavLink>

        {/* Desktop links */}
        <div className="navbar-links desktop-only">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </div>

        {/* Hamburger button */}
        <button
          className="hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="mobile-menu">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={close}>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}
