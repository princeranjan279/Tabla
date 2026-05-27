import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, Music2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
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
