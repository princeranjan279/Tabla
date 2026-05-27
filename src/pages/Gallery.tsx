import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import './Gallery.css';

type Category = 'all' | 'performance' | 'sangat' | 'teaching' | 'awards' | 'events';

const galleryItems = [
  { id: 'g1', src: '/real-hero-2.jpg', title: 'Solo Performance', category: 'performance', desc: 'Shri Subodh Ranjan Prasad performing solo Tabla at a classical music event' },
  { id: 'g2', src: '/sangat2.jpeg', title: 'Bhartiya Nritya Kala Mandir Event', category: 'sangat', desc: 'Tabla sangat at Bhartiya Nritya Kala Mandir, Patna — a classical music programme — 2019' },
  { id: 'g3', src: '/award-img1.jpeg', title: 'Award Ceremony', category: 'awards', desc: 'Receiving award at Shastriya Sangeet Samaroh, Patna' },
  { id: 'g4', src: '/gov-of-bihar.jpeg', title: 'Governor Felicitation', category: 'events', desc: 'Felicitated by a dignitary at an official cultural programme in Patna' },
  { id: 'g5', src: '/sangat1.jpeg', title: 'Sangat — Ustad Iqbal Ahmad Khan', category: 'sangat', desc: 'Tabla sangat for renowned vocalist Ustad Iqbal Ahmad Khan Sahab — a hallmark of Guruji\'s accompanist artistry' },
  { id: 'g6', src: '/solo-varanasi.jpeg', title: 'Solo Varanasi — Kashi Sangeet Sabha', category: 'performance', desc: 'Swatantra Tabla Vadan at Sangeet Sabha, Kashi (Varanasi)' },
  { id: 'g7', src: '/award-img3.jpeg', title: 'Cultural Recognition', category: 'awards', desc: 'Felicitation at a Kala Sansthan cultural recognition ceremony' },
  { id: 'g8', src: '/real-hero.jpg', title: 'Teaching Session', category: 'teaching', desc: 'Shri Subodh Ranjan Prasad teaching Tabla in a class session' },
  { id: 'g9', src: '/gov-house-program.jpeg', title: 'Private Sangeet Programme', category: 'sangat', desc: 'Tabla sangat at a private classical music programme — accompanying distinguished instrumentalists and vocalists' },
  { id: 'g10', src: '/award-img2.jpeg', title: 'Felicitation Ceremony', category: 'events', desc: 'Being felicitated at a classical arts recognition event' },
  { id: 'g11', src: '/shivmani-img.jpeg', title: 'With Shivmani Ji', category: 'awards', desc: 'Shri Subodh Ranjan Prasad with celebrated percussionist Shivmani Ji' },
  { id: 'g12', src: '/solo.jpeg', title: 'Live Recital — Patna', category: 'performance', desc: 'Live Tabla recital at a cultural event in Patna' },
];

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'performance', label: 'Solo Performances' },
  { value: 'sangat', label: 'Accompaniment (Sangat)' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'awards', label: 'Awards & Recognition' },
  { value: 'events', label: 'Felicitations' },
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
