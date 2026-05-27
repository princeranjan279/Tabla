import { Award, BookOpen, Clock, GraduationCap, Music, Star, CheckCircle, Users, Globe, Home as HomeIcon, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './About.css';

const keyPoints = [
  { icon: <GraduationCap size={22} />, title: 'Sangeet Praveen', desc: 'Earned the prestigious Sangeet Praveen degree from Allahabad University in 1985 — the highest credential in Hindustani classical music education.' },
  { icon: <Award size={22} />, title: 'Bhartiya Nritya Kala Mandir', desc: 'Served as a Tabla teacher at the renowned Bhartiya Nritya Kala Mandir, Patna — one of Bihar\'s most respected institutions for classical arts.' },
  { icon: <Clock size={22} />, title: '30+ Years of Teaching', desc: 'Over three decades of unbroken dedication to teaching Tabla to students of all ages — from below 10 years to well above 60.' },
  { icon: <Users size={22} />, title: '500+ Students Trained', desc: 'Hundreds of students have learned under his guidance, many of whom have gone on to perform at state, national, and international level events.' },
  { icon: <Music size={22} />, title: 'Hindustani Classical Expert', desc: 'Deep expertise in Taal, Laykari, Kaida, Rela, and the rhythmic traditions of multiple Gharanas of the Tabla.' },
  { icon: <Mic2 size={22} />, title: 'Tabla Accompanist (Sangat)', desc: 'An accomplished accompanist who has provided Tabla sangat to sitarists, sarod players, violinists, guitarists, vocalists, and classical dancers across Bihar and beyond.' },
  { icon: <BookOpen size={22} />, title: 'Holistic Teaching Method', desc: 'Teaching goes beyond strokes — students learn music theory, rhythm mathematics, and the cultural significance of each composition.' },
  { icon: <Globe size={22} />, title: 'Online & Offline Reach', desc: 'Conducts classes both at his Jakkanpur, Gardanibagh, Patna residence and online via Google Meet, enabling students across India and abroad to learn.' },
  { icon: <HomeIcon size={22} />, title: 'Home Visits Available', desc: 'Offers personalised home-visit sessions within Patna for students who prefer learning in their own environment.' },
];

const timeline = [
  { year: '1985', event: 'Awarded Sangeet Praveen from Allahabad University' },
  { year: '1990s', event: 'Joined Bhartiya Nritya Kala Mandir, Patna as Tabla Faculty' },
  { year: '2000s', event: 'Expanded teaching to private and group classes across Patna' },
  { year: '2010s', event: 'Trained 300+ students; organised multiple cultural performances' },
  { year: '2020', event: 'Launched online Tabla classes via Google Meet for pan-India learners' },
  { year: '2024', event: '500+ students trained; continues teaching at Gardanibagh, Jakkanpur, Patna' },
  { year: '2024–26 (Present)', event: 'Tabla Teacher at Delhi Public School, Patna East' },
];

const specialties = [
  'Teen Taal', 'Ek Taal', 'Jhap Taal', 'Rupak Taal',
  'Kaida compositions', 'Rela & Tihai', 'Peshkar', 'Kayda variations',
  'Solo Tabla performances', 'Sitar Sangat', 'Sarod Sangat',
  'Vocal Accompaniment', 'Dance Accompaniment', 'Guitar Sangat', 'Violin Sangat',
];

const sangat = [
  { instrument: 'Sitar', icon: '𝄞', note: 'Classical string — intricate rhythm sync' },
  { instrument: 'Sarod', icon: '♬', note: 'Deep melodic lines — precise taal support' },
  { instrument: 'Violin', icon: '♪', note: 'Classical & semi-classical contexts' },
  { instrument: 'Guitar', icon: '𝄢', note: 'Cross-genre fusion accompaniment' },
  { instrument: 'Vocal (Gayaki)', icon: '🎤', note: 'Khayal, Thumri, Bhajan & more' },
  { instrument: 'Classical Dance', icon: '💃', note: 'Kathak & other forms — rhythmic foundation' },
];

export default function About() {
  return (
    <main className="about-page" id="about-main">
      {/* Page Hero */}
      <section className="about-hero" id="about-hero">
        <div className="about-hero__overlay" />
        <div className="container about-hero__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.75rem' }}>Our Guruji</span>
          <h1 className="about-hero__title">
            Shri Subodh Ranjan Prasad
          </h1>
          <p className="about-hero__sub">
            Sangeet Praveen • Tabla Maestro • Tabla Accompanist • Patna, Bihar
          </p>
          <div className="about-hero__badges">
            <span className="badge badge-gold"><Award size={13} /> 30+ Years Experience</span>
            <span className="badge badge-gold"><GraduationCap size={13} /> Sangeet Praveen</span>
            <span className="badge badge-gold"><Star size={13} /> 4.9★ Rating</span>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section about-bio" id="about-bio">
        <div className="container about-bio__inner">
          <div className="about-bio__image-col">
            <div className="about-bio__img-frame">
              <img src="/sangat2.jpeg" alt="Shri Subodh Ranjan Prasad" className="about-bio__img" />
              <div className="about-bio__img-ribbon">Tabla Maestro</div>
            </div>
            <div className="about-bio__quick-facts">
              {[
                { label: 'Location', value: 'Jakkanpur, Gardanibagh, Patna – 800001' },
                { label: 'Qualification', value: 'Sangeet Praveen (1985)' },
                { label: 'University', value: 'Allahabad University' },
                { label: 'Teaching Mode', value: 'Offline, Online, Home Visit' },
                { label: 'Languages', value: 'Hindi (Native), English (Basic)' },
                { label: 'Admissions', value: 'Open for all levels' },
              ].map(({ label, value }) => (
                <div className="quick-fact" key={label}>
                  <span className="quick-fact__label">{label}</span>
                  <span className="quick-fact__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="about-bio__text-col">
            <div className="section-header" style={{ textAlign: 'left' }}>
              <span className="ornament-text">Biography</span>
              <h2 className="section-title" style={{ marginTop: '0.5rem' }}>A Life Devoted to <span className="gradient-text">Tabla</span></h2>
              <div className="gold-divider gold-divider-left" />
            </div>
            <p className="about-bio__para">
              Shri Subodh Ranjan Prasad is a distinguished Tabla teacher and performing artist based in Gardanibagh, Patna, Bihar.
              His journey into the world of Indian classical percussion began in his youth, culminating in the prestigious
              <strong> Sangeet Praveen</strong> degree from Allahabad University in 1985 — the highest academic certification
              in Hindustani classical music.
            </p>
            <p className="about-bio__para">
              He served as a dedicated faculty member at the renowned <strong>Bhartiya Nritya Kala Mandir, Patna</strong> —
              Bihar's premier institution for classical arts — where he shaped the rhythmic foundations of hundreds of students
              over multiple decades.
            </p>
            <p className="about-bio__para">
              After retirement from the Kala Mandir, Shri Subodh Ranjan Prasad has continued his mission of spreading classical Tabla education
              through private classes at his residence, home-visit sessions, and online Google Meet classes — making his expertise
              accessible to learners across India and beyond. He is currently working as a Tabla Faculty for Class 1 to 10 students at Delhi Public School, Patna East, and also teaches international students, currently conducting online sessions for students in the USA.
            </p>
            <p className="about-bio__para">
              Beyond the teaching hall, Shri Subodh Ranjan Prasad is a seasoned <strong>Tabla accompanist (Sangat)</strong> —
              having performed alongside sitarists, sarod players, violinists, guitarists, vocalists, and classical dancers
              at prestigious programmes across Bihar, including events at Bhartiya Nritya Kala Mandir, Kashi Sangeet Sabha (Varanasi),
              and private classical music soirées. His accompaniment is marked by deep rhythmic empathy and mastery of the full
              Taal repertoire.
            </p>
            <p className="about-bio__para">
              His teaching philosophy centres on the guru-shishya tradition — building not just technical skill, but a lifelong
              love for the art. He teaches all age groups, from children below 10 to adults above 60, adapting his method to
              each student's learning pace and goal.
            </p>
            <div className="about-bio__actions">
              <Link to="/book" className="btn btn-primary" id="about-book-btn">Enroll Now</Link>
              <Link to="/contact" className="btn btn-outline" id="about-contact-btn">Contact Guruji</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Points Grid */}
      <section className="section about-expertise" id="expertise-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">Why Learn Here</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Expertise & <span className="gradient-text">Key Highlights</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">What makes Shri Subodh Ranjan Prasad's teaching truly exceptional</p>
          </div>
          <div className="expertise__grid">
            {keyPoints.map(({ icon, title, desc }) => (
              <div className="expertise-card" key={title} id={`expertise-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="expertise-card__icon">{icon}</div>
                <h3 className="expertise-card__title">{title}</h3>
                <p className="expertise-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section about-timeline" id="timeline-section">
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">Journey</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Teaching <span className="gradient-text">Timeline</span></h2>
            <div className="gold-divider" />
          </div>
          <div className="timeline">
            {timeline.map(({ year, event }, idx) => (
              <div className="timeline__item" key={year} id={`timeline-${idx}`}>
                <div className="timeline__dot" />
                <div className="timeline__year">{year}</div>
                <div className="timeline__event">{event}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accompaniment Roles */}
      <section className="section about-sangat" id="sangat-section">
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">Sangat</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Tabla <span className="gradient-text">Accompaniment</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">Guruji as a performing accompanist — the art of supporting and elevating other musicians</p>
          </div>
          <div className="expertise__grid">
            {sangat.map(({ instrument, icon, note }) => (
              <div className="expertise-card" key={instrument} id={`sangat-${instrument.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="expertise-card__icon" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{icon}</div>
                <h3 className="expertise-card__title">{instrument}</h3>
                <p className="expertise-card__desc">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="section about-specialties" id="specialties-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="ornament-text">Repertoire</span>
            <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Areas of <span className="gradient-text">Specialisation</span></h2>
            <div className="gold-divider" />
          </div>
          <div className="specialties__grid">
            {specialties.map(s => (
              <div className="specialty-tag" key={s} id={`specialty-${s.toLowerCase().replace(/\s+/g, '-')}`}>
                <CheckCircle size={15} /> {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta" id="about-cta">
        <div className="container about-cta__inner">
          <h2 className="about-cta__title">Learn from a True Master of Tabla</h2>
          <p className="about-cta__sub">Enroll in our classes and experience traditional Guru-Shishya parampara firsthand.</p>
          <Link to="/book" className="btn btn-primary" id="about-cta-btn">Enroll Now</Link>
        </div>
      </section>
    </main>
  );
}
