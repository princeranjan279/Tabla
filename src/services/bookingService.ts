import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Booking {
  id?: string;
  full_name: string;
  phone_number: string;
  email_address: string;
  preferred_day: string;
  time_slot: string;
  booking_mode: string;
  class_type: string;
  current_level: string;
  additional_note: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at?: Timestamp;
}

/** Pre-generate a new Firestore document reference (synchronous — no network call).
 *  Call this BEFORE any async operations to get the ID immediately. */
export function newBookingRef(): DocumentReference {
  return doc(collection(db, 'bookings'));
}

/** Save a new booking to a pre-generated Firestore ref. */
export async function saveBookingToRef(
  ref: DocumentReference,
  data: Omit<Booking, 'id' | 'status' | 'created_at'>,
): Promise<void> {
  await setDoc(ref, {
    ...data,
    status: 'pending',
    created_at: serverTimestamp(),
  });
}

/** Save a new booking to Firestore. Returns the new document ID. */
export async function saveBooking(data: Omit<Booking, 'id' | 'status' | 'created_at'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...data,
    status: 'pending',
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

/** Fetch all bookings matching a phone number (one-time read). */
export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const q = query(collection(db, 'bookings'), where('phone_number', '==', phone));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
}

/** Fetch a single booking by its document ID (one-time read). */
export async function getBookingById(id: string): Promise<Booking | null> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'bookings', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Booking;
}

/** Real-time listener for a single booking (for user status polling). */
export function listenToBooking(id: string, cb: (b: Booking | null) => void) {
  return onSnapshot(doc(db, 'bookings', id), snap => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...snap.data() } as Booking);
  }, error => {
    console.error("Error listening to booking:", error);
  });
}

/** Real-time listener for ALL bookings (admin use), ordered by newest first. */
export function listenToAllBookings(
  cb: (bookings: Booking[]) => void,
  onError?: (err: Error) => void,
) {
  // No orderBy — avoids needing a Firestore composite index.
  // We sort client-side by created_at instead.
  const q = query(collection(db, 'bookings'));
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
    // Sort newest first using the Timestamp seconds field
    docs.sort((a, b) => {
      const aTs = (a.created_at as any)?.seconds ?? 0;
      const bTs = (b.created_at as any)?.seconds ?? 0;
      return bTs - aTs;
    });
    cb(docs);
  }, error => {
    console.error('Error listening to all bookings:', error);
    onError?.(error as Error);
  });
}


/** Update booking status (admin). */
export async function updateBookingStatus(id: string, status: Booking['status']) {
  await updateDoc(doc(db, 'bookings', id), { status });
}

/** Delete a booking (admin). */
export async function deleteBooking(id: string) {
  await deleteDoc(doc(db, 'bookings', id));
}
