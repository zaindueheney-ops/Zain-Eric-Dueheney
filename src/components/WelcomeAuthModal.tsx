import React, { useState } from 'react';
import {
  Shield,
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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';

export const WelcomeAuthModal: React.FC = () => {
  const {
    showAuthGreetingModal,
    setShowAuthGreetingModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
  } = useAuth();

  // Default to 'login' for returning users, easily toggled to 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [district, setDistrict] = useState<string>('Belize');
  const [phone, setPhone] = useState('');

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
      setError('Please enter your email address in the field above to receive a password reset link.');
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
      setError('Please enter your contact phone number for emergency notifications.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0b1220] rounded-2xl shadow-2xl border border-[#1e2e4a] text-white overflow-hidden my-auto flex flex-col">
        {/* Top Header Card */}
        <div className="px-5 pt-6 pb-4 bg-gradient-to-b from-[#131f36] to-[#0b1220] border-b border-[#1e2e4a] text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#1e030a] to-[#380714] border-2 border-[#d4af37] p-1 flex items-center justify-center shadow-xl">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <h2 className="text-lg font-black text-white tracking-wide mt-3 flex items-center justify-center gap-1.5">
            <span>Belize Alerts</span>
            <span className="text-[10px] font-semibold text-[#f3c853] px-2 py-0.5 rounded-full bg-[#1e030a] border border-[#d4af37]/60">
              Official
            </span>
          </h2>

          <p className="text-xs text-slate-300 mt-0.5">
            National Emergency Management & Public Safety Network
          </p>

          {/* Mode Switcher Segmented Tabs */}
          <div className="mt-4 grid grid-cols-2 p-1 rounded-xl bg-[#070c17] border border-[#1e2e4a]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setResetMessage(null);
              }}
              className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setResetMessage(null);
              }}
              className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-5 space-y-4 flex-1">
          {/* Fast Google One-Click Login */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition disabled:opacity-50"
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
            <span>{mode === 'login' ? 'Continue with Google' : 'Sign Up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1e2e4a]"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-[#1e2e4a]"></div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/80 rounded-xl text-xs text-red-100 flex items-start gap-2 shadow-inner animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="leading-relaxed font-medium">{error}</p>
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

          {/* Password Reset Sent Toast */}
          {resetMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {/* Single Account Notice on Sign Up */}
          {mode === 'signup' && (
            <div className="p-2.5 bg-[#0e182a] border border-blue-500/30 rounded-xl text-[11px] text-blue-200 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Single Account Policy:</strong> Once registered, you will log in with this email on future visits.
              </span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Sign Up Fields: Name, Phone, District */}
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121c2e] border border-[#233555] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121c2e] border border-[#233555] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Phone & District */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Contact Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="610-1234"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121c2e] border border-[#233555] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      District <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 rounded-xl bg-[#121c2e] border border-[#233555] text-white text-xs focus:outline-none focus:border-amber-400"
                      >
                        {BELIZE_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121c2e] border border-[#233555] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Password <span className="text-red-400">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#121c2e] border border-[#233555] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
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
              disabled={isSubmitting}
              className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Signing In...' : 'Registering Account...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Sign In to Belize Alerts' : 'Complete Registration & Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Mode Switch Link */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === 'login' ? (
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
            ) : (
              <p>
                Already registered your account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setResetMessage(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Log In Here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
