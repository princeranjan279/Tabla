import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Sparkles } from 'lucide-react';

export default function TrialBanner() {
  const { riyazUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (isAdmin || !riyazUser || riyazUser.subscriptionStatus !== 'trial') {
    return null;
  }

  const startMs = riyazUser.trialStartDate?.seconds ? riyazUser.trialStartDate.seconds * 1000 : Date.now();
  const daysElapsed = (Date.now() - startMs) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(1, Math.ceil(14 - daysElapsed));

  // If somehow they bypassed the guard but trial has expired
  if (daysElapsed >= 14) return null;

  return (
    <div
      className="trial-banner animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, var(--gold-800) 0%, var(--maroon-700) 100%)',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '2px solid var(--gold-500)',
        position: 'relative',
        zIndex: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <AlertTriangle size={18} className="gold-text animate-pulse-glow" style={{ color: 'var(--gold-300)' }} />
        <span style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
          Riyaz Free Trial: You have <strong style={{ color: 'var(--gold-300)', fontSize: '1.05rem' }}>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left in your trial period.
        </span>
      </div>
      
      <button
        onClick={() => navigate('/subscribe')}
        className="btn btn-primary"
        style={{
          padding: '0.4rem 1.2rem',
          fontSize: '0.85rem',
          borderRadius: '6px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          background: 'linear-gradient(135deg, var(--gold-400), var(--gold-500))',
          color: 'var(--gold-900)',
          fontWeight: 700,
        }}
      >
        <Sparkles size={13} /> Unlock Unlimited Access
      </button>
    </div>
  );
}
