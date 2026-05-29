import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitPaymentRequest } from '../services/subscriptionService';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Send,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './SubscribePage.css';

interface Plan {
  id: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  name: string;
  price: number;
  duration: string;
  popular?: boolean;
  savings?: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 99,
    duration: '1 Month',
    features: ['Unlimited Practice Sessions', 'Authentic Tanpura & Harmonium Tones', 'Full Tempo & Pitch Controls', 'All Raag Scales Unlocked'],
  },
  {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 349,
    duration: '3 Months',
    savings: 'Save ~15%',
    features: ['Unlimited Practice Sessions', 'Authentic Tanpura & Harmonium Tones', 'Full Tempo & Pitch Controls', 'All Raag Scales Unlocked', 'Priority User Support'],
  },
  {
    id: 'half-yearly',
    name: '6 Months Plan',
    price: 699,
    duration: '6 Months',
    savings: 'Save ~17%',
    features: ['Unlimited Practice Sessions', 'Authentic Tanpura & Harmonium Tones', 'Full Tempo & Pitch Controls', 'All Raag Scales Unlocked', 'Priority User Support', 'Special Practice Tips Feed'],
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 1199,
    duration: '12 Months',
    popular: true,
    savings: 'Save ~30%',
    features: ['Unlimited Practice Sessions', 'Authentic Tanpura & Harmonium Tones', 'Full Tempo & Pitch Controls', 'All Raag Scales Unlocked', 'Priority User Support', 'Special Practice Tips Feed', 'Get 2 Months Free (Included)'],
  },
];

// Admin payment contact constants — single source of truth
const PAYMENT_PHONE  = '7004136051';          // WhatsApp for payment queries
const PAYMENT_WA     = `917004136051`;        // WhatsApp API number (country code + number)
const PAYMENT_UPI    = `${PAYMENT_PHONE}@upi`; // UPI ID
const ACCOUNT_NAME   = 'Prince Ranjan';
const BANK_NAME      = 'State Bank of India';
const ACCOUNT_NUMBER = '38920485910';
const IFSC_CODE      = 'SBIN0004561';

export default function SubscribePage() {
  const { user, riyazUser } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[3]); // Default to yearly
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'upi' | 'card'>('qr');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic UPI QR — regenerates when plan changes
  const upiPaymentUrl = `upi://pay?pa=${PAYMENT_UPI}&pn=${encodeURIComponent(ACCOUNT_NAME)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(`Riyaz ${selectedPlan.name}`)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPaymentUrl)}`;

  // WhatsApp message builder — payment form (includes UTR if typed)
  const buildPaymentWhatsAppUrl = () => {
    const utr = transactionRef.trim();
    const msg = utr
      ? `Hi Prince, I have paid ₹${selectedPlan.price} for the ${selectedPlan.name} on Riyaz Studio. My UTR/Transaction ID is: ${utr}. Please verify and activate my subscription. My email is ${user?.email || ''}.`
      : `Hi Prince, I have paid ₹${selectedPlan.price} for the ${selectedPlan.name} on Riyaz Studio. Please activate my subscription. My email is ${user?.email || ''}.`;
    return `https://wa.me/${PAYMENT_WA}?text=${encodeURIComponent(msg)}`;
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(PAYMENT_UPI);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !riyazUser) {
      toast.error('You must be logged in to subscribe.');
      return;
    }
    if (!transactionRef.trim()) {
      toast.error('Please enter your Transaction ID / UTR number.');
      return;
    }
    setSubmitting(true);
    try {
      await submitPaymentRequest(
        user.uid,
        user.email || '',
        riyazUser.name || 'User',
        riyazUser.phone || '',
        selectedPlan.id,
        selectedPlan.price,
        paymentMethod,
        transactionRef.trim(),
      );
      toast.success('Submitted! Admin will verify and activate your subscription soon.');
      setTransactionRef('');
    } catch (err: any) {
      console.error(err);
      toast.error('Something went wrong. Please try again or contact admin via WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatExpiryDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // ─── SCREEN: Subscription is active ────────────────────────────────────────
  if (riyazUser?.subscriptionStatus === 'active') {
    return (
      <main className="sp-page" id="subscribe-success-page">
        <div className="sp-status-card glass animate-fade-in-up">
          <div className="sp-status-icon sp-status-icon--active">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="font-heading">Subscription Active!</h2>
          <p className="sp-status-desc">
            You have full access to Riyaz Studio and Lehra Practice. Enjoy your sessions!
          </p>

          <div className="sp-status-details">
            <div className="sp-detail-row">
              <span>Active Plan:</span>
              <strong style={{ textTransform: 'capitalize' }}>{riyazUser.subscriptionPlan} Plan</strong>
            </div>
            <div className="sp-detail-row">
              <span>Expires On:</span>
              <strong>{formatExpiryDate(riyazUser.subscriptionExpiry)}</strong>
            </div>
          </div>

          <button onClick={() => navigate('/practice')} className="btn btn-primary sp-status-btn">
            Go to Practice Studio
          </button>
        </div>
      </main>
    );
  }

  // ─── SCREEN: Payment is pending admin verification ──────────────────────────
  if (riyazUser?.subscriptionStatus === 'pending_payment') {
    const currentPlan = PLANS.find(p => p.id === riyazUser?.subscriptionPlan);
    const planName    = currentPlan ? currentPlan.name : `${riyazUser?.subscriptionPlan || ''} Plan`;
    const planPrice   = currentPlan ? currentPlan.price : 0;

    const pendingMsg = `Hi Prince, my subscription payment of ₹${planPrice} for the ${planName} on Riyaz Studio is still pending verification. Please check and activate it. My email is ${riyazUser?.email || user?.email || ''}.`;
    const pendingWhatsAppUrl = `https://wa.me/${PAYMENT_WA}?text=${encodeURIComponent(pendingMsg)}`;

    return (
      <main className="sp-page" id="subscribe-pending-page">
        <div className="sp-status-card glass animate-fade-in-up">
          <div className="sp-status-icon sp-status-icon--pending">
            <Clock size={48} className="spin-slow" />
          </div>
          <h2 className="font-heading">Payment Under Verification</h2>
          <p className="sp-status-desc">
            Your payment details have been received. Admin is verifying your transaction —
            your access will be unlocked as soon as it's confirmed.
          </p>

          <div className="sp-status-details">
            <div className="sp-detail-row">
              <span>Plan Requested:</span>
              <strong style={{ textTransform: 'capitalize' }}>{planName}</strong>
            </div>
            <div className="sp-detail-row">
              <span>Amount:</span>
              <strong className="gold-text">₹{planPrice}</strong>
            </div>
            <div className="sp-detail-row">
              <span>Status:</span>
              <span className="badge badge-outline">⏳ Awaiting Admin Confirmation</span>
            </div>
          </div>

          <p className="sp-status-note">
            Usually verified within 1–2 hours. If it's been longer, tap the button below to follow up directly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            {/* Primary action: Chase admin on WhatsApp */}
            <a
              href={pendingWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-whatsapp-btn"
              id="pending-whatsapp-btn"
            >
              <MessageSquare size={16} /> Follow Up on WhatsApp
            </a>

            <button onClick={() => navigate('/')} className="btn btn-outline sp-status-btn">
              Return to Homepage
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── SCREEN: Main pricing & payment page ───────────────────────────────────
  return (
    <main className="sp-page" id="subscribe-pricing-page">
      <div className="container">

        {/* Header */}
        <div className="sp-header">
          <button className="sp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="sp-title font-heading text-center">
            Choose Your <span className="gradient-text">Practice Plan</span>
          </h1>
          <p className="sp-subtitle text-center">
            Unlock premium practice tools — tanpura, harmonium, lehra tempos, and all raag scales.
          </p>
        </div>

        {/* ── STEP 1: Pick a plan ── */}
        <div className="sp-step-label">
          <span className="sp-step-badge">Step 1</span> Select Your Plan
        </div>
        <div className="sp-plans-grid grid-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`sp-plan-card glass ${selectedPlan.id === plan.id ? 'sp-plan-card--active' : ''} ${plan.popular ? 'sp-plan-card--popular' : ''}`}
            >
              {plan.popular && <span className="sp-plan-tag">Most Popular</span>}
              {plan.savings && <span className="sp-savings-tag">{plan.savings}</span>}

              <h3 className="font-heading">{plan.name}</h3>
              <div className="sp-plan-price">
                <span className="currency">₹</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/{plan.duration}</span>
              </div>

              <ul className="sp-plan-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>
                    <Check size={14} className="gold-text" /> {feat}
                  </li>
                ))}
              </ul>

              <div className="sp-plan-selector">
                <span className="sp-select-radio"></span>
                {selectedPlan.id === plan.id ? 'Selected ✓' : 'Select Plan'}
              </div>
            </div>
          ))}
        </div>

        {/* ── STEP 2 & 3: Pay then Report ── */}
        <div className="sp-payment-section glass animate-fade-in">

          {/* Step 2 header */}
          <div className="sp-step-label" style={{ marginBottom: '1.5rem' }}>
            <span className="sp-step-badge">Step 2</span> Pay <strong className="gold-text">₹{selectedPlan.price}</strong> using any method below
          </div>

          <div className="sp-payment-container">
            {/* Payment Method Tabs */}
            <div className="sp-method-tabs">
              <button
                type="button"
                className={`sp-method-tab ${paymentMethod === 'qr' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('qr')}
              >
                <QrCode size={18} />
                <span>Scan QR Code</span>
              </button>
              <button
                type="button"
                className={`sp-method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <Smartphone size={18} />
                <span>UPI Transfer</span>
              </button>
              <button
                type="button"
                className={`sp-method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={18} />
                <span>Card / Bank</span>
              </button>
            </div>

            {/* Payment instructions */}
            <div className="sp-payment-details-box">

              {paymentMethod === 'qr' && (
                <div className="sp-qr-layout">
                  <div className="sp-qr-img-wrap">
                    <img src={qrImageUrl} alt="UPI Payment QR Code" className="sp-qr-img" />
                    <div className="sp-qr-scan-badge">
                      <Sparkles size={12} /> Scan with Any UPI App
                    </div>
                  </div>
                  <div className="sp-qr-info">
                    <h4>Scan & Pay with GPay, PhonePe, Paytm, or BHIM</h4>
                    <p>
                      Open any UPI app, scan the QR code, and send exactly{' '}
                      <strong className="gold-text">₹{selectedPlan.price}</strong>.
                      The amount is pre-filled automatically.
                    </p>
                    <div className="sp-info-warning">
                      <AlertCircle size={14} />
                      <span>
                        Confirm that the recipient shows <strong>{ACCOUNT_NAME}</strong> before paying.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="sp-upi-layout">
                  <h4>Send to UPI ID</h4>
                  <p>
                    Open any UPI app and send exactly{' '}
                    <strong className="gold-text">₹{selectedPlan.price}</strong> to:
                  </p>
                  <div className="sp-copy-box">
                    <code>{PAYMENT_UPI}</code>
                    <button type="button" className="sp-copy-btn" onClick={handleCopyUPI} title="Copy UPI ID">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="sp-info-row">
                    <span>Account Name:</span>
                    <strong>{ACCOUNT_NAME}</strong>
                  </div>
                  <div className="sp-info-warning" style={{ marginTop: '0.5rem' }}>
                    <AlertCircle size={14} />
                    <span>Double-check the recipient name before confirming the payment.</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="sp-card-layout">
                  <h4>Bank / IMPS / NEFT Transfer</h4>
                  <p>
                    Transfer exactly{' '}
                    <strong className="gold-text">₹{selectedPlan.price}</strong>{' '}
                    via your bank app to the account below:
                  </p>
                  <div className="sp-bank-details">
                    <div className="sp-detail-row">
                      <span>Account Name:</span>
                      <strong>{ACCOUNT_NAME}</strong>
                    </div>
                    <div className="sp-detail-row">
                      <span>Bank Name:</span>
                      <strong>{BANK_NAME}</strong>
                    </div>
                    <div className="sp-detail-row">
                      <span>Account Number:</span>
                      <strong>{ACCOUNT_NUMBER}</strong>
                    </div>
                    <div className="sp-detail-row">
                      <span>IFSC Code:</span>
                      <strong>{IFSC_CODE}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── STEP 3: Confirm payment ── */}
            <div className="sp-verification-form-box">
              <div className="sp-step-label" style={{ marginBottom: '1.25rem' }}>
                <span className="sp-step-badge">Step 3</span> After paying, confirm your payment below
              </div>

              {/* Option A — Submit UTR via form */}
              <form onSubmit={handlePaymentSubmit} className="sp-verify-form">
                <div className="sp-confirm-option-label">
                  Option A — Enter your Transaction ID / UTR and submit:
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="utr-ref">
                    Transaction ID / UTR Number
                  </label>
                  <input
                    id="utr-ref"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 524012345678"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                  />
                  <p className="sp-field-help">
                    Find this 12-digit number in your payment receipt on GPay, PhonePe, Paytm, or your bank app.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary sp-submit-btn"
                  disabled={submitting}
                  id="submit-utr-btn"
                >
                  <Send size={16} />
                  {submitting ? 'Submitting…' : 'Submit for Verification'}
                </button>

                {/* Option B — WhatsApp */}
                <div className="sp-whatsapp-fallback">
                  <span className="sp-fallback-or">or</span>
                  <div className="sp-confirm-option-label" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    Option B — Send your payment details directly via WhatsApp:
                  </div>
                  <a
                    href={buildPaymentWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sp-whatsapp-btn"
                    id="whatsapp-payment-btn"
                  >
                    <MessageSquare size={16} />
                    {transactionRef.trim()
                      ? 'Send UTR via WhatsApp to Admin'
                      : 'Contact Admin on WhatsApp'}
                  </a>
                  <p className="sp-whatsapp-hint">
                    A message will be pre-filled with your plan details
                    {transactionRef.trim() ? ' and UTR number' : ''}. Just tap Send.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
