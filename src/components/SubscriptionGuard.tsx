import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, riyazUser, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <RefreshCw size={32} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>Loading subscription status…</p>
      </div>
    );
  }

  // 1. If not logged in, redirect to login
  if (!user) {
    return <Navigate to={`/riyaz-login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 2. Admins skip all subscription checks
  if (isAdmin) {
    return <>{children}</>;
  }

  // If subscription data isn't loaded yet
  if (!riyazUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <RefreshCw size={32} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-body)' }}>Initializing practice space…</p>
      </div>
    );
  }

  const { subscriptionStatus, trialStartDate, subscriptionExpiry } = riyazUser;

  // 3. Check trial status
  if (subscriptionStatus === 'trial') {
    const startMs = trialStartDate?.seconds ? trialStartDate.seconds * 1000 : Date.now();
    const daysElapsed = (Date.now() - startMs) / (1000 * 60 * 60 * 24);

    // If 14 days have passed, the trial has expired
    if (daysElapsed >= 14) {
      return <Navigate to="/subscribe" replace />;
    }
  }

  // 4. Check active subscription expiry
  if (subscriptionStatus === 'active') {
    const expiryMs = subscriptionExpiry?.seconds ? subscriptionExpiry.seconds * 1000 : 0;
    if (Date.now() > expiryMs) {
      return <Navigate to="/subscribe" replace />;
    }
  }

  // 5. Check if payment is pending or expired
  if (subscriptionStatus === 'pending_payment' || subscriptionStatus === 'expired') {
    return <Navigate to="/subscribe" replace />;
  }

  // Access granted!
  return <>{children}</>;
}
