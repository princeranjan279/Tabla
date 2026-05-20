import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music2, Star, Users, Award, Clock, ChevronRight, Monitor, MapPin, CheckCircle, Quote, Phone, Play } from 'lucide-react';
import './Home.css';

const stats = [
  { icon: <Clock size={22} />, value: '30+', label: 'Years Teaching' },
  { icon: <Users size={22} />, value: '500+', label: 'Students Trained' },
  { icon: <Award size={22} />, value: '15+', label: 'Performances' },
  { icon: <Star size={22} />, value: '4.9', label: 'Student Rating' },
];

const testimonials = [
  { name: 'Shreeshant sangam', location: 'Student', text: "Subodh guru ji ke pass aane ke baad hme tabla ka acha guidance mila. 😊✨ Or me Subodh guru ji se bhout santusht hu me or v jagha tabla class karne gya me. lakin yaha jo khushi milli apne aap me wo kahi nhi mila.🥰😊 Aap sab v aaye ache se tabla sikhe Apne bhavishya ko Ujjwal banaye", rating: 5, id: 'testimonial-1' },
  { name: 'Surendra kumar gupta', location: 'Student', text: "बहुत हीं अनुभवी, तबला वादन के मर्मज्ञ गुरु जी हैं। सोलो तबला वादन में तो श्रोता के रूप मे आँखें बन्द कर इनको सुनते समय , कई जगहों पर तो ऐसा लगता है जैसे आप पंडित किशन महाराज जी को सुन रहे हैं। विलक्षण प्रतिभा !", rating: 5, id: 'testimonial-2' },
  { name: 'Subhash Suman', location: 'Student', text: "Good morning sir 🙏You are such a great personality who always try to give best to their students which you are possessing....", rating: 5, id: 'testimonial-3' },
];

const curricula = [
  { level: 'Beginner', duration: '6 months', topics: ['Basic strokes – Na, Tin, Dha', 'Teen Taal rhythm', 'Hand posture & care', 'Basic compositions'] },
  { level: 'Intermediate', duration: '1 year', topics: ['Kaida & Rela', 'Taal variations', 'Improvisation techniques', 'Stage performance prep'] },
  { level: 'Advanced', duration: '2+ years', topics: ['Advanced Laykari', 'Solo performance', 'Gharana traditions', 'Exam & competition prep'] },
];

const heroImages = [
  '/real-hero-2.jpg',
  '/real-hero.jpg',
  '/sangat2.jpeg'
];

export default function Home() {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="home" id="main-content">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="container hero__inner">
          <div className="hero__content">
            <div className="hero__badge animate-fade-in-up">
            <Music2 size={14} />
            <span>Bhartiya Nritya Kala Mandir • Patna, Bihar</span>
          </div>
          <h1 className="hero__title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Master the Art of<br />
            <span className="gradient-text">Tabla</span> with a Living Legend
          </h1>
          <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Learn from <strong>Shri Subodh Ranjan Prasad</strong> — retired Tabla teacher of Bhartiya Nritya Kala Mandir,
            Patna — with <strong>30+ years</strong> of teaching excellence in Hindustani classical music.
          </p>
          <div className="hero__ctas animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/book" className="btn btn-primary" id="hero-book-btn">
              Enroll Now <ChevronRight size={18} />
            </Link>
            <Link to="/about" className="btn btn-ghost" id="hero-about-btn">
              <Play size={16} fill="currentColor" /> Meet Guruji
            </Link>
          </div>
          <div className="hero__trust animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="hero__stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="var(--gold-400)" color="var(--gold-400)" />)}
            </div>
            <span>Trusted by 500+ students across India</span>
          </div>
          </div>
          <div className="hero__image-wrapper animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {heroImages.map((src, index) => (
              <img 
                key={src}
                src={src} 
                alt={`Guruji Subodh Ranjan Prasad teaching Tabla ${index + 1}`} 
                className={`hero__image slider-img ${index === currentImg ? 'active' : ''}`} 
              />
            ))}
            <div className="hero__slider-dots">
              {heroImages.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`hero__slider-dot ${idx === currentImg ? 'active' : ''}`}
                  onClick={() => setCurrentImg(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="hero__stats-band">
          <div className="container hero__stats-grid">
            {stats.map(({ icon, value, label }) => (
              <div className="hero__stat" key={label}>
                <div className="hero__stat-icon">{icon}</div>
                <div><div className="hero__stat-value">{value}</div><div className="hero__stat-label">{label}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Snippet */}
      <section className="section home-about" id="about-snippet">
        <div className="container home-about__inner">
          <div className="home-about__img-wrap">
            <img src="/solo.jpeg" alt="Shri Subodh Ranjan Prasad teaching Tabla" className="home-about__img" />
            <div className="home-about__img-badge"><Award size={15} /><span>Sangeet Praveen</span></div>
          </div>
          <div className="home-about__content">
            <div className="section-header" style={{ textAlign: 'left' }}>
              <span className="ornament-text">About Our Guruji</span>
              <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Shri Subodh Ranjan Prasad</h2>
              <div className="gold-divider gold-divider-left" />
            </div>
            <p className="home-about__para">
              A retired Tabla teacher from the prestigious <strong>Bhartiya Nritya Kala Mandir, Patna</strong>,
              Shri Subodh Ranjan Prasad holds a <strong>Sangeet Praveen</strong> degree from Allahabad University (1985)
              and brings over <strong>30 years</strong> of dedicated teaching experience.
            </p>
            <p className="home-about__para">
              His teaching covers all age groups — from young beginners to adult learners — with deep-rooted
              knowledge of Hindustani classical rhythms, Taal traditions, and Gharana styles.
            </p>
            <div className="home-about__points">
              {['Sangeet Praveen – Allahabad University, 1985','Ex-faculty, Bhartiya Nritya Kala Mandir','30+ years of dedicated teaching','All age groups (below 10 to 60+)','Online & offline / home-visit sessions','Structured curriculum for all levels'].map(pt => (
                <div className="home-about__point" key={pt}>
                  <CheckCircle size={15} className="home-about__check" /><span>{pt}</span>
                </div>
              ))}
            </div>
            <div className="home-about__actions">
              <Link to="/about" className="btn btn-primary" id="home-about-link">Full Profile <ChevronRight size={16} /></Link>
              <Link to="/book" className="btn btn-outline" id="home-book-link">Enroll Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Class Formats */}
      <section className="section home-formats" id="class-formats">
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">How to Learn</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Two Flexible <span className="gradient-text">Learning Formats</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">Choose what works best for your schedule and location</p>
          </div>
          <div className="home-formats__grid">
            {[
              { icon: <MapPin size={28} />, title: 'Offline Classes', subtitle: 'Learn in Person', desc: 'Attend at our Jakkanpur, Gardanibagh, Patna centre or opt for convenient home-visit sessions — a traditional guru-shishya experience.', points: ["At Guruji's residence","Student home visits","Group & private batches","Hands-on correction"], id: 'feature-offline' },
              { icon: <Monitor size={28} />, title: 'Online Classes', subtitle: 'Learn from Anywhere', desc: 'Live sessions via Google Meet. Get real-time feedback from Guruji from the comfort of your home anywhere in India or abroad.', points: ['Live Google Meet sessions','Session recordings','Digital learning material','Flexible time slots'], id: 'feature-online' },
            ].map(({ icon, title, subtitle, desc, points, id }) => (
              <div className="format-card" key={title} id={id}>
                <div className="format-card__icon">{icon}</div>
                <span className="badge badge-outline format-card__badge">{subtitle}</span>
                <h3 className="format-card__title">{title}</h3>
                <p className="format-card__desc">{desc}</p>
                <ul className="format-card__list">
                  {points.map(pt => <li key={pt}><CheckCircle size={13} /> {pt}</li>)}
                </ul>
                <Link to="/book" className="btn btn-primary format-card__btn" id={`${id}-btn`}>
                  Book Slot <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="section home-curriculum" id="curriculum-section">
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">Structured Learning</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Our <span className="gradient-text">Curriculum</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">A step-by-step journey from beginner to advanced</p>
          </div>
          <div className="curriculum__grid">
            {curricula.map(({ level, duration, topics }, idx) => (
              <div className="curriculum__card" key={level} id={`curriculum-${level.toLowerCase()}`}>
                <div className="curriculum__step">0{idx + 1}</div>
                <h3 className="curriculum__level">{level}</h3>
                <div className="curriculum__duration"><Clock size={13} /> {duration}</div>
                <ul className="curriculum__topics">
                  {topics.map(t => <li key={t}><span className="dot" />{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instrument Banner */}
      <section className="home-instrument" id="instrument-section">
        <div className="home-instrument__bg" style={{ backgroundImage: 'url(/solo-varanasi.jpeg)' }} />
        <div className="home-instrument__overlay" />
        <div className="container home-instrument__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.75rem' }}>The Sacred Art</span>
          <h2 className="home-instrument__title">The Tabla — India's <span style={{ color: 'var(--gold-300)' }}>Heartbeat</span></h2>
          <p className="home-instrument__text">
            The Tabla is not just an instrument — it is the pulse of Hindustani classical music.
            Each stroke carries centuries of tradition, expression, and mathematical precision.
          </p>
          <Link to="/book" className="btn btn-primary" id="instrument-book-btn">
            Begin Your Journey <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section home-testimonials" id="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">Student Voices</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>What Our <span className="gradient-text">Students Say</span></h2>
            <div className="gold-divider" />
          </div>
          <div className="testimonials__grid">
            {testimonials.map(({ name, location, text, rating, id }) => (
              <div className="testimonial-card" key={name} id={id}>
                <Quote size={28} className="testimonial-card__quote" />
                <p className="testimonial-card__text">{text}</p>
                <div className="testimonial-card__stars">
                  {[...Array(rating)].map((_, i) => <Star key={i} size={13} fill="var(--gold-400)" color="var(--gold-400)" />)}
                </div>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{name.charAt(0)}</div>
                  <div>
                    <div className="testimonial-card__name">{name}</div>
                    <div className="testimonial-card__loc">{location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home-cta-banner" id="cta-banner">
        <div className="container home-cta-banner__inner">
          <div>
            <h2 className="home-cta-banner__title">Ready to Start Your Tabla Journey?</h2>
            <p className="home-cta-banner__sub">Enroll in our classes today and begin your musical journey.</p>
          </div>
          <div className="home-cta-banner__btns">
            <Link to="/book" className="btn btn-primary" id="cta-banner-book">Enroll Now</Link>
            <a href="tel:+919308213436" className="btn btn-ghost" id="cta-banner-call"><Phone size={16} /> Call Now</a>
          </div>
        </div>
      </section>
    </main>
  );
}
