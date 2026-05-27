import { Link } from 'react-router-dom';
import { Phone, MapPin, Music2, Clock, ExternalLink } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__top">
        <div className="container footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon">
                <Music2 size={22} />
              </div>
              <div>
                <div className="footer__logo-name">Tabla Classes</div>
                <div className="footer__logo-hindi">Shri Subodh Ranjan Prasad</div>
              </div>
            </div>
            <p className="footer__desc">
              A premier Tabla learning centre in Patna, Bihar — guided by Shri Subodh Ranjan Prasad,
              a veteran of Bhartiya Nritya Kala Mandir with 30+ years of teaching excellence.
            </p>
            {/* Social icons removed (lucide-react doesn't support brand icons) */}
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4 className="footer__col-title">Quick Links</h4>
            <ul className="footer__links">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About Guruji' },
                { to: '/book', label: 'Book a Slot' },
                { to: '/learn', label: 'Learn Bols' },
                { to: '/practice', label: 'Riyaz Studio' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/contact', label: 'Contact Us' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Classes */}
          <div className="footer__col">
            <h4 className="footer__col-title">Our Classes</h4>
            <ul className="footer__links">
              {[
                'Beginner Tabla',
                'Intermediate Level',
                'Advanced Tabla',
                'Online via Google Meet',
                'Home Visits (Patna)',
                'Group Batches',
                'Private One-on-One',
                'Exam Preparation',
                'Tabla Accompaniment (Sangat)',
              ].map(item => (
                <li key={item}><span className="footer__link footer__link--text">• {item}</span></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__col-title">Contact & Hours</h4>
            <div className="footer__contact-list">
              <div className="footer__contact-item">
                <MapPin size={15} className="footer__contact-icon" />
                <span>KRIPAL-BHAWAN, South of DVC Chauk<br />Near Durga Mandir, Jakkanpur<br />Gardanibagh, Patna, Bihar 800001<br /><small>Landmark: Near Pavitra Apartment</small></span>
              </div>
              <div className="footer__contact-item">
                <Phone size={15} className="footer__contact-icon" />
                <a href="tel:+919308213436" className="footer__link" id="footer-phone">+91 93082 13436</a>
              </div>
              <div className="footer__contact-item">
                <Clock size={15} className="footer__contact-icon" />
                <span>Mon–Sat: 7:00 AM – 8:00 PM<br />Sun: By Appointment</span>
              </div>
            </div>
            <a
              href="https://share.google/FDotGIjNIqaD1GLYx"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__map-link"
              id="footer-map-link"
            >
              <MapPin size={14} /> View on Google Maps <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p className="footer__copy">
            © {year} Shri Subodh Ranjan Prasad – Tabla Classes. All rights reserved.
          </p>
          <p className="footer__credit">
            Crafted with ♥ in Patna, Bihar &nbsp;|&nbsp;
            <span style={{ color: 'var(--accent)' }}>शास्त्रीय संगीत की विरासत</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
