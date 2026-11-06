import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Sparkles, Check } from 'lucide-react';
import {
  DEFAULT_AVATARS,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  validatePersonaName,
  validateRealName,
} from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  promptMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  promptMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [createPersona, setCreatePersona] = useState(false);
  const [personaName, setPersonaName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0].emoji);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      const nameError = validateRealName(realName);
      if (nameError) {
        setError(nameError);
        return;
      }

      if (createPersona) {
        const pError = validatePersonaName(personaName);
        if (pError) {
          setError(pError);
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpWithPassword({
          email,
          password,
          realName,
          personaName: createPersona ? personaName : undefined,
          personaAvatar: createPersona ? selectedAvatar : undefined,
        });

        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          if (res.session) {
            onAuthSuccess(res.user);
            onClose();
          } else {
            // Email confirmation is required by Supabase project settings
            setMessage(
              'Sign up successful! Please check your email inbox to confirm your account, or sign in if confirmation is disabled.'
            );
          }
        }
      } else {
        const res = await signInWithPassword({ email, password });
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          onAuthSuccess(res.user);
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      setError(error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FAF9F6] rounded-t-3xl sm:rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-200">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-bold text-zinc-950">
              {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {mode === 'signup' ? 'Join Laodicean Juja campus community' : 'Sign in to your campus account'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg inline-flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Prompt banner if triggered by action like reacting or commenting */}
        {promptMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-stone-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setMessage(null);
            }}
            className={`min-h-[38px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setMessage(null);
            }}
            className={`min-h-[38px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Log In
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:border-zinc-900 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs"
        >
          {/* Google SVG Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Quick Admin Sign In for instantaneous testing of admin pin controls */}
        <button
          type="button"
          onClick={() => {
            onAuthSuccess({
              id: '00000000-0000-0000-0000-000000000001',
              email: 'pauljubilee50@gmail.com',
            });
            onClose();
          }}
          className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Quick Campus Moderator Access</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <span className="relative bg-[#FAF9F6] px-3 text-[11px] text-zinc-500 font-medium">
            or continue with email
          </span>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="auth-real-name" className="block text-xs font-medium text-zinc-700">
                Real Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-real-name"
                  type="text"
                  required
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="e.g. Brian Kiprop"
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email-input" className="block text-xs font-medium text-zinc-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.ac.ke or gmail.com"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password-input" className="block text-xs font-medium text-zinc-700">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="auth-password-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>
          </div>

          {/* Optional Persona Section during Sign Up */}
          {mode === 'signup' && (
            <div className="pt-2 border-t border-stone-200 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-zinc-800">
                  Create a campus persona now
                </span>
                <input
                  type="checkbox"
                  checked={createPersona}
                  onChange={(e) => setCreatePersona(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800 border-stone-300 cursor-pointer"
                />
              </label>

              {createPersona && (
                <div className="space-y-2.5 p-3 rounded-xl bg-stone-100 border border-stone-200">
                  <div>
                    <label htmlFor="signup-persona-name" className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Persona Handle
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">@</span>
                      <input
                        id="signup-persona-name"
                        type="text"
                        value={personaName}
                        onChange={(e) => setPersonaName(e.target.value)}
                        placeholder="juja_whisper"
                        className="w-full h-9 pl-6 pr-2 rounded-lg border border-stone-300 bg-white text-xs text-zinc-900 font-mono focus:outline-none focus:border-emerald-800"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Persona Avatar
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DEFAULT_AVATARS.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedAvatar(a.emoji)}
                          className={`min-h-[36px] py-1 rounded-lg border text-sm flex items-center justify-center transition-all cursor-pointer ${
                            selectedAvatar === a.emoji
                              ? 'bg-emerald-50 border-emerald-700 ring-1 ring-emerald-700'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          <span role="img" aria-label={a.label}>{a.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2 mt-2 shadow-xs"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : mode === 'signup' ? (
              <span>Create Account</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>

          {/* Instant Admin Access Button */}
          <div className="pt-2.5 border-t border-stone-200/70 text-center">
            <button
              type="button"
              onClick={() => {
                const adminUser = {
                  id: 'admin-campus-moderator-id',
                  email: 'pauljubilee50@gmail.com',
                  user_metadata: {
                    real_name: 'Campus Administrator',
                    persona_name: '@campus_admin',
                    persona_avatar: '🎓',
                  },
                };
                onAuthSuccess(adminUser);
                onClose();
              }}
              className="cursor-pointer w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Sign in with Moderator Access</span>
            </button>
            <p className="text-[10px] text-zinc-400 mt-1">
              Provides direct access to the Moderator Deck & Persona Reveal
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
