import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';
import Avatar from './Avatar';
import Icon from './Icon';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/profile', label: 'My Profile', icon: 'user' },
  { to: '/research-profile', label: 'Skills & Interests', icon: 'flask' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo--light' : ''}`} aria-label="ResearchHub home">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="currentColor" className="logo__bg" />
        <circle cx="20" cy="22" r="6" fill="#e8a33d" />
        <circle cx="44" cy="20" r="5" fill="#8fa7ff" />
        <circle cx="32" cy="44" r="7" fill="#fff" />
        <path d="M20 22 L44 20 L32 44 Z" fill="none" stroke="#8fa7ff" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <span>
        Research<b>Hub</b>
      </span>
    </Link>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className={`app-shell ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar__brand">
          <Logo light />
        </div>
        <nav className="sidebar__nav">
          <p className="sidebar__label">Module 1 · Research Network</p>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          <Link to="/profile" className="sidebar__user">
            <Avatar src={user.avatarUrl} name={user.name} size={38} />
            <span>
              <strong>{user.name}</strong>
              <small>{ROLE_LABELS[user.role]}</small>
            </span>
          </Link>
          <button
            type="button"
            className="icon-btn icon-btn--dark"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            aria-label="Log out"
            title="Log out"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>
      <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar__menu" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="topbar__spacer" />
          <Link to="/profile" className="topbar__me" aria-label="My profile">
            <Avatar src={user.avatarUrl} name={user.name} size={36} />
          </Link>
        </header>
        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
