import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Link } from 'react-router-dom';
import { Monitor, MapPin, Clock, Calendar, CheckCircle, ChevronRight, User, Phone, Mail, MessageSquare, Copy } from 'lucide-react';
import { newBookingRef, saveBookingToRef } from '../services/bookingService';
import './BookSlot.css';

type Mode = 'offline' | 'online';
type Step = 1 | 2 | 3;

const offlineSlots = ['7:00 AM – 8:00 AM','8:00 AM – 9:00 AM','10:00 AM – 11:00 AM','4:00 PM – 5:00 PM','5:00 PM – 6:00 PM','6:00 PM – 7:00 PM','7:00 PM – 8:00 PM'];
const onlineSlots  = ['6:30 AM – 7:30 AM','8:00 AM – 9:00 AM','11:00 AM – 12:00 PM','2:00 PM – 3:00 PM','5:00 PM – 6:00 PM','7:00 PM – 8:00 PM','8:00 PM – 9:00 PM'];
const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const classTypes = [
  { value: 'intro', label: 'Introductory Session', desc: 'Consultation & first lesson' },
  { value: 'private', label: 'Private 1-on-1 Session', desc: 'Personalised full attention' },
  { value: 'group', label: 'Group Batch', desc: 'Learn with peers (2-5 students)' },
];

const levels = ['Complete Beginner', 'Some Experience', 'Intermediate', 'Advanced'];

/** Normalize phone number: strip spaces, dashes, +91 prefix, keep only digits */
function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-().]/g, ''); // remove spaces, dashes, dots, parens
  if (p.startsWith('+91')) p = p.slice(3);
  if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p; // returns 10-digit string e.g. "9308213436"
}

export default function BookSlot() {
  const [mode, setMode] = useState<Mode>('offline');
  const [step, setStep] = useState<Step>(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [classType, setClassType] = useState('intro');
  const [level, setLevel] = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [sending, setSending]       = useState(false);
  const [sendError, setSendError]   = useState('');
  const [bookingId, setBookingId]   = useState('');
  const [copied, setCopied]         = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const slots = mode === 'offline' ? offlineSlots : onlineSlots;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError('');

    const classLabel = classTypes.find(c => c.value === classType)?.label ?? classType;
    const modeLabel  = mode === 'offline' ? 'Offline (In-Person)' : 'Online (Google Meet)';

    // Normalize phone: always store as plain 10-digit number
    const normalizedPhone = normalizePhone(form.phone);

    const templateParams = {
      preferred_day:   selectedDay,
      time_slot:       selectedSlot,
      class_type:      classLabel,
      current_level:   level,
      full_name:       form.name,
      phone_number:    normalizedPhone,
      email_address:   form.email,
      additional_note: form.message || '—',
      booking_mode:    modeLabel,
    };

    const bookingData = {
      full_name:       form.name,
      phone_number:    normalizedPhone,   // stored as normalized 10-digit
      email_address:   form.email,
      preferred_day:   selectedDay,
      time_slot:       selectedSlot,
      booking_mode:    modeLabel,
      class_type:      classLabel,
      current_level:   level,
      additional_note: form.message || '—',
    };

    // Pre-generate the Firestore document reference SYNCHRONOUSLY.
    // This gives us the ID immediately (no network call needed).
    const bookingRef = newBookingRef();
    setBookingId(bookingRef.id); // ID is now set BEFORE the success screen renders

    try {
      // Step 1 — Save to Firestore FIRST (most important — must not be lost)
      await saveBookingToRef(bookingRef, bookingData);
      console.log('✅ Booking saved to Firestore:', bookingRef.id);

      // Step 2 — Send email notification (non-blocking, failure is OK)
      emailjs.send('service_7p2b5qw', 'template_1g7zapp', templateParams, 'Uec9wvhT9q0XgmK1T')
        .then(() => console.log('✅ Email sent'))
        .catch(err => console.warn('⚠️ Email send failed (booking still saved):', err));

      setSending(false);
      setSubmitted(true);
    } catch (err) {
      setSending(false);
      setSendError('Failed to save your booking. Please check your connection and try again.');
      console.error('Firestore save error:', err);
    }
  };


  const copyId = () => {
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    return (
      <main className="book-page" id="book-main">
        <div className="book-hero"><div className="book-hero__overlay" /><div className="container book-hero__content"><h1 className="book-hero__title">Book a Slot</h1></div></div>
        <div className="container book-success" id="booking-success">
          <div className="book-success__icon"><CheckCircle size={56} /></div>
          <h2 className="book-success__title">Booking Submitted!</h2>
          <p className="book-success__text">Thank you, <strong>{form.name}</strong>! Your {mode} slot request has been received.</p>

          {/* Booking ID card */}
          <div className="book-success__id-card">
            <p className="book-success__id-label">Your Booking ID</p>
            <div className="book-success__id-row">
              <span className="book-success__id">{bookingId}</span>
              <button className="book-success__copy-btn" onClick={copyId} title="Copy Booking ID">
                <Copy size={15} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="book-success__id-hint">Save this ID or your phone number to track your booking status.</p>
          </div>

          <div className="book-success__details">
            <div><span>Mode:</span> {mode === 'offline' ? '📍 Offline (In-person)' : '💻 Online (Google Meet)'}</div>
            <div><span>Day:</span> {selectedDay}</div>
            <div><span>Time:</span> {selectedSlot}</div>
            <div><span>Type:</span> {classTypes.find(c => c.value === classType)?.label}</div>
          </div>
          <p className="book-success__note">Shri Subodh Ranjan Prasad will contact you at <strong>{form.phone}</strong> within 24 hours to confirm.</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/my-booking" className="btn btn-primary" id="view-booking-btn">Track My Booking →</Link>
            <button className="btn btn-outline" id="book-again-btn" onClick={() => { setSubmitted(false); setStep(1); setSelectedDay(''); setSelectedSlot(''); setBookingId(''); }}>Book Another Slot</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="book-page" id="book-main">
      {/* Hero */}
      <section className="book-hero" id="book-hero">
        <div className="book-hero__overlay" />
        <div className="container book-hero__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Schedule Your Class</span>
          <h1 className="book-hero__title">Book a <span className="gradient-text">Tabla Slot</span></h1>
          <p className="book-hero__sub">Choose your preferred mode, day, and time — Guruji will confirm within 24 hours.</p>
        </div>
      </section>

      <div className="container book-layout" id="booking-form-section">
        {/* Mode Toggle */}
        <div className="book-mode-toggle" id="mode-toggle">
          <button id="btn-offline" className={`book-mode-btn${mode === 'offline' ? ' active' : ''}`} onClick={() => { setMode('offline'); setSelectedSlot(''); }}>
            <MapPin size={18} /> Offline (In-Person)
          </button>
          <button id="btn-online" className={`book-mode-btn${mode === 'online' ? ' active' : ''}`} onClick={() => { setMode('online'); setSelectedSlot(''); }}>
            <Monitor size={18} /> Online (Google Meet)
          </button>
        </div>

        <div className="book-content">
          {/* Info Panel */}
          <aside className="book-info" id="booking-info">
            <div className="book-info__card">
              <div className="book-info__icon">{mode === 'offline' ? <MapPin size={22} /> : <Monitor size={22} />}</div>
              <h3 className="book-info__title">{mode === 'offline' ? 'In-Person Classes' : 'Online Classes'}</h3>
              {mode === 'offline' ? (
                <>
                  <p className="book-info__desc">Visit Guruji at his residence in Jakkanpur, Gardanibagh, Patna, or he can visit your home within Patna.</p>
                  <div className="book-info__detail"><MapPin size={14} /><span>KRIPAL-BHAWAN, South of DVC Chauk, Jakkanpur, Gardanibagh, Patna – 800001, Bihar</span></div>
                  <div className="book-info__detail"><Clock size={14} /><span>Mon–Sat, 7:00 AM – 8:00 PM</span></div>
                </>
              ) : (
                <>
                  <p className="book-info__desc">Join a live interactive session via Google Meet. A meeting link will be shared after confirmation.</p>
                  <div className="book-info__detail"><Monitor size={14} /><span>Google Meet</span></div>
                  <div className="book-info__detail"><Clock size={14} /><span>Flexible slots, Pan-India</span></div>
                </>
              )}
              <div className="book-info__features">
                {['Personalised curriculum','Traditional Guru-Shishya parampara','Flexible rescheduling','All age groups welcome'].map(f => (
                  <div key={f} className="book-info__feature"><CheckCircle size={13} />{f}</div>
                ))}
              </div>
            </div>

            <div className="book-info__contact">
              <p className="book-info__contact-title">Prefer to call directly?</p>
              <a href="tel:+919308213436" className="btn btn-outline" id="info-call-btn" style={{ justifyContent: 'center' }}>
                <Phone size={15} /> +91 93082 13436
              </a>
            </div>
          </aside>

          {/* Form Steps */}
          <div className="book-form-area" id="booking-steps">
            {/* Step Indicator */}
            <div className="book-steps" aria-label="Booking steps">
              {[1,2,3].map(s => (
                <div key={s} className={`book-step${step === s ? ' active' : ''}${step > s ? ' done' : ''}`} id={`step-indicator-${s}`}>
                  <div className="book-step__num">{step > s ? <CheckCircle size={14} /> : s}</div>
                  <div className="book-step__label">{s === 1 ? 'Choose Slot' : s === 2 ? 'Class Details' : 'Your Info'}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Choose Slot */}
            {step === 1 && (
              <div className="book-step-content animate-fade-in-up" id="step1-content">
                <h2 className="book-step-content__title">Select Your Preferred Day & Time</h2>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Preferred Day</label>
                  <div className="days-grid" id="days-grid">
                    {days.map(d => (
                      <button key={d} id={`day-${d.toLowerCase()}`}
                        className={`day-btn${selectedDay === d ? ' active' : ''}`}
                        onClick={() => setSelectedDay(d)}>
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Available Time Slots</label>
                  <div className="slots-grid" id="slots-grid">
                    {slots.map(s => (
                      <button key={s} id={`slot-${s.replace(/\s+/g,'-')}`}
                        className={`slot-btn${selectedSlot === s ? ' active' : ''}`}
                        onClick={() => setSelectedSlot(s)}>
                        <Clock size={13} /> {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button id="step1-next-btn"
                  className="btn btn-primary book-next-btn"
                  disabled={!selectedDay || !selectedSlot}
                  onClick={() => setStep(2)}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Class Details */}
            {step === 2 && (
              <div className="book-step-content animate-fade-in-up" id="step2-content">
                <h2 className="book-step-content__title">Select Class Type & Your Level</h2>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Class Type</label>
                  <div className="class-types" id="class-types-grid">
                    {classTypes.map(ct => (
                      <button key={ct.value} id={`classtype-${ct.value}`}
                        className={`class-type-btn${classType === ct.value ? ' active' : ''}`}
                        onClick={() => setClassType(ct.value)}>
                        <div className="class-type-btn__label">{ct.label}</div>
                        <div className="class-type-btn__desc">{ct.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="level-select">Your Current Level</label>
                  <select id="level-select" className="form-select" value={level} onChange={e => setLevel(e.target.value)}>
                    <option value="">— Select your level —</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="book-step-nav">
                  <button id="step2-back-btn" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button id="step2-next-btn" className="btn btn-primary" disabled={!level} onClick={() => setStep(3)}>
                    Continue <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Personal Info */}
            {step === 3 && (
              <div className="book-step-content animate-fade-in-up" id="step3-content">
                <h2 className="book-step-content__title">Your Contact Details</h2>
                <div className="book-summary" id="booking-summary">
                  <div><Calendar size={14} /> {selectedDay}</div>
                  <div><Clock size={14} /> {selectedSlot}</div>
                  <div>{mode === 'offline' ? <MapPin size={14} /> : <Monitor size={14} />} {mode === 'offline' ? 'Offline' : 'Online'}</div>
                </div>
                <form onSubmit={handleSubmit} id="booking-final-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="input-name"><User size={13} /> Full Name *</label>
                      <input id="input-name" className="form-input" required placeholder="Your full name"
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="input-phone"><Phone size={13} /> Phone Number *</label>
                      <input id="input-phone" className="form-input" required placeholder="10-digit number e.g. 9308213436" type="tel"
                        value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" htmlFor="input-email"><Mail size={13} /> Email Address</label>
                      <input id="input-email" className="form-input" placeholder="your@email.com" type="email"
                        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" htmlFor="input-message"><MessageSquare size={13} /> Additional Note</label>
                      <textarea id="input-message" className="form-textarea" placeholder="Any special requirements or questions..."
                        value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                    </div>
                  </div>

                  {sendError && (
                    <p style={{ color: '#e57373', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{sendError}</p>
                  )}

                  <div className="book-step-nav">
                    <button type="button" id="step3-back-btn" className="btn btn-outline" onClick={() => setStep(2)} disabled={sending}>← Back</button>
                    <button type="submit" id="step3-submit-btn" className="btn btn-primary" disabled={sending}>
                      {sending ? 'Saving…' : 'Confirm Booking'} <ChevronRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
