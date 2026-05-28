import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music, Lock, Mail, User, Phone, Eye, EyeOff, Sparkles, Clock, Music4, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './RiyazLogin.css';

export default function RiyazLogin() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get the redirect path from query string or default to '/practice'
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/practice';

  const handleToggleMode = () => {
    setIsRegister((prev) => !prev);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (phone.length < 10) {
          toast.error('Please enter a valid phone number.');
          setLoading(false);
          return;
        }
        await register(email, password, name, phone);
        toast.success('Account created! Your 14-day free trial has started.');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
      navigate(redirect);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || '';
      if (errMsg.includes('auth/email-already-in-use')) {
        toast.error('Email is already registered. Please login instead.');
      } else if (errMsg.includes('auth/invalid-credential') || errMsg.includes('auth/wrong-password')) {
        toast.error('Incorrect email or password. Please try again.');
      } else if (errMsg.includes('auth/weak-password')) {
        toast.error('Password is too weak. Please use at least 6 characters.');
      } else if (errMsg.includes('auth/invalid-email')) {
        toast.error('Please enter a valid email address.');
      } else {
        toast.error(err.message || (isRegister ? 'Registration failed. Please check inputs.' : 'Login failed. Please check inputs.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rl-page" id="riyaz-login-page">
      <div className="rl-container">
        {/* Left column: Feature Intro */}
        <div className="rl-info-side">
          <div className="rl-info-header">
            <div className="rl-info-logo">
              <Music size={32} className="gold-text animate-float" />
            </div>
            <h1 className="rl-info-title font-heading">
              Tabla &amp; Lehra <br />
              <span className="gradient-text">Riyaz Studio</span>
            </h1>
            <p className="rl-info-subtitle">
              Your ultimate companion for classical Indian music practice, fine-tuned with realistic Tanpura &amp; Harmonium audio.
            </p>
          </div>

          <div className="rl-features-list">
            <div className="rl-feature-item">
              <div className="rl-feature-icon">
                <Clock size={20} />
              </div>
              <div>
                <h4>14-Day Free Trial</h4>
                <p>Register today and get full unlimited access to all features for 14 days. No card required.</p>
              </div>
            </div>

            <div className="rl-feature-item">
              <div className="rl-feature-icon">
                <Music4 size={20} />
              </div>
              <div>
                <h4>Authentic Tanpura &amp; Harmonium</h4>
                <p>Play realistic backing sounds, pitch-perfect scale adjustments, and rhythmic beats matching original tones.</p>
              </div>
            </div>

            <div className="rl-feature-item">
              <div className="rl-feature-icon">
                <Award size={20} />
              </div>
              <div>
                <h4>Premium Lehra Practice</h4>
                <p>Practice diverse Taals and Raags at any tempo with built-in speed variation controls.</p>
              </div>
            </div>
          </div>

          <div className="rl-info-footer">
            <p>Join hundreds of percussionists and vocalists practicing daily.</p>
          </div>
        </div>

        {/* Right column: Form Card */}
        <div className="rl-form-side">
          <div className="rl-card glass">
            <div className="rl-form-header">
              <h2 className="font-heading">{isRegister ? 'Create Account' : 'Sign In'}</h2>
              <p>{isRegister ? 'Sign up to start your 14-day free trial' : 'Sign in to access your practice space'}</p>
            </div>

            <form onSubmit={handleSubmit} className="rl-form" id="riyaz-login-form">
              {isRegister && (
                <>
                  <div className="form-group rl-group">
                    <label className="form-label rl-label" htmlFor="user-name">
                      <User size={14} /> Full Name
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      className="form-input rl-input"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group rl-group">
                    <label className="form-label rl-label" htmlFor="user-phone">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      id="user-phone"
                      type="tel"
                      className="form-input rl-input"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group rl-group">
                <label className="form-label rl-label" htmlFor="user-email">
                  <Mail size={14} /> Email Address
                </label>
                <input
                  id="user-email"
                  type="email"
                  className="form-input rl-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group rl-group">
                <label className="form-label rl-label" htmlFor="user-password">
                  <Lock size={14} /> Password
                </label>
                <div className="rl-input-wrap">
                  <input
                    id="user-password"
                    type={showPw ? 'text' : 'password'}
                    className="form-input rl-input rl-input--pw"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="rl-eye-btn"
                    onClick={() => setShowPw((p) => !p)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary rl-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  'Please wait…'
                ) : (
                  <>
                    <Sparkles size={16} />
                    {isRegister ? 'Start Free Trial' : 'Sign In'}
                  </>
                )}
              </button>
            </form>

            <div className="rl-toggle-mode">
              <span>
                {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
              </span>
              <button
                type="button"
                className="rl-toggle-btn"
                onClick={handleToggleMode}
              >
                {isRegister ? 'Sign In' : 'Create Trial Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
