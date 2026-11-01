import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { ReportReason } from '../types';
import { submitReport } from '../lib/moderation';

export interface ReportTargetInfo {
  type: 'post' | 'comment';
  postId?: string | null;
  commentId?: string | null;
  title?: string | null;
  snippet: string;
  authorPersona?: string | null;
  authorRealName?: string | null;
}

interface ReportModalProps {
  isOpen: boolean;
  target: ReportTargetInfo | null;
  reporterId: string;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  {
    value: 'harassment',
    label: 'Harassment or Bullying',
    desc: 'Targeted attacks, intimidation, or aggressive behavior towards a campus member.',
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech or Discrimination',
    desc: 'Attacking someone based on ethnicity, gender, sexual orientation, or religion.',
  },
  {
    value: 'spam',
    label: 'Spam or Commercial Promotion',
    desc: 'Unsolicited advertisements, repetitive links, scams, or irrelevant promotions.',
  },
  {
    value: 'misinformation',
    label: 'Misinformation or Impersonation',
    desc: 'Fabricated campus news, fake exam schedules, or pretending to be someone else.',
  },
  {
    value: 'other',
    label: 'Other Campus Policy Violation',
    desc: 'Doxxing private information, academic dishonesty, or explicit content.',
  },
];

export function ReportModal({
  isOpen,
  target,
  reporterId,
  onClose,
  onReportSubmitted,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitReport({
        reporterId,
        postId: target.postId,
        commentId: target.commentId,
        reason,
        details,
        targetSnippet: target.snippet,
        targetTitle: target.title,
        targetAuthorPersona: target.authorPersona,
        targetAuthorRealName: target.authorRealName,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit report.');
      }

      setSubmitted(true);
      setTimeout(() => {
        if (onReportSubmitted) onReportSubmitted();
        handleClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not submit report. Please try again.');
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDetails('');
    setReason('harassment');
    setSubmitted(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 id="report-modal-title" className="font-display text-sm font-bold text-zinc-950">
                Report Campus Content
              </h3>
              <p className="text-[11px] text-zinc-500">
                Flagging {target.type === 'post' ? 'post' : 'comment'} for Juja moderation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-stone-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-zinc-900">
                Report Submitted
              </h4>
              <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                Thank you for keeping Juja community safe and respectful. Campus moderators will review this item.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Target Content Preview */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Reported {target.type} by {target.authorPersona || 'Campus Member'}
              </span>
              {target.title && (
                <p className="font-semibold text-zinc-900 truncate">{target.title}</p>
              )}
              <p className="text-zinc-600 italic line-clamp-2">
                &ldquo;{target.snippet}&rdquo;
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500">
                Reason for report
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      reason === r.value
                        ? 'border-rose-400 bg-rose-50/60 font-medium'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-zinc-900">{r.label}</p>
                      <p className="text-[11px] text-zinc-500 leading-snug">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-1">
              <label htmlFor="report-details" className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500">
                Additional Details (Optional)
              </label>
              <textarea
                id="report-details"
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                placeholder="Explain why this content violates community rules..."
                className="w-full p-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-zinc-400 resize-none"
              />
              <span className="text-[10px] text-zinc-400 font-mono float-right">
                {details.length}/500
              </span>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMessage}
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
