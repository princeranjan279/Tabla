import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { listenToRiyazUser, registerRiyazUser } from '../services/subscriptionService';
import type { RiyazUser } from '../services/subscriptionService';

interface AuthContextType {
  user: User | null;
  riyazUser: RiyazUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [riyazUser, setRiyazUser] = useState<RiyazUser | null>(null);
  const [loading, setLoading]     = useState(true);

  // Helper to check if a user email is an admin
  const checkIsAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    const emailLower = email.toLowerCase();
    const adminEmails = [
      'admin@tablaclass.com',
      'admin@tablaclasses.com',
      'princeranjan279@gmail.com',
    ];
    return adminEmails.includes(emailLower) || emailLower.startsWith('admin@');
  };

  const isAdmin = checkIsAdmin(user?.email);

  useEffect(() => {
    let unsubSubscription: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, u => {
      setUser(u);
      
      // Clean up previous subscription listener if any
      if (unsubSubscription) {
        unsubSubscription();
        unsubSubscription = null;
      }

      if (u) {
        // If it's an admin, we don't need to listen to subscription
        if (checkIsAdmin(u.email)) {
          setRiyazUser(null);
          setLoading(false);
        } else {
          // Listen to their riyaz subscription document in Firestore
          unsubSubscription = listenToRiyazUser(u.uid, (subData) => {
            if (subData) {
              setRiyazUser(subData);
              setLoading(false);
            } else {
              // Self-healing: if Auth user exists but has no Firestore profile,
              // automatically create it (e.g. if they logged in but registration was cut short)
              registerRiyazUser(u.uid, u.email || '', 'Riyaz Student', '')
                .then((newSubData) => {
                  setRiyazUser(newSubData);
                  setLoading(false);
                })
                .catch((err) => {
                  console.error('Self-healing profile creation failed:', err);
                  setRiyazUser(null);
                  setLoading(false);
                });
            }
          });
        }
      } else {
        setRiyazUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSubscription) unsubSubscription();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const u = userCredential.user;
    
    try {
      // Set up their database profile with a 14-day free trial
      await registerRiyazUser(u.uid, email, name, phone);
    } catch (firestoreError: any) {
      console.error('Firestore write failed during registration:', firestoreError);
      
      // Clean up the created Auth user so they can attempt registration again
      try {
        await u.delete();
      } catch (deleteError) {
        console.error('Failed to delete user after Firestore failure:', deleteError);
      }
      
      throw new Error(
        'Database write failed. Please check if you have updated your Firestore Security Rules in the Firebase Console.'
      );
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, riyazUser, loading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

