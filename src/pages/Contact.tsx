import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, User, Send, CheckCircle, ExternalLink } from 'lucide-react';
import './Contact.css';

const contactInfo = [
  { icon: <Phone size={22} />, title: 'Phone', lines: ['+91 93082 13436'], link: 'tel:+919308213436', id: 'contact-phone' },
  { icon: <Mail size={22} />, title: 'Email', lines: ['info@tablaclass.com', 'support@tablaclass.com'], link: 'mailto:info@tablaclass.com', id: 'contact-email' },
  { icon: <MapPin size={22} />, title: 'Address', lines: ['KRIPAL-BHAWAN, South of DVC Chauk', 'Near Durga Mandir, Jakkanpur', 'Gardanibagh, Patna, Bihar 800001', 'Landmark: Near Pavitra Apartment'], link: 'https://maps.google.com/?q=Jakkanpur+Gardanibagh+Patna+800001', id: 'contact-address' },
  { icon: <Clock size={22} />, title: 'Class Hours', lines: ['Mon–Sat: 7:00 AM – 8:00 PM', 'Sunday: By Appointment'], id: 'contact-hours' },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="contact-page" id="contact-main">
      {/* Hero */}
      <section className="contact-hero" id="contact-hero">
        <div className="contact-hero__overlay" />
        <div className="container contact-hero__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Get in Touch</span>
          <h1 className="contact-hero__title">Contact <span className="gradient-text">Us</span></h1>
          <p className="contact-hero__sub">Reach out to Shri Subodh Ranjan Prasad for queries, admissions, or class bookings.</p>
        </div>
      </section>

      <div className="container contact-layout" id="contact-section">
        {/* Info Cards */}
        <div className="contact-info-grid" id="contact-info-grid">
          {contactInfo.map(({ icon, title, lines, link, id }) => (
            <div className="contact-info-card" key={title} id={id}>
              <div className="contact-info-card__icon">{icon}</div>
              <div>
                <div className="contact-info-card__title">{title}</div>
                {lines.map(l => (
                  link ? (
                    <a key={l} href={link} target={link.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer" className="contact-info-card__line contact-info-card__link">
                      {l} {link.startsWith('http') && <ExternalLink size={11} />}
                    </a>
                  ) : (
                    <div key={l} className="contact-info-card__line">{l}</div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="contact-main-grid" id="contact-main-grid">
          {/* Contact Form */}
          <div className="contact-form-card" id="contact-form-card">
            <h2 className="contact-form-card__title">Send a Message</h2>
            <p className="contact-form-card__sub">We'll get back to you within 24 hours.</p>

            {submitted ? (
              <div className="contact-success" id="contact-success">
                <CheckCircle size={48} />
                <h3>Message Sent!</h3>
                <p>Thank you, <strong>{form.name}</strong>. We'll be in touch shortly on <strong>{form.phone}</strong>.</p>
                <button id="send-another-btn" className="btn btn-outline" onClick={() => { setSubmitted(false); setForm({ name:'', phone:'', email:'', subject:'', message:'' }); }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} id="contact-form" noValidate>
                <div className="contact-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="cf-name"><User size={13} /> Full Name *</label>
                    <input id="cf-name" className="form-input" required placeholder="Your full name"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cf-phone"><Phone size={13} /> Phone *</label>
                    <input id="cf-phone" className="form-input" required type="tel" placeholder="+91 XXXXX XXXXX"
                      value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cf-email"><Mail size={13} /> Email</label>
                    <input id="cf-email" className="form-input" type="email" placeholder="your@email.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cf-subject">Subject</label>
                    <select id="cf-subject" className="form-select" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                      <option value="">— Select subject —</option>
                      <option>Class Admission Enquiry</option>
                      <option>Offline Class Info</option>
                      <option>Online Class Info</option>
                      <option>Fee Structure</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="cf-message"><MessageSquare size={13} /> Your Message *</label>
                    <textarea id="cf-message" className="form-textarea" required
                      placeholder="Tell us about your learning goals, preferred timing, or any questions..."
                      value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" id="contact-submit-btn" className="btn btn-primary contact-submit-btn">
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* Map + Extra Info */}
          <div className="contact-aside" id="contact-aside">
            {/* Map Embed */}
            <div className="contact-map" id="contact-map">
              <iframe
                title="Tabla Classes Location"
                src="https://maps.google.com/maps?q=Jakkanpur+Gardanibagh+Patna+Bihar+800001&z=15&output=embed"
                width="100%" height="250" style={{ border: 0, borderRadius: '14px' }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a href="https://maps.google.com/?q=Jakkanpur+Gardanibagh+Patna+800001" target="_blank" rel="noopener noreferrer" className="contact-map__link" id="open-maps-link">
                <MapPin size={14} /> Open in Google Maps <ExternalLink size={13} />
              </a>
            </div>

            {/* FAQs */}
            <div className="contact-faq" id="contact-faq">
              <h3 className="contact-faq__title">Frequently Asked Questions</h3>
              {[
                { q: 'What is the fee structure?', a: 'Please contact us directly for a detailed fee structure based on offline or online modes.' },
                { q: 'What age groups are accepted?', a: 'All age groups — from children below 10 to seniors above 60.' },
                { q: 'Do I need a Tabla to start?', a: 'No. Guruji can guide you on what to purchase during your first week of classes.' },
                { q: 'Can I switch from offline to online?', a: 'Yes, both modes are flexible and can be switched as per your need.' },
              ].map(({ q, a }) => (
                <div className="contact-faq__item" key={q} id={`faq-${q.slice(0,10).toLowerCase().replace(/\s+/g,'-')}`}>
                  <div className="contact-faq__q">{q}</div>
                  <div className="contact-faq__a">{a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
