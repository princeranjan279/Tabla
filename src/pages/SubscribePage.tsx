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

export default function SubscribePage() {
  const { user, riyazUser } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[3]); // Default to yearly
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'upi' | 'card'>('qr');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const upiId = 'princeranjan279@upi';
  const accountName = 'Prince Ranjan';
  const bankName = 'State Bank of India';
  const accountNumber = '38920485910'; // Placeholder
  const ifscCode = 'SBIN0004561'; // Placeholder

  // Calculate dynamic UPI payment URL for QR generation
  const upiPaymentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    accountName
  )}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(
    `Riyaz ${selectedPlan.name}`
  )}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiPaymentUrl
  )}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !riyazUser) {
      toast.error('You must be logged in to subscribe.');
      return;
    }

    if (!transactionRef.trim()) {
      toast.error('Please enter the Transaction Reference/UTR ID.');
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
        transactionRef
      );
      toast.success('Payment details submitted successfully! Admin will verify soon.');
      setTransactionRef('');
    } catch (err: any) {
      console.error(err);
      toast.error('Error submitting payment details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatExpiryDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // If status is active
  if (riyazUser?.subscriptionStatus === 'active') {
    return (
      <main className="sp-page" id="subscribe-success-page">
        <div className="sp-status-card glass animate-fade-in-up">
          <div className="sp-status-icon sp-status-icon--active">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="font-heading">Subscription Active!</h2>
          <p className="sp-status-desc">
            Thank you for subscribing. You have full access to Riyaz Studio and Lehra Practice.
          </p>

          <div className="sp-status-details">
            <div className="sp-detail-row">
              <span>Active Plan:</span>
              <strong style={{ textTransform: 'capitalize' }}>
                {riyazUser.subscriptionPlan} Plan
              </strong>
            </div>
            <div className="sp-detail-row">
              <span>Expires On:</span>
              <strong>{formatExpiryDate(riyazUser.subscriptionExpiry)}</strong>
            </div>
          </div>

          <button
            onClick={() => navigate('/practice')}
            className="btn btn-primary sp-status-btn"
          >
            Go to Practice Studio
          </button>
        </div>
      </main>
    );
  }

  // If status is pending verification
  if (riyazUser?.subscriptionStatus === 'pending_payment') {
    return (
      <main className="sp-page" id="subscribe-pending-page">
        <div className="sp-status-card glass animate-fade-in-up">
          <div className="sp-status-icon sp-status-icon--pending">
            <Clock size={48} className="spin-slow" />
          </div>
          <h2 className="font-heading">Payment Pending Verification</h2>
          <p className="sp-status-desc">
            We have received your payment submission. Our admin is verifying the transaction reference.
            Access will be unlocked shortly.
          </p>

          <div className="sp-status-details">
            <div className="sp-detail-row">
              <span>Subscribed Plan:</span>
              <strong style={{ textTransform: 'capitalize' }}>
                {riyazUser.subscriptionPlan} Plan
              </strong>
            </div>
            <div className="sp-detail-row">
              <span>Verification Status:</span>
              <span className="badge badge-outline">Awaiting Admin Confirmation</span>
            </div>
          </div>

          <p className="sp-status-note">
            Usually verified within 1-2 hours. You will receive a confirmation email once active.
          </p>

          <button
            onClick={() => navigate('/')}
            className="btn btn-outline sp-status-btn"
          >
            Return to Homepage
          </button>
        </div>
      </main>
    );
  }

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
            Unlock premium features including professional tanpura tuning, authentic scale-switching, and advanced lehra tempos.
          </p>
        </div>

        {/* Plan Selection Cards */}
        <div className="sp-plans-grid grid-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`sp-plan-card glass ${
                selectedPlan.id === plan.id ? 'sp-plan-card--active' : ''
              } ${plan.popular ? 'sp-plan-card--popular' : ''}`}
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
                Select Plan
              </div>
            </div>
          ))}
        </div>

        {/* Payment and UTR Form */}
        <div className="sp-payment-section glass animate-fade-in">
          <div className="sp-payment-title-wrap">
            <h2 className="font-heading">
              Pay Securely via <span className="gold-text">UPI, QR, or Card</span>
            </h2>
            <p>
              Selected Plan: <strong style={{ textTransform: 'capitalize' }}>{selectedPlan.name}</strong> (₹{selectedPlan.price})
            </p>
          </div>

          <div className="sp-payment-container">
            {/* Payment Method Selector */}
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
                <span>Card/Bank Transfer</span>
              </button>
            </div>

            {/* Payment instructions based on method */}
            <div className="sp-payment-details-box">
              {paymentMethod === 'qr' && (
                <div className="sp-qr-layout">
                  <div className="sp-qr-img-wrap">
                    <img src={qrImageUrl} alt="UPI Payment QR" className="sp-qr-img" />
                    <div className="sp-qr-scan-badge">
                      <Sparkles size={12} /> Scan with Any UPI App
                    </div>
                  </div>
                  <div className="sp-qr-info">
                    <h4>Scan QR code to pay</h4>
                    <p>
                      Open your camera or any UPI App (GPAY, PhonePe, Paytm, BHIM) and scan the QR code to transfer exactly <strong className="gold-text">₹{selectedPlan.price}</strong>.
                    </p>
                    <div className="sp-info-warning">
                      <AlertCircle size={14} />
                      <span>Make sure the payment recipient name shows <strong>{accountName}</strong>.</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="sp-upi-layout">
                  <h4>Transfer to UPI Address</h4>
                  <p>Send exactly <strong className="gold-text">₹{selectedPlan.price}</strong> to the UPI ID below:</p>
                  
                  <div className="sp-copy-box">
                    <code>{upiId}</code>
                    <button type="button" className="sp-copy-btn" onClick={handleCopyUPI}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  
                  <div className="sp-info-row">
                    <span>Account Name:</span>
                    <strong>{accountName}</strong>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="sp-card-layout">
                  <h4>Bank / Card IMPS Transfer</h4>
                  <p>Send exactly <strong className="gold-text">₹{selectedPlan.price}</strong> via your bank app (IMPS/NEFT/RTGS) to this account:</p>
                  
                  <div className="sp-bank-details">
                    <div className="sp-detail-row">
                      <span>Account Name:</span>
                      <strong>{accountName}</strong>
                    </div>
                    <div className="sp-detail-row">
                      <span>Bank Name:</span>
                      <strong>{bankName}</strong>
                    </div>
                    <div className="sp-detail-row">
                      <span>Account Number:</span>
                      <strong>{accountNumber}</strong>
                    </div>
                    <div className="sp-detail-row">
                      <span>IFSC Code:</span>
                      <strong>{ifscCode}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Form */}
            <div className="sp-verification-form-box">
              <form onSubmit={handlePaymentSubmit} className="sp-verify-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="utr-ref">
                    Transaction ID / Reference Number (UTR)
                  </label>
                  <input
                    id="utr-ref"
                    type="text"
                    className="form-input"
                    placeholder="Enter the 12-digit UTR or Reference ID"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                  />
                  <p className="sp-field-help">
                    * UTR is a 12-digit number (e.g. 5240XXXXXXXX) found in payment receipts from Google Pay, PhonePe, Paytm, or your bank.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary sp-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Details…' : 'Submit Reference for Verification'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
