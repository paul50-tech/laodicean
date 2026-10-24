import React, { useState } from 'react';
import { LogOut, X } from 'lucide-react';
import { validateCampusProfile } from '../lib/feedLogic';
import { isSupabaseConfigured } from '../lib/supabase';
import { CampusUser } from '../types/laodicean';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: CampusUser | null;
  onClose: () => void;
  onSignIn: (input: {
    name: string;
    handle: string;
    course: string;
    email: string;
  }) => Promise<{ magicLinkSent: boolean }>;
  onSignOut: () => Promise<void>;
}

/**
 * Lightweight campus profile & Supabase magic-link sign-in modal.
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSignIn,
  onSignOut,
}) => {
  const [name, setName] = useState(currentUser?.name ?? '');
  const [handle, setHandle] = useState(currentUser?.handle ?? '');
  const [course, setCourse] = useState(currentUser?.course ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const validationError = validateCampusProfile({ name, handle, email });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await onSignIn({ name, handle, course, email });
      if (result.magicLinkSent) {
        setNotice(
          `Check ${email} for your Supabase login link. Your campus handle is ready!`
        );
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FAF9F6] rounded-t-3xl sm:rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-3.5">
          <h2
            id="auth-modal-heading"
            className="font-display text-xl font-bold text-zinc-950"
          >
            {currentUser ? 'Your Campus Profile' : 'Sign in to Laodicean'}
          </h2>
          <button
            type="button"
            aria-label="Close sign in dialog"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg inline-flex items-center justify-center text-zinc-600 hover:bg-stone-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-1">
              <p className="font-display text-lg font-bold text-zinc-950">
                {currentUser.name}
              </p>
              <p className="text-xs text-emerald-800 font-semibold">
                {currentUser.handle} · {currentUser.course}
              </p>
              {currentUser.email && (
                <p className="text-xs text-zinc-500">{currentUser.email}</p>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onClose();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-stone-300 bg-white hover:border-red-700 hover:text-red-700 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Pick your handle for posting stories, gists, and replies in c/juja.
              {isSupabaseConfigured
                ? ' We will also send a magic sign-in link via Supabase.'
                : ''}
            </p>

            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Display Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Joy Wambui"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div>
              <label
                htmlFor="auth-handle"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Handle
              </label>
              <input
                id="auth-handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@joy_jkuat"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div>
              <label
                htmlFor="auth-course"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Course & Year (optional)
              </label>
              <input
                id="auth-course"
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. BSc Geomatics · Yr 3"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Student or Personal Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joy@students.jkuat.ac.ke"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            {notice && (
              <p role="status" className="text-xs font-medium text-emerald-800">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? 'Saving Profile…' : 'Save Handle & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
