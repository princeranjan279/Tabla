import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface RiyazUser {
  uid: string;
  email: string;
  name: string;
  phone: string;
  trialStartDate: Timestamp;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'pending_payment';
  subscriptionPlan: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | null;
  subscriptionExpiry: Timestamp | null;
  createdAt: Timestamp;
}

export interface PaymentRequest {
  id?: string;
  uid: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  plan: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  amount: number;
  method: 'upi' | 'card' | 'qr';
  transactionRef: string;
  status: 'pending' | 'confirmed' | 'rejected';
  submittedAt: Timestamp;
  confirmedAt: Timestamp | null;
  confirmedBy: string | null;
  notes?: string;
}

/**
 * Register a new Riyaz user in Firestore with a 14-day free trial.
 */
export async function registerRiyazUser(
  uid: string,
  email: string,
  name: string,
  phone: string,
): Promise<RiyazUser> {
  const now = Timestamp.now();
  // 14 days trial from today
  const trialStartDate = now;
  
  const userData: RiyazUser = {
    uid,
    email,
    name,
    phone,
    trialStartDate,
    subscriptionStatus: 'trial',
    subscriptionPlan: null,
    subscriptionExpiry: null,
    createdAt: now,
  };

  await setDoc(doc(db, 'riyazUsers', uid), userData);
  return userData;
}

/**
 * Fetch a single Riyaz user's subscription details.
 */
export async function getRiyazUser(uid: string): Promise<RiyazUser | null> {
  const snap = await getDoc(doc(db, 'riyazUsers', uid));
  if (!snap.exists()) return null;
  return snap.data() as RiyazUser;
}

/**
 * Real-time listener for a single user's subscription status.
 */
export function listenToRiyazUser(uid: string, callback: (user: RiyazUser | null) => void) {
  return onSnapshot(
    doc(db, 'riyazUsers', uid),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data() as RiyazUser);
    },
    (error) => {
      console.error('Error listening to riyaz user:', error);
    }
  );
}

/**
 * Submit a manual payment request for admin confirmation.
 */
export async function submitPaymentRequest(
  uid: string,
  userEmail: string,
  userName: string,
  userPhone: string,
  plan: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly',
  amount: number,
  method: 'upi' | 'card' | 'qr',
  transactionRef: string,
): Promise<string> {
  // First update user subscription status to 'pending_payment' so they see they are waiting for approval
  await updateDoc(doc(db, 'riyazUsers', uid), {
    subscriptionStatus: 'pending_payment',
    subscriptionPlan: plan,
  });

  const requestData: Omit<PaymentRequest, 'id'> = {
    uid,
    userEmail,
    userName,
    userPhone,
    plan,
    amount,
    method,
    transactionRef,
    status: 'pending',
    submittedAt: Timestamp.now(),
    confirmedAt: null,
    confirmedBy: null,
    notes: '',
  };

  const docRef = await addDoc(collection(db, 'paymentRequests'), requestData);
  return docRef.id;
}

/**
 * Real-time listener for ALL payment requests (for Admin dashboard).
 */
export function listenToAllPaymentRequests(
  callback: (requests: PaymentRequest[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(collection(db, 'paymentRequests'));
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRequest));
      // Sort client-side by submittedAt desc
      docs.sort((a, b) => {
        const aTs = a.submittedAt?.seconds ?? 0;
        const bTs = b.submittedAt?.seconds ?? 0;
        return bTs - aTs;
      });
      callback(docs);
    },
    (error) => {
      console.error('Error listening to payment requests:', error);
      onError?.(error as Error);
    }
  );
}

/**
 * Real-time listener for ALL Riyaz users (for Admin dashboard).
 */
export function listenToAllRiyazUsers(
  callback: (users: RiyazUser[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(collection(db, 'riyazUsers'));
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => d.data() as RiyazUser);
      // Sort by createdAt desc
      docs.sort((a, b) => {
        const aTs = a.createdAt?.seconds ?? 0;
        const bTs = b.createdAt?.seconds ?? 0;
        return bTs - aTs;
      });
      callback(docs);
    },
    (error) => {
      console.error('Error listening to riyaz users:', error);
      onError?.(error as Error);
    }
  );
}

/**
 * Confirm a payment request and update user's subscription status.
 */
export async function confirmPayment(
  requestId: string,
  uid: string,
  plan: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly',
  adminEmail: string,
  notes: string = '',
): Promise<void> {
  const now = Timestamp.now();
  
  // Calculate expiry date based on plan
  let monthsToAdd = 1;
  if (plan === 'quarterly') monthsToAdd = 3;
  if (plan === 'half-yearly') monthsToAdd = 6;
  if (plan === 'yearly') monthsToAdd = 12;

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
  const expiryTimestamp = Timestamp.fromDate(expiryDate);

  // Update payment request
  await updateDoc(doc(db, 'paymentRequests', requestId), {
    status: 'confirmed',
    confirmedAt: now,
    confirmedBy: adminEmail,
    notes,
  });

  // Update user subscription
  await updateDoc(doc(db, 'riyazUsers', uid), {
    subscriptionStatus: 'active',
    subscriptionPlan: plan,
    subscriptionExpiry: expiryTimestamp,
  });
}

/**
 * Reject a payment request.
 */
export async function rejectPayment(
  requestId: string,
  uid: string,
  adminEmail: string,
  notes: string = '',
): Promise<void> {
  const now = Timestamp.now();

  // Update payment request
  await updateDoc(doc(db, 'paymentRequests', requestId), {
    status: 'rejected',
    confirmedAt: now,
    confirmedBy: adminEmail,
    notes,
  });

  // Revert user status to expired (or let them try to pay again)
  await updateDoc(doc(db, 'riyazUsers', uid), {
    subscriptionStatus: 'expired',
  });
}

/**
 * Manually update/extend a user's subscription status from admin panel.
 */
export async function adminUpdateSubscription(
  uid: string,
  status: RiyazUser['subscriptionStatus'],
  plan: RiyazUser['subscriptionPlan'],
  expiryDate: Date | null,
): Promise<void> {
  const expiryTimestamp = expiryDate ? Timestamp.fromDate(expiryDate) : null;
  await updateDoc(doc(db, 'riyazUsers', uid), {
    subscriptionStatus: status,
    subscriptionPlan: plan,
    subscriptionExpiry: expiryTimestamp,
  });
}
