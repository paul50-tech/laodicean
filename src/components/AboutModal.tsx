import React from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  MessageSquare,
  Lock,
  BarChart2,
  Clock,
  Sparkles,
} from 'lucide-react';

import { Community } from '../types';

interface AboutModalProps {
  isOpen: boolean;
  community?: Community | null;
  onClose: () => void;
}

export function AboutModal({ isOpen, community, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  const campusName = community?.name || 'Juja Campus Hub';
  const customRules = community?.rules || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-display font-bold text-base">
              L
            </div>
            <div>
              <h2 id="about-modal-title" className="font-display text-sm font-bold tracking-tight">
                About Laodicean • {campusName}
              </h2>
              <p className="text-[11px] text-stone-300">
                Community Guidelines, Dual Identity & Governance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close about dialog"
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Mission intro */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-emerald-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>{campusName}</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              <strong>{campusName}</strong> is part of the <strong>Laodicean</strong> campus network. Connect with fellow students, discuss stories, post memes, and stay updated with campus pulse.
            </p>
          </div>

          {/* Campus-specific rules if available */}
          {customRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-display text-sm font-bold text-zinc-950">
                  {campusName} Campus Rules
                </h3>
              </div>
              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-2">
                {customRules.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Safety Rules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 text-zinc-900 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-zinc-950">
                Platform Safety Standards
              </h3>
            </div>

            <div className="space-y-3">
              {/* Rule 1 */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="font-bold text-xs text-zinc-950">
                    Respect, Dignity & Anti-Harassment
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed pl-7">
                  Zero tolerance for ethnic discrimination, tribal slurs, cyberbullying, doxxing personal contact numbers or hostels, and non-consensual private photos. Treat fellow comrades with dignity.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="font-bold text-xs text-purple-950">
                    Dual Identity & Persona Accountability
                  </h4>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed pl-7">
                  Campus personas allow anonymous confessions, street mushene, and whistleblowing. However, persona anonymity is <strong>not a shield for defamation or malicious rumors</strong>. Verified administrators retain secure identity mappings and can unmask personas in severe harassment cases.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <span>Strict Prohibition on Polls Naming Real People</span>
                    <span className="text-[9px] font-bold bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded uppercase">
                      Strictly Enforced
                    </span>
                  </h4>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed pl-7">
                  Polls must compare <strong>campus spots, food venues, courses, units, or anonymous situations</strong>. Polls that target, rank, or single out individual students, lecturers, or staff by personal name are strictly forbidden and will be removed immediately.
                </p>
              </div>

              {/* Rule 4 */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                    4
                  </span>
                  <h4 className="font-bold text-xs text-blue-950">
                    Anti-Spam & Fair Voice Rate Limiting
                  </h4>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed pl-7">
                  To prevent feed hijacking and commercial promotions, automated cooldown timers are enforced (max 2 posts per 3 minutes, 5 comments per 2 minutes, 3 moments per 5 minutes). All students get an equal voice.
                </p>
              </div>

              {/* Rule 5 */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                    5
                  </span>
                  <h4 className="font-bold text-xs text-rose-950">
                    Community Auto-Moderation & Auto-Hide
                  </h4>
                </div>
                <p className="text-[11px] text-rose-900 leading-relaxed pl-7">
                  Any post or comment that receives <strong>3 or more verified community reports</strong> is automatically hidden from public feed view pending administrator review. Restricted keywords and scam triggers are blocked on submission.
                </p>
              </div>
            </div>
          </div>

          {/* Guest Blogger & Moderation Deck */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <h4 className="font-bold text-zinc-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-800" />
              <span>Campus Societies & Guest Blogger Accounts</span>
            </h4>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Student associations, faculty clubs, and department societies can request verified guest blogger status through the admin deck. Guest posts undergo an editorial preview queue to ensure quality reporting for the entire student body.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">Juja Community Standards • 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            I Agree to Juja Rules
          </button>
        </div>
      </div>
    </div>
  );
}
