import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, CheckCircle, XCircle, AlertCircle,
  Trash2, Clock, Monitor, MapPin, Users, TrendingUp,
  RefreshCw, Calendar, CreditCard, Sparkles, User, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  listenToAllBookings,
  updateBookingStatus,
  deleteBooking,
} from '../services/bookingService';
import type { Booking } from '../services/bookingService';
import {
  listenToAllPaymentRequests,
  listenToAllRiyazUsers,
  confirmPayment,
  rejectPayment,
  adminUpdateSubscription,
} from '../services/subscriptionService';
import type { PaymentRequest, RiyazUser } from '../services/subscriptionService';
import { toast } from 'react-hot-toast';
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

  // Navigation state
  const [activeTab, setActiveTab] = useState<'bookings' | 'subscriptions'>('bookings');

  // Bookings states
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [fetchError, setFetchError]     = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modeFilter, setModeFilter]     = useState<ModeFilter>('all');
  const [dayFilter, setDayFilter]       = useState('all');
  
  // Subscriptions states
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [riyazUsers, setRiyazUsers]           = useState<RiyazUser[]>([]);
  const [loadingSubs, setLoadingSubs]         = useState(true);

  // Common action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Real-time listener for bookings
  useEffect(() => {
    setFetchError('');
    const unsub = listenToAllBookings(
      data => {
        setBookings(data);
        setLoadingBookings(false);
        setFetchError('');
      },
      (err: Error) => {
        console.error('Firestore error:', err);
        setLoadingBookings(false);
        setFetchError(err.message || 'Firestore read failed. Check security rules.');
      }
    );
    return unsub;
  }, []);

  // Real-time listeners for subscriptions & payments
  useEffect(() => {
    if (!user) return;
    
    const unsubRequests = listenToAllPaymentRequests(
      data => {
        setPaymentRequests(data);
        setLoadingSubs(false);
      },
      err => {
        console.error('Firestore error (payments):', err);
        toast.error('Failed to listen to payment requests.');
      }
    );

    const unsubUsers = listenToAllRiyazUsers(
      data => {
        setRiyazUsers(data);
      },
      err => {
        console.error('Firestore error (users):', err);
        toast.error('Failed to listen to Riyaz users.');
      }
    );

    return () => {
      unsubRequests();
      unsubUsers();
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Booking handlers
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

  // Subscription/Payment handlers
  const handleConfirmPayment = async (request: PaymentRequest) => {
    if (!user?.email) return;
    setActionLoading(request.id + 'confirm');
    try {
      await confirmPayment(request.id!, request.uid, request.plan, user.email, 'Payment verified manually by admin.');
      toast.success(`Payment verified! ${request.userName} is now Active.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Error confirming payment: ' + (err?.message || ''));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async (request: PaymentRequest) => {
    if (!user?.email) return;
    const notes = prompt('Enter reason for rejection:', 'Transaction reference number invalid.') || '';
    if (notes === '') return; // Cancelled
    
    setActionLoading(request.id + 'reject');
    try {
      await rejectPayment(request.id!, request.uid, user.email, notes);
      toast.success(`Payment rejected for ${request.userName}.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Error rejecting payment: ' + (err?.message || ''));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendSubscription = async (riyazUser: RiyazUser, days: number) => {
    setActionLoading(riyazUser.uid + 'extend-' + days);
    try {
      let currentExpiry = riyazUser.subscriptionExpiry ? new Date(riyazUser.subscriptionExpiry.seconds * 1000) : new Date();
      if (currentExpiry.getTime() < Date.now()) {
        currentExpiry = new Date();
      }
      currentExpiry.setDate(currentExpiry.getDate() + days);
      await adminUpdateSubscription(riyazUser.uid, 'active', riyazUser.subscriptionPlan || 'monthly', currentExpiry);
      toast.success(`Extended subscription of ${riyazUser.name} by ${days} days.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Error extending subscription: ' + (err?.message || ''));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeSubscription = async (riyazUser: RiyazUser) => {
    if (!confirm(`Are you sure you want to revoke and immediately expire access for ${riyazUser.name}?`)) {
      return;
    }
    setActionLoading(riyazUser.uid + 'revoke');
    try {
      await adminUpdateSubscription(riyazUser.uid, 'expired', null, null);
      toast.success(`Revoked subscription for ${riyazUser.name}.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Error revoking subscription: ' + (err?.message || ''));
    } finally {
      setActionLoading(null);
    }
  };

  // Derived bookings filters
  const days = useMemo(() => {
    const s = new Set(bookings.map(b => b.preferred_day));
    return ['all', ...Array.from(s)];
  }, [bookings]);

  const filteredBookings = useMemo(() => bookings.filter(b => {
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

  // Derived subscription filters
  const filteredUsers = useMemo(() => riyazUsers.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    }
    return true;
  }), [riyazUsers, search]);

  const filteredRequests = useMemo(() => paymentRequests.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.transactionRef.toLowerCase().includes(q)
      );
    }
    return true;
  }), [paymentRequests, search]);

  // Bookings Stats
  const bookingStats = useMemo(() => ({
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    online:    bookings.filter(b => b.booking_mode.includes('Online')).length,
    offline:   bookings.filter(b => b.booking_mode.includes('Offline')).length,
  }), [bookings]);

  // Subscription Stats
  const subStats = useMemo(() => ({
    total: riyazUsers.length,
    active: riyazUsers.filter(u => u.subscriptionStatus === 'active').length,
    trial: riyazUsers.filter(u => u.subscriptionStatus === 'trial').length,
    pending: riyazUsers.filter(u => u.subscriptionStatus === 'pending_payment').length,
    expired: riyazUsers.filter(u => u.subscriptionStatus === 'expired').length,
  }), [riyazUsers]);

  const formatDate = (b: { created_at?: any; submittedAt?: any }) => {
    const ts = b.created_at || b.submittedAt;
    if (!ts) return '—';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatExpiry = (riyazUser: RiyazUser) => {
    if (riyazUser.subscriptionStatus === 'trial') {
      const startMs = riyazUser.trialStartDate?.seconds ? riyazUser.trialStartDate.seconds * 1000 : Date.now();
      const elapsed = (Date.now() - startMs) / (1000 * 60 * 60 * 24);
      const remaining = Math.max(0, Math.ceil(14 - elapsed));
      return `${remaining} trial days left`;
    }
    if (riyazUser.subscriptionStatus === 'active' && riyazUser.subscriptionExpiry) {
      return new Date(riyazUser.subscriptionExpiry.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }
    return 'Expired';
  };

  const getSubStatusBadge = (status: RiyazUser['subscriptionStatus']) => {
    if (status === 'active') return <span className="ad-badge ad-badge--confirmed"><CheckCircle size={12} /> Active</span>;
    if (status === 'trial') return <span className="ad-badge ad-badge--pending"><Clock size={12} /> Trial</span>;
    if (status === 'pending_payment') return <span className="ad-badge ad-badge--alert"><AlertCircle size={12} /> Pending verification</span>;
    return <span className="ad-badge ad-badge--cancelled"><XCircle size={12} /> Expired</span>;
  };

  const getRequestStatusBadge = (status: PaymentRequest['status']) => {
    if (status === 'confirmed') return <span className="ad-badge ad-badge--confirmed"><CheckCircle size={12} /> Confirmed</span>;
    if (status === 'rejected') return <span className="ad-badge ad-badge--cancelled"><XCircle size={12} /> Rejected</span>;
    return <span className="ad-badge ad-badge--pending"><AlertCircle size={12} /> Pending</span>;
  };

  return (
    <main className="ad-page" id="admin-dashboard">
      {/* Top Bar */}
      <header className="ad-topbar" id="admin-topbar">
        <div className="ad-topbar__left">
          <div className="ad-topbar__logo">🎵</div>
          <div>
            <div className="ad-topbar__title">Admin Dashboard</div>
            <div className="ad-topbar__sub">Tabla Classes · Business Operations</div>
          </div>
        </div>
        <div className="ad-topbar__right">
          <span className="ad-topbar__email">{user?.email}</span>
          <button className="ad-logout-btn" id="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="ad-tabs-wrapper">
        <div className="ad-tabs">
          <button
            className={`ad-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('bookings'); setSearch(''); }}
          >
            <Calendar size={15} /> Bookings Management
          </button>
          <button
            className={`ad-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('subscriptions'); setSearch(''); }}
          >
            <CreditCard size={15} /> Riyaz Subscriptions &amp; Payments
          </button>
        </div>
      </div>

      <div className="ad-body">
        {activeTab === 'bookings' ? (
          /* =======================================================================
             BOOKINGS TAB
             ======================================================================= */
          <>
            {/* Stats */}
            <div className="ad-stats" id="admin-stats">
              {[
                { label: 'Total Bookings', value: bookingStats.total,     icon: <Users size={20} />,      cls: '' },
                { label: 'Pending',        value: bookingStats.pending,   icon: <AlertCircle size={20} />, cls: 'ad-stat--pending' },
                { label: 'Confirmed',      value: bookingStats.confirmed, icon: <CheckCircle size={20} />, cls: 'ad-stat--confirmed' },
                { label: 'Cancelled',      value: bookingStats.cancelled, icon: <XCircle size={20} />,     cls: 'ad-stat--cancelled' },
                { label: 'Online',         value: bookingStats.online,    icon: <Monitor size={20} />,     cls: '' },
                { label: 'Offline',        value: bookingStats.offline,   icon: <MapPin size={20} />,      cls: '' },
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
                <span className="ad-live-dot" /> Live · {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            <div className="ad-table-wrap" id="bookings-table-wrap">
              {fetchError && (
                <div className="ad-fetch-error" id="admin-fetch-error">
                  <span>⚠️ <strong>Firestore Error:</strong> {fetchError}</span>
                </div>
              )}
              {loadingBookings ? (
                <div className="ad-loading" id="admin-loading">
                  <RefreshCw size={28} className="spin" />
                  <p>Loading bookings…</p>
                </div>
              ) : filteredBookings.length === 0 ? (
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
                    {filteredBookings.map(b => (
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
          </>
        ) : (
          /* =======================================================================
             SUBSCRIPTIONS TAB
             ======================================================================= */
          <>
            {/* Stats */}
            <div className="ad-stats" id="admin-sub-stats">
              {[
                { label: 'Total Riyaz Users', value: subStats.total,   icon: <User size={20} />,      cls: '' },
                { label: 'Active Members',   value: subStats.active,  icon: <Sparkles size={20} />,   cls: 'ad-stat--confirmed' },
                { label: 'Awaiting Approvals',value: subStats.pending, icon: <AlertCircle size={20} />, cls: 'ad-stat--alert' },
                { label: 'Trial Period',     value: subStats.trial,    icon: <Clock size={20} />,     cls: 'ad-stat--pending' },
                { label: 'Expired Status',   value: subStats.expired,  icon: <XCircle size={20} />,   cls: 'ad-stat--cancelled' },
              ].map(({ label, value, icon, cls }) => (
                <div className={`ad-stat ${cls}`} key={label} id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="ad-stat__icon">{icon}</div>
                  <div className="ad-stat__value">{value}</div>
                  <div className="ad-stat__label">{label}</div>
                </div>
              ))}
            </div>

            {/* Main Filters bar */}
            <div className="ad-filters">
              <div className="ad-search-wrap">
                <Search size={16} className="ad-search-icon" />
                <input
                  id="admin-search-subs"
                  className="ad-search"
                  placeholder="Search users, email, or UTR ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="ad-live-badge">
                <span className="ad-live-dot" /> Live · {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Block 1: Pending Payment Requests */}
            <div className="ad-sub-section">
              <h2 className="ad-section-title font-heading">
                <CreditCard size={18} /> Pending Payment Verifications
              </h2>

              <div className="ad-table-wrap">
                {loadingSubs ? (
                  <div className="ad-loading">
                    <RefreshCw size={28} className="spin" />
                    <p>Loading payments…</p>
                  </div>
                ) : filteredRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="ad-empty">
                    <CheckCircle size={36} style={{ color: 'var(--accent)' }} />
                    <p>No pending payment verification requests.</p>
                  </div>
                ) : (
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>User Details</th>
                        <th>Selected Plan</th>
                        <th>Amount Due</th>
                        <th>Method</th>
                        <th>Reference UTR</th>
                        <th>Submitted At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests
                        .filter(r => r.status === 'pending')
                        .map(req => (
                          <tr key={req.id} className="ad-row ad-row--pending">
                            <td>
                              <div className="ad-name">{req.userName}</div>
                              <div className="ad-contact">{req.userEmail}</div>
                              <div className="ad-contact">{req.userPhone}</div>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>
                              <strong>{req.plan}</strong>
                            </td>
                            <td>
                              <strong>₹{req.amount}</strong>
                            </td>
                            <td style={{ textTransform: 'uppercase' }}>
                              <span className="badge badge-outline">{req.method}</span>
                            </td>
                            <td>
                              <code className="utr-code">{req.transactionRef}</code>
                            </td>
                            <td>{formatDate(req)}</td>
                            <td>
                              <div className="ad-actions">
                                <button
                                  className="ad-action-btn ad-action-btn--confirm"
                                  title="Approve Payment"
                                  disabled={actionLoading === req.id + 'confirm'}
                                  onClick={() => handleConfirmPayment(req)}
                                >
                                  {actionLoading === req.id + 'confirm' ? (
                                    <RefreshCw size={13} className="spin" />
                                  ) : (
                                    <>Approve</>
                                  )}
                                </button>
                                <button
                                  className="ad-action-btn ad-action-btn--cancel"
                                  title="Reject Payment"
                                  disabled={actionLoading === req.id + 'reject'}
                                  onClick={() => handleRejectPayment(req)}
                                >
                                  {actionLoading === req.id + 'reject' ? (
                                    <RefreshCw size={13} className="spin" />
                                  ) : (
                                    <>Reject</>
                                  )}
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

            {/* Block 2: Riyaz Users Manager */}
            <div className="ad-sub-section" style={{ marginTop: '3rem' }}>
              <h2 className="ad-section-title font-heading">
                <Users size={18} /> Registered Riyaz Members
              </h2>

              <div className="ad-table-wrap">
                {loadingSubs ? (
                  <div className="ad-loading">
                    <RefreshCw size={28} className="spin" />
                    <p>Loading users…</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="ad-empty">
                    <Users size={36} />
                    <p>No registered users found.</p>
                  </div>
                ) : (
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>User Name &amp; Contact</th>
                        <th>Created At</th>
                        <th>Plan</th>
                        <th>Subscription Status</th>
                        <th>Access Expiry</th>
                        <th style={{ width: '300px' }}>Admin Extension Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.uid} className={`ad-row ad-row--${u.subscriptionStatus}`}>
                          <td>
                            <div className="ad-name">{u.name}</div>
                            <div className="ad-contact">{u.email}</div>
                            <div className="ad-contact">{u.phone}</div>
                          </td>
                          <td>{formatDate({ created_at: u.createdAt })}</td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {u.subscriptionPlan ? <strong>{u.subscriptionPlan}</strong> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td>{getSubStatusBadge(u.subscriptionStatus)}</td>
                          <td>
                            <strong>{formatExpiry(u)}</strong>
                          </td>
                          <td>
                            <div className="ad-actions" style={{ gap: '0.4rem', justifyContent: 'flex-start' }}>
                              <button
                                className="ad-action-btn ad-action-btn--extend"
                                title="Add 30 Days Access"
                                disabled={actionLoading === u.uid + 'extend-30'}
                                onClick={() => handleExtendSubscription(u, 30)}
                              >
                                {actionLoading === u.uid + 'extend-30' ? (
                                  <RefreshCw size={12} className="spin" />
                                ) : (
                                  <>+30 Days</>
                                )}
                              </button>
                              <button
                                className="ad-action-btn ad-action-btn--extend"
                                title="Add 90 Days Access"
                                disabled={actionLoading === u.uid + 'extend-90'}
                                onClick={() => handleExtendSubscription(u, 90)}
                              >
                                {actionLoading === u.uid + 'extend-90' ? (
                                  <RefreshCw size={12} className="spin" />
                                ) : (
                                  <>+90 Days</>
                                )}
                              </button>
                              {u.subscriptionStatus !== 'expired' && (
                                <button
                                  className="ad-action-btn ad-action-btn--cancel"
                                  title="Revoke / Expire access"
                                  disabled={actionLoading === u.uid + 'revoke'}
                                  onClick={() => handleRevokeSubscription(u)}
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  {actionLoading === u.uid + 'revoke' ? (
                                    <RefreshCw size={12} className="spin" />
                                  ) : (
                                    <>Revoke</>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Block 3: Log of Past Verifications */}
            <div className="ad-sub-section" style={{ marginTop: '3rem' }}>
              <h2 className="ad-section-title font-heading" style={{ opacity: 0.85 }}>
                <Award size={18} /> Historic Verification Log
              </h2>
              <div className="ad-table-wrap">
                {filteredRequests.filter(r => r.status !== 'pending').length === 0 ? (
                  <div className="ad-empty" style={{ padding: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No historical payment verification logs.</p>
                  </div>
                ) : (
                  <table className="ad-table" style={{ opacity: 0.85 }}>
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>UTR Ref</th>
                        <th>Status</th>
                        <th>Verified By</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests
                        .filter(r => r.status !== 'pending')
                        .map(req => (
                          <tr key={req.id} className={`ad-row ad-row--${req.status}`}>
                            <td>
                              <div className="ad-name" style={{ fontSize: '0.85rem' }}>{req.userName}</div>
                              <div className="ad-contact" style={{ fontSize: '0.75rem' }}>{req.userEmail}</div>
                            </td>
                            <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{req.plan}</td>
                            <td style={{ fontSize: '0.85rem' }}>₹{req.amount}</td>
                            <td><code className="utr-code" style={{ fontSize: '0.75rem' }}>{req.transactionRef}</code></td>
                            <td>{getRequestStatusBadge(req.status)}</td>
                            <td style={{ fontSize: '0.8rem' }}>
                              <div>{req.confirmedBy || 'System'}</div>
                              <div className="ad-contact" style={{ fontSize: '0.75rem' }}>
                                {req.confirmedAt ? new Date(req.confirmedAt.seconds * 1000).toLocaleString('en-IN') : ''}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.notes || '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

