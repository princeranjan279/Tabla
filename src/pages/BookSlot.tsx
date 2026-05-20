import { useState } from 'react';
import { Monitor, MapPin, Clock, Calendar, CheckCircle, ChevronRight, User, Phone, Mail, MessageSquare } from 'lucide-react';
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

export default function BookSlot() {
  const [mode, setMode] = useState<Mode>('offline');
  const [step, setStep] = useState<Step>(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [classType, setClassType] = useState('intro');
  const [level, setLevel] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const slots = mode === 'offline' ? offlineSlots : onlineSlots;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="book-page" id="book-main">
        <div className="book-hero"><div className="book-hero__overlay" /><div className="container book-hero__content"><h1 className="book-hero__title">Book a Slot</h1></div></div>
        <div className="container book-success" id="booking-success">
          <div className="book-success__icon"><CheckCircle size={56} /></div>
          <h2 className="book-success__title">Booking Confirmed!</h2>
          <p className="book-success__text">Thank you, <strong>{form.name}</strong>! Your {mode} slot request has been received.</p>
          <div className="book-success__details">
            <div><span>Mode:</span> {mode === 'offline' ? '📍 Offline (In-person)' : '💻 Online (Google Meet)'}</div>
            <div><span>Day:</span> {selectedDay}</div>
            <div><span>Time:</span> {selectedSlot}</div>
            <div><span>Type:</span> {classTypes.find(c => c.value === classType)?.label}</div>
          </div>
          <p className="book-success__note">Shri Subodh Ranjan Prasad will contact you at <strong>{form.phone}</strong> within 24 hours to confirm.</p>
          <button className="btn btn-primary" id="book-again-btn" onClick={() => { setSubmitted(false); setStep(1); setSelectedDay(''); setSelectedSlot(''); }}>Book Another Slot</button>
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
                      <input id="input-phone" className="form-input" required placeholder="+91 XXXXX XXXXX" type="tel"
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
                  <div className="book-step-nav">
                    <button type="button" id="step3-back-btn" className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                    <button type="submit" id="step3-submit-btn" className="btn btn-primary">
                      Confirm Booking <ChevronRight size={16} />
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
