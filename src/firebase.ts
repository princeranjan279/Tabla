import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyASAm-rr60G4GyaoRGuWM1V7hRjlygztME',
  authDomain: 'tabla-classes.firebaseapp.com',
  projectId: 'tabla-classes',
  storageBucket: 'tabla-classes.firebasestorage.app',
  messagingSenderId: '399405220559',
  appId: '1:399405220559:web:08ff056590f09e02d4adba',
  measurementId: 'G-DWM9TXMFJZ',
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
