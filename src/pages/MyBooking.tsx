import { useState, useEffect } from 'react';
import { Search, Clock, Calendar, Monitor, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getBookingsByPhone, getBookingById, listenToBooking } from '../services/bookingService';
import type { Booking } from '../services/bookingService';
import './MyBooking.css';

type LookupMode = 'phone' | 'id';

const statusConfig = {
  pending:   { label: 'Pending Confirmation', icon: <AlertCircle size={16} />, cls: 'status--pending' },
  confirmed: { label: 'Confirmed',             icon: <CheckCircle size={16} />, cls: 'status--confirmed' },
  cancelled: { label: 'Cancelled',             icon: <XCircle size={16} />,    cls: 'status--cancelled' },
};

function BookingCard({ booking }: { booking: Booking }) {
  // Subscribe to real-time updates for this specific booking
  const [live, setLive] = useState<Booking>(booking);
  useEffect(() => {
    if (!booking.id) return;
    const unsub = listenToBooking(booking.id, b => { if (b) setLive(b); });
    return unsub;
  }, [booking.id]);

  const s = statusConfig[live.status];
  const createdDate = live.created_at
    ? new Date((live.created_at as any).seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div className={`mb-card ${live.status === 'cancelled' ? 'mb-card--cancelled' : ''}`} id={`booking-card-${live.id}`}>
      {/* Header */}
      <div className="mb-card__header">
        <div>
          <p className="mb-card__booking-id-label">Booking ID</p>
          <p className="mb-card__booking-id">{live.id}</p>
        </div>
        <span className={`mb-status ${s.cls}`}>{s.icon} {s.label}</span>
      </div>

      {/* Body */}
      <div className="mb-card__body">
        <div className="mb-card__grid">
          <div className="mb-field">
            <span className="mb-field__label"><Calendar size={13} /> Day</span>
            <span className="mb-field__value">{live.preferred_day}</span>
          </div>
          <div className="mb-field">
            <span className="mb-field__label"><Clock size={13} /> Time Slot</span>
            <span className="mb-field__value">{live.time_slot}</span>
          </div>
          <div className="mb-field">
            <span className="mb-field__label">
              {live.booking_mode.includes('Online') ? <Monitor size={13} /> : <MapPin size={13} />} Mode
            </span>
            <span className="mb-field__value">{live.booking_mode}</span>
          </div>
          <div className="mb-field">
            <span className="mb-field__label">Class Type</span>
            <span className="mb-field__value">{live.class_type}</span>
          </div>
          <div className="mb-field">
            <span className="mb-field__label">Level</span>
            <span className="mb-field__value">{live.current_level}</span>
          </div>
          <div className="mb-field">
            <span className="mb-field__label">Submitted On</span>
            <span className="mb-field__value">{createdDate}</span>
          </div>
        </div>

        {live.additional_note && live.additional_note !== '—' && (
          <div className="mb-field mb-field--note">
            <span className="mb-field__label">Your Note</span>
            <span className="mb-field__value">{live.additional_note}</span>
          </div>
        )}
      </div>

      {/* Status message */}
      {live.status === 'pending' && (
        <div className="mb-card__footer mb-card__footer--pending">
          <AlertCircle size={14} />
          <span>Your booking is under review. Guruji will call you at <strong>{live.phone_number}</strong> to confirm.</span>
        </div>
      )}
      {live.status === 'confirmed' && (
        <div className="mb-card__footer mb-card__footer--confirmed">
          <CheckCircle size={14} />
          <span>Your slot is confirmed! See you on <strong>{live.preferred_day}</strong> at <strong>{live.time_slot}</strong>.</span>
        </div>
      )}
      {live.status === 'cancelled' && (
        <div className="mb-card__footer mb-card__footer--cancelled">
          <XCircle size={14} />
          <span>This booking was cancelled. Please book a new slot or contact Guruji directly.</span>
        </div>
      )}
    </div>
  );
}

export default function MyBooking() {
  const [lookupMode, setLookupMode] = useState<LookupMode>('phone');
  const [input, setInput]           = useState('');
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [searched, setSearched]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setBookings([]);
    setSearched(false);
    try {
      let results: Booking[] = [];
      if (lookupMode === 'phone') {
        results = await getBookingsByPhone(trimmed);
      } else {
        const b = await getBookingById(trimmed);
        if (b) results = [b];
      }
      setBookings(results);
      setSearched(true);
    } catch (err: any) {
      console.error('Booking search error:', err);
      if (err?.code === 'permission-denied') {
        setError('Access denied. Please check your Firestore rules or contact support.');
      } else if (err?.code === 'not-found') {
        setBookings([]);
        setSearched(true);
      } else {
        setError('Something went wrong. Please check your input and try again.');
      }
    }
    setLoading(false);
  };

  return (
    <main className="mb-page" id="my-booking-main">
      {/* Hero */}
      <section className="mb-hero" id="my-booking-hero">
        <div className="mb-hero__overlay" />
        <div className="container mb-hero__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.75rem' }}>Track Your Enrollment</span>
          <h1 className="mb-hero__title">My <span className="gradient-text">Booking</span></h1>
          <p className="mb-hero__sub">Look up your slot booking and check its real-time status.</p>
        </div>
      </section>

      <div className="container mb-main" id="my-booking-content">
        {/* Search Card */}
        <div className="mb-search-card" id="booking-lookup-card">
          <div className="mb-tab-toggle">
            <button
              className={`mb-tab-btn${lookupMode === 'phone' ? ' active' : ''}`}
              id="tab-phone"
              onClick={() => { setLookupMode('phone'); setInput(''); setSearched(false); setBookings([]); }}
            >
              📱 Phone Number
            </button>
            <button
              className={`mb-tab-btn${lookupMode === 'id' ? ' active' : ''}`}
              id="tab-id"
              onClick={() => { setLookupMode('id'); setInput(''); setSearched(false); setBookings([]); }}
            >
              🔖 Booking ID
            </button>
          </div>

          <form onSubmit={handleSearch} className="mb-search-form" id="booking-search-form">
            <div className="mb-search-input-wrap">
              <Search size={18} className="mb-search-icon" />
              <input
                id="booking-lookup-input"
                className="mb-search-input"
                type={lookupMode === 'phone' ? 'tel' : 'text'}
                placeholder={lookupMode === 'phone' ? 'Enter your phone number (e.g. 9308213436)' : 'Enter your Booking ID'}
                value={input}
                onChange={e => setInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary mb-search-btn" id="booking-search-btn" disabled={loading}>
              {loading ? <><RefreshCw size={15} className="spin" /> Searching…</> : 'Find Booking'}
            </button>
          </form>

          {error && <p className="mb-error">{error}</p>}
        </div>

        {/* Results */}
        {searched && (
          <div className="mb-results" id="booking-results">
            {bookings.length === 0 ? (
              <div className="mb-empty" id="booking-not-found">
                <AlertCircle size={40} />
                <h3>No Bookings Found</h3>
                <p>We couldn't find any bookings matching your {lookupMode === 'phone' ? 'phone number' : 'Booking ID'}.<br />Please check your input or <a href="/book">book a new slot</a>.</p>
              </div>
            ) : (
              <>
                <p className="mb-results__count">
                  Found <strong>{bookings.length}</strong> booking{bookings.length > 1 ? 's' : ''} — updates in real-time ⚡
                </p>
                {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
