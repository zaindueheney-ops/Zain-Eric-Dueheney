import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  User,
  Calendar,
  Globe,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../data/countries';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import { BelizeDistrict } from '../types';

export const WelcomeAuthModal: React.FC = () => {
  const {
    showAuthGreetingModal,
    setShowAuthGreetingModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('Belizean');
  const [district, setDistrict] = useState<string>('Belize');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+501');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!showAuthGreetingModal) return null;

  const handleGoogleAuth = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      setShowAuthGreetingModal(false);
    } catch (err: any) {
      setError(err?.message || 'Google authentication could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address above to receive a password reset link.');
      return;
    }
    setError(null);
    setResetMessage(null);
    try {
      await sendPasswordReset(email);
      setResetMessage(`Password reset link dispatched to ${email}. Check your inbox.`);
    } catch (err: any) {
      setError(err?.message || 'Could not dispatch password reset link.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter both your email address and password.');
        return;
      }
      setIsSubmitting(true);
      try {
        await signInWithEmail(email, password);
        setShowAuthGreetingModal(false);
      } catch (err: any) {
        const code = err?.code || '';
        const msg = err?.message || '';
        console.error('Login error code:', code, msg);

        if (code === 'auth/not-registered' || msg.includes('not been registered') || msg.includes('not-registered')) {
          setMode('signup');
          setPassword('');
          setError('This account has not been registered as a user. You can only log in after completing registration. Please register your details below.');
        } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
          setError(
            'Email/Password sign-in is not enabled in this Firebase project. You can sign in immediately using "Log In with Google" below, or enable Email/Password in Firebase Console -> Authentication -> Sign-in method.'
          );
        } else if (
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found'
        ) {
          setError(
            'Incorrect email or password, or no account exists yet with this email. If you are new to Belize Alerts, please click "Create Account (Sign Up)" above.'
          );
        } else if (code === 'auth/invalid-email') {
          setError('Please provide a valid email address.');
        } else if (code === 'auth/too-many-requests') {
          setError('Access temporarily throttled due to multiple failed attempts. Please wait a moment or use Forgot Password.');
        } else if (code === 'auth/network-request-failed' || msg.includes('timed out')) {
          setError('Network request timed out or connection failed. Please check your internet connectivity.');
        } else {
          setError(msg || 'Failed to sign in. Please verify your credentials or use Google Sign-in.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Sign Up validation
    if (!firstName.trim()) {
      setError('Please provide your First Name.');
      return;
    }
    if (!lastName.trim()) {
      setError('Please provide your Last Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid Email Address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (!dateOfBirth) {
      setError('Please provide your Date of Birth.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your contact Phone Number for emergency communications.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, {
        firstName,
        lastName,
        phoneCountryCode,
        phone,
        district,
        dateOfBirth,
        nationality,
        role: email.toLowerCase() === 'zaindueheney@gmail.com' ? 'admin' : 'citizen',
        organization,
      });
      setShowAuthGreetingModal(false);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      console.error('Sign up error code:', code, msg);

      if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setError(
          'Email/Password sign-up is not enabled in this Firebase project. You can sign up immediately using "Sign Up with Google" below, or enable Email/Password in Firebase Console -> Authentication -> Sign-in method.'
        );
      } else if (
        code === 'auth/email-already-in-use' ||
        msg.includes('email-already-in-use') ||
        msg.includes('already in use')
      ) {
        setMode('login');
        setPassword('');
        setError('This email is already registered. You can only sign up once for an account. Please enter your password below to log in.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a password with at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please provide a valid email address format.');
      } else if (code === 'auth/network-request-failed' || msg.includes('timed out')) {
        setError('Network request timed out. Please check your connection and retry.');
      } else {
        setError(msg || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#1e030a] rounded-2xl shadow-2xl border-2 border-[#d4af37] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Ribbon (Burgundy with Gold Accents) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#4d0718] via-[#6b0f24] to-[#380714] text-white flex items-center justify-between border-b border-[#d4af37]/60">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts Logo"
              className="w-10 h-10 object-cover rounded-xl border border-[#d4af37]/60 shrink-0 shadow"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide text-white">Belize Alerts</span>
                <span className="text-[10px] text-[#f3c853] font-semibold">by Zain Dueheney</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Official National Emergency & Public Safety Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e030a] border border-[#d4af37]/60 text-[10px] text-[#f3c853] font-bold">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Login Required</span>
          </div>
        </div>

        {/* Tab Switcher (Sign Up vs Log In) */}
        <div className="grid grid-cols-2 bg-[#130206] border-b border-[#d4af37]/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setResetMessage(null);
            }}
            className={`py-2 text-xs font-black tracking-wide rounded-lg transition flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'text-amber-200/70 hover:text-white hover:bg-[#2b0510]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Create Account (Sign Up)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setResetMessage(null);
            }}
            className={`py-2 text-xs font-black tracking-wide rounded-lg transition flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'text-amber-200/70 hover:text-white hover:bg-[#2b0510]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Welcome Back (Log In)
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Welcome greeting banner */}
          <div className="p-3 bg-[#2b0510] rounded-xl border border-[#d4af37]/30 text-xs text-amber-100 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-[#f3c853] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">
                {mode === 'signup'
                  ? 'Join the Belize Emergency Response & Citizen Alert Network'
                  : 'Sign in to report emergencies, coordinate dispatch, or track status'}
              </p>
              <p className="text-[11px] text-amber-200/70 mt-0.5">
                Connecting citizens, NEMO, first responders, and emergency units across all 6 Belize districts.
              </p>
            </div>
          </div>

          {/* Google 1-Click Authentication Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{mode === 'signup' ? 'Sign Up with Google' : 'Log In with Google'}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#d4af37]/30"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-amber-200/60 uppercase">
              Or with Email & Password
            </span>
            <div className="flex-grow border-t border-[#d4af37]/30"></div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-950/90 border border-red-500/80 rounded-xl text-xs text-red-100 flex items-start gap-2 shadow-inner animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="leading-relaxed font-medium">{error}</p>
                {mode === 'login' && error.includes('already registered') && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-amber-300">Need help accessing your existing account?</span>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-amber-400 hover:text-white underline font-bold"
                    >
                      Email me a Password Reset Link →
                    </button>
                  </div>
                )}
                {mode === 'login' && error.includes('Sign Up') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 hover:bg-yellow-300 text-slate-950 font-bold text-[11px] shadow transition hover:scale-105"
                  >
                    Switch to Sign Up Form →
                  </button>
                )}
              </div>
            </div>
          )}

          {resetMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {/* Single Account Policy Notice on Sign Up */}
          {mode === 'signup' && (
            <div className="p-2.5 bg-[#1f040b] border border-[#d4af37]/40 rounded-xl text-[11px] text-amber-200/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Single account policy: Once registered, you must log in.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setResetMessage(null);
                }}
                className="px-2 py-0.5 rounded-md bg-[#380714] hover:bg-[#d4af37] text-[#f3c853] hover:text-slate-950 font-bold shrink-0 transition"
              >
                Log In →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Maria"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Martinez"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Date of Birth & Nationality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      Date of Birth <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      Nationality / Country <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                      <select
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.nationality}>
                            {c.flag} {c.nationality} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* District & Phone with Country Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      District (Belize Jurisdiction) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-red-500 absolute left-3 top-3" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
                      >
                        {BELIZE_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} District
                          </option>
                        ))}
                        <option value="International / Other">
                          🌐 International / Non-Resident Visitor
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      Phone Number (All Countries) <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-1.5">
                      {/* Country Code dropdown */}
                      <select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="w-28 px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400 shrink-0"
                        title="Select country calling code"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                            {c.flag} {c.dialCode} ({c.code})
                          </option>
                        ))}
                      </select>

                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 610-1234"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Organization / Responder Affiliation */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Organization / Department Affiliation (Optional)
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. NEMO Cayo volunteer, Red Cross, BERT, BPD, or Citizen"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-amber-200">
                  Password <span className="text-red-400">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>
                    {mode === 'signup'
                      ? 'Sign Up with Email & Complete Profile'
                      : 'Log In to Belize Alerts'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Link */}
          <div className="text-center text-xs text-amber-200/80 pt-1">
            {mode === 'signup' ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setResetMessage(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Log In here
                </button>
              </p>
            ) : (
              <p>
                First time using Belize Alerts?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setResetMessage(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Create an Account
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Official Single Verified Account Policy Footer */}
        <div className="px-5 py-2.5 bg-[#130206] border-t border-[#d4af37]/30 flex items-center justify-between text-[11px] text-amber-200/70">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Official Belize Emergency Network • Single Account Policy</span>
          </span>
          <span className="text-[10px] text-amber-400 font-mono font-bold">
            {mode === 'signup' ? '1 Account / Email' : 'Authorized Access'}
          </span>
        </div>
      </div>
    </div>
  );
};
