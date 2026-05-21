import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main className="al-page" id="admin-login-main">
      <div className="al-card" id="admin-login-card">
        <div className="al-card__logo">
          <Music size={28} />
        </div>
        <h1 className="al-card__title">Admin Portal</h1>
        <p className="al-card__sub">Tabla Classes · Booking Management</p>

        <form onSubmit={handleLogin} className="al-form" id="admin-login-form">
          <div className="al-field">
            <label htmlFor="admin-email" className="al-label"><Mail size={13} /> Email</label>
            <input
              id="admin-email"
              type="email"
              className="al-input"
              placeholder="admin@tablaclass.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="al-field">
            <label htmlFor="admin-password" className="al-label"><Lock size={13} /> Password</label>
            <div className="al-input-wrap">
              <input
                id="admin-password"
                type={showPw ? 'text' : 'password'}
                className="al-input al-input--pw"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="al-eye-btn" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="al-error" id="admin-login-error">{error}</p>}

          <button type="submit" className="btn btn-primary al-submit-btn" id="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="al-back"><a href="/">← Back to Website</a></p>
      </div>
    </main>
  );
}
