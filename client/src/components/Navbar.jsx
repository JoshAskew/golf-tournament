import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <img src="/logo.png" alt="Buc-ee's Classic" className="navbar-logo"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <span style={{ display: 'none', fontSize: '2rem' }}>⛳</span>
        <div className="brand-text">
          <span className="brand-top">Annual Golf Tournament</span>
          <span className="brand-name">The Buc-ee's Classic</span>
        </div>
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/tournaments">Tournaments</NavLink>
        <NavLink to="/players">Players</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
        <NavLink to="/history">History</NavLink>
      </div>
    </nav>
  );
}
