import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, Music2, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const navLinks = [
  { to: '/', label: 'Home', id: 'nav-home' },
  { to: '/about', label: 'About Guruji', id: 'nav-about' },
  { to: '/book', label: 'Book a Slot', id: 'nav-book' },
  { to: '/my-booking', label: 'My Booking', id: 'nav-my-booking' },
  { to: '/gallery', label: 'Gallery', id: 'nav-gallery' },
  { to: '/learn', label: 'Learn Bols', id: 'nav-learn' },
  { to: '/practice', label: 'Riyaz Studio 🎛', id: 'nav-practice' },
  { to: '/contact', label: 'Contact', id: 'nav-contact' },
];

export default function Navbar() {
  const { toggleTheme, isDark } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} role="banner">
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <Music2 size={24} className="navbar__logo-icon" />
          <div className="navbar__logo-text">
            <span className="navbar__logo-main">Tabla Classes</span>
            <span className="navbar__logo-sub">Shri Subodh Ranjan Prasad</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__links" aria-label="Main navigation">
          {navLinks.map(({ to, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              end={to === '/'}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          <button
            className="navbar__theme-btn"
            onClick={toggleTheme}
            id="btn-theme-toggle"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="navbar__auth-group">
              {isAdmin && (
                <Link to="/admin" className="navbar__link" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', height: '36px' }}
                id="btn-nav-logout"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/riyaz-login"
              className="navbar__link"
              style={{ fontSize: '0.85rem', fontWeight: 700 }}
              id="btn-nav-login"
            >
              <User size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }} /> Login
            </Link>
          )}

          <Link to="/book" className="btn btn-primary navbar__cta" id="nav-cta">
            Enroll Now
          </Link>

          <button
            className="navbar__hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            id="btn-hamburger"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`navbar__drawer${open ? ' navbar__drawer--open' : ''}`} aria-hidden={!open}>
        <nav className="navbar__drawer-links">
          {navLinks.map(({ to, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={`mob-${id}`}
              end={to === '/'}
              className={({ isActive }) =>
                `navbar__drawer-link${isActive ? ' navbar__drawer-link--active' : ''}`
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              {isAdmin && (
                <Link to="/admin" className="navbar__drawer-link" onClick={() => setOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="btn btn-outline"
                style={{ justifyContent: 'center' }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/riyaz-login"
              className="navbar__drawer-link"
              onClick={() => setOpen(false)}
              style={{ marginTop: '1.5rem', fontWeight: 700 }}
            >
              <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Riyaz Login
            </Link>
          )}

          <Link
            to="/book"
            className="btn btn-primary"
            id="mob-nav-cta"
            onClick={() => setOpen(false)}
            style={{ marginTop: '1rem', justifyContent: 'center' }}
          >
            Enroll Now
          </Link>
        </nav>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="navbar__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

