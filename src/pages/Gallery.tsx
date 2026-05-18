import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import './Gallery.css';

type Category = 'all' | 'performance' | 'teaching' | 'instruments' | 'events';

const galleryItems = [
  { id: 'g1', src: '/gallery1.png', title: 'Stage Performance', category: 'performance', desc: 'Classical Tabla performance at a cultural event in Patna' },
  { id: 'g2', src: '/tabla-teaching.png', title: 'Guru-Shishya Teaching', category: 'teaching', desc: 'Shri Subodh Ranjan Prasad guiding a student in traditional style' },
  { id: 'g3', src: '/gallery3.png', title: 'Award Ceremony', category: 'events', desc: 'Felicitation at a classical music recognition event' },
  { id: 'g4', src: '/tabla-instrument.png', title: 'The Sacred Tabla', category: 'instruments', desc: 'A beautifully crafted pair of Tabla – Bayan and Dayan' },
  { id: 'g5', src: '/hero-bg.png', title: 'Cultural Performance', category: 'performance', desc: 'A captivating Tabla performance at a classical music festival' },
  { id: 'g6', src: '/tabla-teaching.png', title: 'Group Session', category: 'teaching', desc: 'Interactive group learning session at the Patna studio' },
  { id: 'g7', src: '/tabla-instrument.png', title: 'Craftsmanship', category: 'instruments', desc: 'Traditional Tabla craftsmanship — the soul of Indian rhythm' },
  { id: 'g8', src: '/gallery1.png', title: 'Live Recital', category: 'performance', desc: 'An enthralling live Tabla recital at Bhartiya Nritya Kala Mandir' },
  { id: 'g9', src: '/gallery3.png', title: 'Cultural Festival', category: 'events', desc: 'Annual classical music festival performance in Bihar' },
  { id: 'g10', src: '/hero-bg.png', title: 'Onstage Mastery', category: 'performance', desc: 'Demonstrating advanced Taal compositions on stage' },
  { id: 'g11', src: '/tabla-teaching.png', title: 'Private Coaching', category: 'teaching', desc: 'One-on-one personalised Tabla coaching session' },
  { id: 'g12', src: '/gallery1.png', title: 'Annual Recital', category: 'events', desc: 'Students\' annual performance showcase event' },
];

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'performance', label: 'Performances' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'instruments', label: 'Instruments' },
  { value: 'events', label: 'Events' },
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [lightbox, setLightbox] = useState<typeof galleryItems[0] | null>(null);

  const filtered = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter(i => i.category === activeCategory);

  return (
    <main className="gallery-page" id="gallery-main">
      {/* Hero */}
      <section className="gallery-hero" id="gallery-hero">
        <div className="gallery-hero__overlay" />
        <div className="container gallery-hero__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Visual Journey</span>
          <h1 className="gallery-hero__title">Photo <span className="gradient-text">Gallery</span></h1>
          <p className="gallery-hero__sub">Moments from performances, teaching sessions, and cultural events</p>
        </div>
      </section>

      <div className="container gallery-layout" id="gallery-section">
        {/* Filter Tabs */}
        <div className="gallery-filters" id="gallery-filters" role="tablist" aria-label="Gallery filter">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              id={`filter-${value}`}
              role="tab"
              aria-selected={activeCategory === value}
              className={`gallery-filter-btn${activeCategory === value ? ' active' : ''}`}
              onClick={() => setActiveCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="gallery-grid" id="gallery-grid">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              id={item.id}
              className="gallery-item"
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => setLightbox(item)}
              role="button"
              tabIndex={0}
              aria-label={`View ${item.title}`}
              onKeyDown={e => e.key === 'Enter' && setLightbox(item)}
            >
              <img src={item.src} alt={item.title} className="gallery-item__img" loading="lazy" />
              <div className="gallery-item__overlay">
                <ZoomIn size={28} className="gallery-item__zoom" />
                <div className="gallery-item__info">
                  <div className="gallery-item__title">{item.title}</div>
                  <div className="gallery-item__desc">{item.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="gallery-empty" id="gallery-empty">
            <p>No photos found in this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label={lightbox.title} onClick={() => setLightbox(null)}>
          <button className="lightbox__close" id="lightbox-close" aria-label="Close lightbox" onClick={() => setLightbox(null)}>
            <X size={24} />
          </button>
          <div className="lightbox__content" onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.title} className="lightbox__img" />
            <div className="lightbox__caption">
              <div className="lightbox__title">{lightbox.title}</div>
              <div className="lightbox__desc">{lightbox.desc}</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
