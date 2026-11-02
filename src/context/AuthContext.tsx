import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  db,
  handleFirestoreError,
  OperationType,
  type User
} from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, BelizeDistrict, UserRole } from '../types';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  displayName?: string;
  email?: string;
  phoneCountryCode: string;
  phone: string;
  district: BelizeDistrict | string;
  dateOfBirth: string;
  nationality: string;
  role?: UserRole;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isResponder: boolean;
  showAuthGreetingModal: boolean;
  setShowAuthGreetingModal: (show: boolean) => void;
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, data: RegistrationData) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  registerProfile: (data: RegistrationData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for timeout-protected async promises
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs = 9000,
  fallbackMsg = 'Request timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(fallbackMsg));
      }, timeoutMs);
    }),
  ]);
};

export const ADMIN_EMAILS = [
  'zaindueheney@gmail.com',
  'zdueheney@galen.edu.bz',
];

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const [showAuthGreetingModal, setShowAuthGreetingModal] = useState(false);

  // Check if current user is admin (zaindueheney@gmail.com or zdueheney@galen.edu.bz)
  const isAdmin = Boolean(
    isAuthorizedAdminEmail(user?.email) || profile?.role === 'admin'
  );

  const isResponder = Boolean(
    isAdmin || profile?.role === 'responder' || profile?.role === 'dispatcher'
  );

  const fetchProfile = async (uid: string) => {
    // Immediate recovery from localStorage backup so user profile never disappears on refresh
    const cached = localStorage.getItem(`belize_alerts_user_profile_${uid}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile({ ...parsed, id: uid });
        setShowRegisterModal(false);
        setShowAuthGreetingModal(false);
      } catch (e) {
        console.warn('Failed to parse cached profile:', e);
      }
    }

    try {
      const userRef = doc(db, 'users', uid);
      // Timeout protected fetch so slow Firestore requests never block the UI
      const snapshot = await withTimeout(
        getDoc(userRef),
        5500,
        'Profile fetch timeout'
      );

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        const fullProfile = { ...data, id: uid };
        setProfile(fullProfile);
        localStorage.setItem(`belize_alerts_user_profile_${uid}`, JSON.stringify(fullProfile));
        setShowRegisterModal(false);
        setShowAuthGreetingModal(false);
      } else {
        // STRICT ENFORCEMENT: Account has not completed registration in Firestore.
        // Do NOT create automatic fallback profile. Only allow app usage after registration.
        setProfile(null);
        localStorage.removeItem(`belize_alerts_user_profile_${uid}`);
        setShowRegisterModal(true);
        setShowAuthGreetingModal(false);
      }
    } catch (err) {
      console.warn('Profile fetch notice:', err);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.firstName && parsed.phone) {
            setProfile({ ...parsed, id: uid });
            setShowRegisterModal(false);
            setShowAuthGreetingModal(false);
            return;
          }
        } catch (e) {}
      }
      setProfile(null);
      setShowRegisterModal(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
        setShowAuthGreetingModal(false);
      } else {
        setProfile(null);
        setShowRegisterModal(false);
        // Guest mode removed: authentication is strictly required to access Belize Alerts
        setShowAuthGreetingModal(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // STRICT CHECK: Verify if this account is registered as a user in Firestore
        const userRef = doc(db, 'users', result.user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          // Registered user: grant access
          const data = snapshot.data() as UserProfile;
          const fullProfile = { ...data, id: result.user.uid };
          setProfile(fullProfile);
          localStorage.setItem(`belize_alerts_user_profile_${result.user.uid}`, JSON.stringify(fullProfile));
          setShowAuthGreetingModal(false);
          setShowRegisterModal(false);
        } else {
          // NOT registered as a user yet: DO NOT grant application access!
          // Must complete user registration first.
          setProfile(null);
          localStorage.removeItem(`belize_alerts_user_profile_${result.user.uid}`);
          setShowAuthGreetingModal(false);
          setShowRegisterModal(true);
        }
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      // 1. Authenticate credentials
      const cred = await withTimeout(
        signInWithEmailAndPassword(auth, email.trim(), pass),
        8500,
        'Sign in operation timed out. Please verify your internet connection.'
      );

      if (cred.user) {
        // 2. STRICT CHECK: Verify that account has already completed user registration in Firestore
        const userRef = doc(db, 'users', cred.user.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          // User is NOT registered in database: reject login immediately!
          await fbSignOut(auth);
          setUser(null);
          setProfile(null);
          localStorage.removeItem(`belize_alerts_user_profile_${cred.user.uid}`);
          setShowAuthGreetingModal(true);

          const notRegisteredErr: any = new Error(
            'Account Not Registered: This account has not been registered as a user yet. Please complete user registration first.'
          );
          notRegisteredErr.code = 'auth/not-registered';
          throw notRegisteredErr;
        }

        // Account is registered: load profile and grant access
        const data = snapshot.data() as UserProfile;
        const fullProfile = { ...data, id: cred.user.uid };
        setProfile(fullProfile);
        localStorage.setItem(`belize_alerts_user_profile_${cred.user.uid}`, JSON.stringify(fullProfile));
        setShowAuthGreetingModal(false);
        setShowRegisterModal(false);
      }
    } catch (err) {
      console.error('Email sign in failed:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    data: RegistrationData
  ) => {
    try {
      const cred = await withTimeout(
        createUserWithEmailAndPassword(auth, email.trim(), pass),
        8500,
        'Sign up operation timed out. Please check your connection and try again.'
      );

      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
      if (cred.user) {
        try {
          await updateProfile(cred.user, { displayName: fullName });
        } catch (e) {
          console.warn('Failed to update auth display name:', e);
        }

        const now = new Date().toISOString();
        const isUserAdmin = isAuthorizedAdminEmail(cred.user.email);
        const finalRole: UserRole = isUserAdmin ? 'admin' : (data.role || 'citizen');
        const fullPhone = `${data.phoneCountryCode} ${data.phone.trim()}`.trim();

        const newProfile: UserProfile = {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          displayName: fullName,
          email: cred.user.email || email.trim(),
          phoneCountryCode: data.phoneCountryCode,
          phone: data.phone.trim(),
          fullPhone,
          dateOfBirth: data.dateOfBirth,
          nationality: data.nationality,
          district: data.district,
          role: finalRole,
          organization: data.organization?.trim() || '',
          createdAt: now,
          updatedAt: now,
        };

        const path = `users/${cred.user.uid}`;
        // Store in localStorage immediately so profile is never lost on refresh
        localStorage.setItem(`belize_alerts_user_profile_${cred.user.uid}`, JSON.stringify({ ...newProfile, id: cred.user.uid }));

        try {
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        } catch (err) {
          console.warn('Initial write error, retrying setDoc for user profile:', err);
          try {
            await setDoc(doc(db, 'users', cred.user.uid), newProfile);
          } catch (retryErr) {
            console.error('Failed to persist user profile to Firestore:', retryErr);
          }
        }

        setProfile({ ...newProfile, id: cred.user.uid });
        setShowRegisterModal(false);
        setShowAuthGreetingModal(false);
      }
    } catch (err) {
      console.error('Email sign up failed:', err);
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    await withTimeout(
      sendPasswordResetEmail(auth, email.trim()),
      6000,
      'Password reset request timed out.'
    );
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setProfile(null);
      setUser(null);
      setShowAuthGreetingModal(true);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const registerProfile = async (data: RegistrationData) => {
    if (!user) return;
    const now = new Date().toISOString();
    const isUserAdmin = isAuthorizedAdminEmail(user.email);
    const finalRole: UserRole = isUserAdmin ? 'admin' : (data.role || 'citizen');
    
    const firstName = data.firstName?.trim() || '';
    const lastName = data.lastName?.trim() || '';
    const fullName = (firstName && lastName)
      ? `${firstName} ${lastName}`
      : (data.displayName?.trim() || user.displayName || 'Belize Citizen');
    const fullPhone = data.phoneCountryCode
      ? `${data.phoneCountryCode} ${data.phone.trim()}`
      : data.phone.trim();

    const newProfile: UserProfile = {
      firstName,
      lastName,
      displayName: fullName,
      email: user.email || '',
      phoneCountryCode: data.phoneCountryCode || '+501',
      phone: data.phone.trim(),
      fullPhone,
      dateOfBirth: data.dateOfBirth || '',
      nationality: data.nationality || 'Belizean',
      district: data.district,
      role: finalRole,
      organization: data.organization?.trim() || '',
      createdAt: profile?.createdAt || now,
      updatedAt: now,
    };

    const path = `users/${user.uid}`;
    // Store in localStorage backup immediately
    localStorage.setItem(`belize_alerts_user_profile_${user.uid}`, JSON.stringify({ ...newProfile, id: user.uid }));

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile({ ...newProfile, id: user.uid });
      setShowRegisterModal(false);
      setShowAuthGreetingModal(false);
    } catch (err) {
      // In case of error, profile remains safely preserved in state and localStorage
      setProfile({ ...newProfile, id: user.uid });
      setShowRegisterModal(false);
      setShowAuthGreetingModal(false);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isResponder,
        showAuthGreetingModal,
        setShowAuthGreetingModal,
        showRegisterModal,
        setShowRegisterModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        sendPasswordReset,
        registerProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
