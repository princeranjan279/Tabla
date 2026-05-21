import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, CheckCircle, XCircle, AlertCircle,
  Trash2, Clock, Monitor, MapPin, Users, TrendingUp,
  RefreshCw, Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  listenToAllBookings,
  updateBookingStatus,
  deleteBooking,
} from '../services/bookingService';
import type { Booking } from '../services/bookingService';
import './AdminDashboard.css';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled';
type ModeFilter   = 'all' | 'Offline (In-Person)' | 'Online (Google Meet)';

const statusBadge = (status: Booking['status']) => {
  if (status === 'confirmed') return <span className="ad-badge ad-badge--confirmed"><CheckCircle size={12} /> Confirmed</span>;
  if (status === 'cancelled') return <span className="ad-badge ad-badge--cancelled"><XCircle size={12} /> Cancelled</span>;
  return <span className="ad-badge ad-badge--pending"><AlertCircle size={12} /> Pending</span>;
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modeFilter, setModeFilter]     = useState<ModeFilter>('all');
  const [dayFilter, setDayFilter]       = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    setFetchError('');
    const unsub = listenToAllBookings(
      data => {
        setBookings(data);
        setLoading(false);
        setFetchError('');
      },
      (err: Error) => {
        console.error('Firestore error:', err);
        setLoading(false);
        setFetchError(err.message || 'Firestore read failed. Check security rules.');
      }
    );
    return unsub;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleStatus = async (id: string, status: Booking['status']) => {
    setActionLoading(id + status);
    await updateBookingStatus(id, status);
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    setActionLoading(id + 'del');
    await deleteBooking(id);
    setActionLoading(null);
    setDeleteConfirm(null);
  };

  // Derived filters
  const days = useMemo(() => {
    const s = new Set(bookings.map(b => b.preferred_day));
    return ['all', ...Array.from(s)];
  }, [bookings]);

  const filtered = useMemo(() => bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (modeFilter   !== 'all' && b.booking_mode !== modeFilter) return false;
    if (dayFilter    !== 'all' && b.preferred_day !== dayFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.full_name.toLowerCase().includes(q) &&
          !b.phone_number.includes(q) &&
          !b.email_address.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [bookings, statusFilter, modeFilter, dayFilter, search]);

  // Stats
  const stats = useMemo(() => ({
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    online:    bookings.filter(b => b.booking_mode.includes('Online')).length,
    offline:   bookings.filter(b => b.booking_mode.includes('Offline')).length,
  }), [bookings]);

  const formatDate = (b: Booking) => {
    if (!b.created_at) return '—';
    return new Date((b.created_at as any).seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <main className="ad-page" id="admin-dashboard">
      {/* Top Bar */}
      <header className="ad-topbar" id="admin-topbar">
        <div className="ad-topbar__left">
          <div className="ad-topbar__logo">🎵</div>
          <div>
            <div className="ad-topbar__title">Admin Dashboard</div>
            <div className="ad-topbar__sub">Tabla Classes · Booking Management</div>
          </div>
        </div>
        <div className="ad-topbar__right">
          <span className="ad-topbar__email">{user?.email}</span>
          <button className="ad-logout-btn" id="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      <div className="ad-body">
        {/* Stats */}
        <div className="ad-stats" id="admin-stats">
          {[
            { label: 'Total Bookings', value: stats.total,     icon: <Users size={20} />,      cls: '' },
            { label: 'Pending',        value: stats.pending,   icon: <AlertCircle size={20} />, cls: 'ad-stat--pending' },
            { label: 'Confirmed',      value: stats.confirmed, icon: <CheckCircle size={20} />, cls: 'ad-stat--confirmed' },
            { label: 'Cancelled',      value: stats.cancelled, icon: <XCircle size={20} />,     cls: 'ad-stat--cancelled' },
            { label: 'Online',         value: stats.online,    icon: <Monitor size={20} />,     cls: '' },
            { label: 'Offline',        value: stats.offline,   icon: <MapPin size={20} />,      cls: '' },
          ].map(({ label, value, icon, cls }) => (
            <div className={`ad-stat ${cls}`} key={label} id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="ad-stat__icon">{icon}</div>
              <div className="ad-stat__value">{value}</div>
              <div className="ad-stat__label">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="ad-filters" id="admin-filters">
          <div className="ad-search-wrap">
            <Search size={16} className="ad-search-icon" />
            <input
              id="admin-search"
              className="ad-search"
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select id="filter-status" className="ad-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select id="filter-mode" className="ad-select" value={modeFilter} onChange={e => setModeFilter(e.target.value as ModeFilter)}>
            <option value="all">All Modes</option>
            <option value="Offline (In-Person)">Offline</option>
            <option value="Online (Google Meet)">Online</option>
          </select>

          <select id="filter-day" className="ad-select" value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d === 'all' ? 'All Days' : d}</option>)}
          </select>

          <div className="ad-live-badge" id="realtime-badge">
            <span className="ad-live-dot" /> Live · {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        <div className="ad-table-wrap" id="bookings-table-wrap">
          {fetchError && (
            <div className="ad-fetch-error" id="admin-fetch-error">
              <span>⚠️ <strong>Firestore Error:</strong> {fetchError}</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Go to <strong>Firebase Console → Firestore → Rules</strong> and make sure <code>allow read: if request.auth != null;</code> is set for the bookings collection.
              </p>
            </div>
          )}
          {loading ? (
            <div className="ad-loading" id="admin-loading">
              <RefreshCw size={28} className="spin" />
              <p>Loading bookings…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ad-empty" id="admin-empty">
              <TrendingUp size={36} />
              <p>No bookings match the current filters.</p>
            </div>
          ) : (
            <table className="ad-table" id="bookings-table">
              <thead>
                <tr>
                  <th>Name / Contact</th>
                  <th><Calendar size={13} /> Day &amp; Slot</th>
                  <th>Mode</th>
                  <th>Class Info</th>
                  <th><Clock size={13} /> Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className={`ad-row ad-row--${b.status}`} id={`row-${b.id}`}>
                    <td>
                      <div className="ad-name">{b.full_name}</div>
                      <div className="ad-contact">{b.phone_number}</div>
                      <div className="ad-contact">{b.email_address}</div>
                    </td>
                    <td>
                      <div className="ad-day">{b.preferred_day}</div>
                      <div className="ad-slot">{b.time_slot}</div>
                    </td>
                    <td>
                      <span className={`ad-mode ${b.booking_mode.includes('Online') ? 'ad-mode--online' : 'ad-mode--offline'}`}>
                        {b.booking_mode.includes('Online') ? <Monitor size={12} /> : <MapPin size={12} />}
                        {b.booking_mode.includes('Online') ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>
                      <div className="ad-class-type">{b.class_type}</div>
                      <div className="ad-level">{b.current_level}</div>
                    </td>
                    <td className="ad-date">{formatDate(b)}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>
                      <div className="ad-actions">
                        {b.status !== 'confirmed' && (
                          <button
                            className="ad-action-btn ad-action-btn--confirm"
                            id={`confirm-${b.id}`}
                            title="Mark Confirmed"
                            disabled={actionLoading === b.id + 'confirmed'}
                            onClick={() => handleStatus(b.id!, 'confirmed')}
                          >
                            {actionLoading === b.id + 'confirmed' ? <RefreshCw size={13} className="spin" /> : <CheckCircle size={13} />}
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button
                            className="ad-action-btn ad-action-btn--cancel"
                            id={`cancel-${b.id}`}
                            title="Mark Cancelled"
                            disabled={actionLoading === b.id + 'cancelled'}
                            onClick={() => handleStatus(b.id!, 'cancelled')}
                          >
                            {actionLoading === b.id + 'cancelled' ? <RefreshCw size={13} className="spin" /> : <XCircle size={13} />}
                          </button>
                        )}
                        {b.status !== 'pending' && (
                          <button
                            className="ad-action-btn ad-action-btn--pending"
                            id={`pending-${b.id}`}
                            title="Mark Pending"
                            disabled={actionLoading === b.id + 'pending'}
                            onClick={() => handleStatus(b.id!, 'pending')}
                          >
                            {actionLoading === b.id + 'pending' ? <RefreshCw size={13} className="spin" /> : <AlertCircle size={13} />}
                          </button>
                        )}
                        <button
                          className={`ad-action-btn ad-action-btn--delete${deleteConfirm === b.id ? ' confirm-mode' : ''}`}
                          id={`delete-${b.id}`}
                          title={deleteConfirm === b.id ? 'Click again to confirm delete' : 'Delete Booking'}
                          disabled={actionLoading === b.id + 'del'}
                          onClick={() => handleDelete(b.id!)}
                        >
                          {actionLoading === b.id + 'del' ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
