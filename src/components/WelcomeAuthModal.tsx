import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';

interface WelcomeAuthModalProps {
  isStandaloneGate?: boolean;
}

export const WelcomeAuthModal: React.FC<WelcomeAuthModalProps> = ({ isStandaloneGate = false }) => {
  const {
    user,
    showAuthGreetingModal,
    setShowAuthGreetingModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
  } = useAuth();

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [district, setDistrict] = useState<string>('Belize');
  const [phone, setPhone] = useState('');

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // If user is already authenticated and modal wasn't explicitly triggered, hide it
  if (user && !showAuthGreetingModal && !isStandaloneGate) return null;

  const handleGoogleAuth = async () => {
    setError(null);
    setResetMessage(null);
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
      setError('Please enter your email address in the field below to receive a password reset link.');
      return;
    }
    setError(null);
    setResetMessage(null);
    try {
      await sendPasswordReset(email.trim());
      setResetMessage(`Password reset link dispatched to ${email.trim()}. Please check your email inbox.`);
    } catch (err: any) {
      setError(err?.message || 'Could not dispatch password reset link. Please check the email entered.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    // ==========================================
    // LOGIN SUBMISSION
    // ==========================================
    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter both your email address and password to sign in.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signInWithEmail(email.trim(), password);
        setShowAuthGreetingModal(false);
      } catch (err: any) {
        const code = err?.code || '';
        const msg = err?.message || '';
        console.error('Login error code:', code, msg);

        if (
          code === 'auth/not-registered' ||
          msg.includes('not been registered') ||
          msg.includes('not-registered')
        ) {
          setMode('signup');
          setPassword('');
          setError(
            'This account has not been registered as a user yet. Access is only permitted after registration. Please fill in your name and details below to create your account.'
          );
        } else if (
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password'
        ) {
          setError(
            'Invalid credentials or no registered account found for this email. If this is your first time here, please click "Create Account" below.'
          );
        } else if (code === 'auth/invalid-email') {
          setError('Please provide a valid email address format.');
        } else if (code === 'auth/too-many-requests') {
          setError('Temporarily throttled due to multiple failed login attempts. Please reset your password or retry in a few moments.');
        } else {
          setError(msg || 'Failed to sign in. Please check your credentials or continue with Google.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ==========================================
    // SIGN UP (CREATE ACCOUNT) SUBMISSION
    // ==========================================
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
    if (!phone.trim()) {
      setError('Please enter your contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneCountryCode: '+501',
        phone: phone.trim(),
        district,
        dateOfBirth: '2000-01-01',
        nationality: 'Belizean',
        role:
          email.toLowerCase() === 'zaindueheney@gmail.com' ||
          email.toLowerCase() === 'zdueheney@galen.edu.bz'
            ? 'admin'
            : 'citizen',
      });
      setShowAuthGreetingModal(false);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      console.error('Sign up error code:', code, msg);

      if (
        code === 'auth/email-already-in-use' ||
        msg.includes('email-already-in-use') ||
        msg.includes('already in use')
      ) {
        setMode('login');
        setPassword('');
        setError(
          'This email is already registered. In accordance with the Single Account Policy, you can only sign up once. Please log in with your password.'
        );
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a password with at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please provide a valid email address.');
      } else {
        setError(msg || 'Registration failed. Please verify your information and retry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full overflow-hidden bg-[#03060c] animate-in fade-in duration-300">
      {/* Background Image with brightness reduced by half (50%) for a softer, comfortable tone */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-50 contrast-95 transition-all duration-700"
        style={{
          backgroundImage: "url('/assets/aistudio/Screenshot_2026-11-05_at_03.49.40_6baf66c6.png')",
        }}
      />

      {/* Soft Ambient Overlay to blend background softly and comfortably */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/20 pointer-events-none" />

      {/* Main Full-Height Left Sidebar Panel - Transparent Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-[490px] sm:max-w-[470px] md:max-w-[490px] lg:max-w-[510px] h-full min-h-screen overflow-y-auto bg-black/25 backdrop-blur-md border-r border-white/20 p-6 sm:p-8 flex flex-col justify-between shadow-2xl text-white">
        
        {/* Top Header Section */}
        <div>
          {/* Header Bar with Logo and Security Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/image_ff7e619e.png"
                alt="Belize Alerts Logo"
                className="w-12 h-12 rounded-2xl object-cover bg-white/10 backdrop-blur-sm p-0.5 border border-[#d4af37] shadow-xl shrink-0"
              />
              <div className="text-left leading-tight">
                <h1 className="font-black text-lg sm:text-xl text-white tracking-wider leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  BELIZE ALERTS
                </h1>
                <p className="text-[11px] font-extrabold text-[#f3c853] tracking-[0.2em] uppercase mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  BY ZAIN DUEHENEY
                </p>
              </div>
            </div>

            {/* When not logged in, login is mandatory and exiting is prevented */}
            {user ? (
              <button
                type="button"
                onClick={() => setShowAuthGreetingModal(false)}
                className="p-1.5 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition cursor-pointer"
                title="Close and return to dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 shadow-sm backdrop-blur-sm select-none"
                title="Access restricted: You must sign in or register to use Belize Alerts"
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span className="uppercase tracking-wider">Login Required</span>
              </div>
            )}
          </div>

          <p className="text-xs text-white/90 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            National Emergency Operations & Disaster Risk Reduction Platform
          </p>

          {/* Eyebrow & Title */}
          <div className="mt-5">
            <span className="text-[11px] font-black tracking-widest text-[#f3c853] uppercase block drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {mode === 'login' ? 'CENTRAL DISPATCH AUTHENTICATION' : 'CENTRAL DISPATCH REGISTRATION'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-white mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              {mode === 'login' ? 'Sign In to Portal' : 'Create Portal Account'}
            </h2>
            <p className="text-xs text-white/95 mt-1.5 leading-relaxed font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {mode === 'login'
                ? 'Please sign in using your verified email address to access the emergency operations dashboard.'
                : 'Register your account to access official incident dispatch, emergency advisories, and responder alerts.'}
            </p>
          </div>

          {/* Segmented Pill Switcher (Sign In / Create Account) - Transparent Glass */}
          <div className="mt-5 grid grid-cols-2 p-1 rounded-full bg-black/25 backdrop-blur-md border border-white/25 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setResetMessage(null);
              }}
              className={`py-2 text-xs font-black rounded-full transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#e6bc3b] text-slate-950 shadow-md'
                  : 'text-white hover:text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setResetMessage(null);
              }}
              className={`py-2 text-xs font-black rounded-full transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#e6bc3b] text-slate-950 shadow-md'
                  : 'text-white hover:text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google One-Click Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full bg-white/95 hover:bg-white text-slate-900 font-bold text-xs shadow-lg backdrop-blur-sm transition disabled:opacity-50 mt-4 cursor-pointer"
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
            <span>Continue with Google Sign-In</span>
          </button>

          {/* Divider with Transparent Glass Badge */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/25" />
            </div>
            <span className="relative px-3.5 py-0.5 bg-black/30 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-amber-200 rounded-full border border-white/20 shadow-md">
              OR WITH EMAIL ADDRESS
            </span>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-3 p-3 bg-red-950/50 backdrop-blur-md border border-red-400/80 rounded-xl text-xs text-white flex items-start gap-2 shadow-lg drop-shadow">
              <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="leading-relaxed font-semibold">{error}</p>
                {mode === 'login' && error.includes('Create Account') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-bold hover:underline pt-0.5"
                  >
                    <span>Click here to register your account</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {resetMessage && (
            <div className="mb-3 p-3 bg-emerald-950/50 backdrop-blur-md border border-emerald-400/80 rounded-xl text-xs text-emerald-100 flex items-start gap-2 shadow-lg drop-shadow">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span className="font-semibold">{resetMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* If Sign Up mode: First & Last Name */}
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      First Name *
                    </label>
                    <div className="relative rounded-xl bg-black/25 backdrop-blur-md border border-white/30 focus-within:border-amber-400 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                      <User className="w-4 h-4 text-amber-300 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-white font-semibold placeholder:text-white/60 focus:outline-none drop-shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      Last Name *
                    </label>
                    <div className="relative rounded-xl bg-black/25 backdrop-blur-md border border-white/30 focus-within:border-amber-400 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                      <User className="w-4 h-4 text-amber-300 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-white font-semibold placeholder:text-white/60 focus:outline-none drop-shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Phone & District */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      Phone Number *
                    </label>
                    <div className="relative rounded-xl bg-black/25 backdrop-blur-md border border-white/30 focus-within:border-amber-400 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                      <Phone className="w-4 h-4 text-amber-300 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="610-1234"
                        className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-white font-semibold placeholder:text-white/60 focus:outline-none drop-shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      District *
                    </label>
                    <div className="relative rounded-xl bg-black/25 backdrop-blur-md border border-white/30 focus-within:border-amber-400 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                      <MapPin className="w-4 h-4 text-amber-300 absolute left-3 top-2.5" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
                      >
                        {BELIZE_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.id} className="bg-[#121c2e] text-white">
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Address Field */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                EMAIL ADDRESS *
              </label>
              <div className="relative rounded-xl bg-black/25 backdrop-blur-md border border-white/30 focus-within:border-amber-400 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                <Mail className="w-4 h-4 text-amber-300 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com or personal email"
                  className="w-full pl-10 pr-3 py-2.5 bg-transparent text-xs text-white font-semibold placeholder:text-white/60 focus:outline-none drop-shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  PASSWORD *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-xs text-amber-300 hover:text-amber-200 font-bold hover:underline drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative rounded-xl bg-black/25 backdrop-blur-md border border-white/30 focus-within:border-amber-400 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                <Lock className="w-4 h-4 text-amber-300 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-white font-semibold placeholder:text-white/60 focus:outline-none drop-shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-white/80 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6bc3b] hover:from-[#e5c158] hover:to-[#f0ce6b] text-slate-950 font-black text-xs shadow-xl transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{mode === 'login' ? 'Signing In...' : 'Registering Account...'}</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>{mode === 'login' ? 'Sign In to Portal' : 'Register & Enter Portal'}</span>
                </>
              )}
            </button>
          </form>

          {/* Switcher text link */}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
              setResetMessage(null);
            }}
            className="text-xs text-amber-300 hover:text-amber-200 font-black hover:underline drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-4 block mx-auto text-center cursor-pointer"
          >
            {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign In'}
          </button>
        </div>

        {/* Pinned Bottom Footer of Left Panel */}
        <div className="pt-4 mt-6 border-t border-white/20 flex items-center justify-between text-xs text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-semibold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 drop-shadow" />
            <span>Encrypted Dispatch Authentication</span>
          </div>
          <span className="font-bold text-amber-200">Belize Alerts • Central Farm</span>
        </div>
      </div>
    </div>
  );
};
