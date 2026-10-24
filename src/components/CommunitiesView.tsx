import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime, slugify, validateCommunityRequest } from '../lib/feedLogic';
import {
  Community,
  CommunityRequest,
  CommunityRequestInput,
} from '../types/laodicean';

interface CommunitiesViewProps {
  communities: Community[];
  requests: CommunityRequest[];
  postCountByCommunity: Record<string, number>;
  focusRequestForm?: boolean;
  onOpenCommunityFeed: (slug: string) => void;
  onSubmitRequest: (input: CommunityRequestInput) => Promise<void>;
}

/**
 * Displays the Laodicean umbrella structure:
 * - Active communities (starting with Juja · JKUAT)
 * - Pending community requests + form to request launching a new community
 */
export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  communities,
  requests,
  postCountByCommunity,
  focusRequestForm = false,
  onOpenCommunityFeed,
  onSubmitRequest,
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [proposedName, setProposedName] = useState('');
  const [campusOrArea, setCampusOrArea] = useState('');
  const [reason, setReason] = useState('');
  const [requesterContact, setRequesterContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (focusRequestForm) {
      nameInputRef.current?.focus();
    }
  }, [focusRequestForm]);

  const previewSlug = slugify(proposedName) || 'your-campus';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedSlug(null);

    const existingSlugs = [
      ...communities.map((c) => c.slug),
      ...requests.map((r) => r.proposedSlug),
    ];

    const validationError = validateCommunityRequest(
      { proposedName, campusOrArea, reason, requesterContact },
      existingSlugs
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const targetSlug = slugify(proposedName);
      await onSubmitRequest({
        proposedName,
        campusOrArea,
        reason,
        requesterContact,
      });
      setSubmittedSlug(targetSlug);
      setProposedName('');
      setCampusOrArea('');
      setReason('');
      setRequesterContact('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Intro Header */}
      <section className="max-w-2xl space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 text-balance">
          Communities inside Laodicean
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
          Laodicean is the umbrella platform. Each campus or neighborhood gets its
          own fast, local stream. We launched first in Juja at JKUAT—and we open new
          communities as local founding writers step up.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 cols: Active Communities + Pending Requests */}
        <div className="lg:col-span-7 space-y-8">
          <section aria-labelledby="active-communities-heading" className="space-y-4">
            <h2
              id="active-communities-heading"
              className="font-display text-lg font-bold text-zinc-900"
            >
              Active now
            </h2>

            {communities.map((community) => (
              <div
                key={community.slug}
                className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden"
              >
                {community.bannerUrl && (
                  <div className="aspect-[16/7] w-full bg-stone-100 overflow-hidden">
                    <img
                      src={community.bannerUrl}
                      alt={`${community.name} campus walkway`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <span className="font-semibold text-emerald-800">
                      c/{community.slug}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{community.region}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {community.memberCount.toLocaleString()} readers
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {postCountByCommunity[community.slug] ?? 0} posts
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-zinc-950">
                      {community.name} — {community.subtitle}
                    </h3>
                    <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
                      {community.description}
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenCommunityFeed(community.slug)}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Open c/{community.slug} feed</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section aria-labelledby="requested-communities-heading" className="space-y-4">
            <h2
              id="requested-communities-heading"
              className="font-display text-lg font-bold text-zinc-900 tabular-nums"
            >
              Requested next ({requests.length})
            </h2>

            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {requests.map((req) => (
                <div key={req.id} className="py-4 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-900">
                      c/{req.proposedSlug}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{req.campusOrArea}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-800 font-medium capitalize">
                      {req.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {formatRelativeTime(req.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {req.proposedName}
                  </p>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {req.reason}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 5 cols: Request a New Community Form */}
        <section
          aria-labelledby="request-form-heading"
          className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="space-y-1">
            <h2
              id="request-form-heading"
              className="font-display text-xl font-bold text-zinc-950"
            >
              Request a new community
            </h2>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Want a Laodicean space for your campus, hostel belt, or town? Submit a
              request below.
            </p>
          </div>

          {submittedSlug && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5"
            >
              <CheckCircle2
                className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">
                  Request received for c/{submittedSlug}!
                </p>
                <p className="mt-0.5 text-emerald-900">
                  Your community now appears in the Requested Next queue while we
                  review founding moderators.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="req-community-name"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Community Name
              </label>
              <input
                ref={nameInputRef}
                id="req-community-name"
                type="text"
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                placeholder="e.g. Rongai or Parklands"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
              <p className="text-[11px] font-mono text-zinc-500 mt-1">
                laodicean.online/c/{previewSlug}
              </p>
            </div>

            <div>
              <label
                htmlFor="req-campus-area"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Campus or Neighborhood
              </label>
              <input
                id="req-campus-area"
                type="text"
                value={campusOrArea}
                onChange={(e) => setCampusOrArea(e.target.value)}
                placeholder="e.g. Multimedia University (MMU), Ongata Rongai"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div>
              <label
                htmlFor="req-reason"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                What will people share here?
              </label>
              <textarea
                id="req-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Honest hostel reviews, matatu fare updates, film student stories, and campus notices..."
                className="w-full p-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div>
              <label
                htmlFor="req-contact"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Your WhatsApp Number or Email
              </label>
              <input
                id="req-contact"
                type="text"
                value={requesterContact}
                onChange={(e) => setRequesterContact(e.target.value)}
                placeholder="+254 712 345 678 or name@university.ac.ke"
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Submitting Request…' : 'Submit Community Request'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
