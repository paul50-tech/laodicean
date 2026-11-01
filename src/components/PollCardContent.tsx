import React, { useState, useEffect } from 'react';
import { PollWithResults, PollOptionResult, Profile } from '../types';
import {
  getPollDataForPost,
  submitVote,
  getOrCreateGuestDeviceId,
  SEED_JUJA_POLL_DATA,
} from '../lib/polls';
import {
  BarChart2,
  CheckCircle2,
  Loader2,
  Pin,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface PollCardContentProps {
  postId: string;
  initialPoll?: PollWithResults | null;
  currentUserProfile?: Profile | null;
  onRequireAuth?: (message: string) => void;
  isPinned?: boolean;
  onTogglePin?: (postId: string) => void;
}

export function PollCardContent({
  postId,
  initialPoll,
  currentUserProfile,
  isPinned = false,
  onTogglePin,
}: PollCardContentProps) {
  const [poll, setPoll] = useState<PollWithResults | null>(() => {
    if (initialPoll) return initialPoll;
    if (postId === 'seed-juja-3') return SEED_JUJA_POLL_DATA;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!initialPoll && postId !== 'seed-juja-3');
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync / fetch fresh poll data
  useEffect(() => {
    let active = true;
    const userId = currentUserProfile?.id || getOrCreateGuestDeviceId();

    async function loadData() {
      try {
        const fetched = await getPollDataForPost(postId, userId);
        if (active && fetched) {
          setPoll(fetched);
        }
      } catch {
        // Fall back to current state
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [postId, currentUserProfile]);

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center gap-2 text-xs text-stone-500">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
        <span>Loading poll options...</span>
      </div>
    );
  }

  if (!poll || !poll.options || poll.options.length === 0) {
    return null;
  }

  const hasVoted = Boolean(poll.user_voted_option_id);
  const isAdmin = currentUserProfile?.role === 'admin';

  // Find max votes to highlight leading option
  const maxVotes = Math.max(...poll.options.map((o) => o.votes_count || 0), 0);

  const handleVote = async (optionId: string) => {
    if (hasVoted || votingOptionId) return;

    setVotingOptionId(optionId);
    setErrorMessage(null);

    const effectiveUserId = currentUserProfile?.id || getOrCreateGuestDeviceId();

    try {
      const res = await submitVote({
        poll,
        optionId,
        userId: effectiveUserId,
      });

      if (res.success) {
        setPoll(res.poll);
      } else {
        setErrorMessage(res.error || 'Failed to submit vote. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while recording vote.');
    } finally {
      setVotingOptionId(null);
    }
  };

  return (
    <div className="my-2.5 space-y-3 bg-stone-50/80 rounded-2xl p-3.5 sm:p-4 border border-stone-200/90">
      {/* Poll Header: Question & Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-900">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-800" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Campus Poll
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(postId)}
              className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                isPinned
                  ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200'
              }`}
              title={isPinned ? 'Remove from pinned' : 'Pin as Poll of the Week'}
            >
              <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-700 text-amber-700' : ''}`} />
              <span>{isPinned ? 'Unpin' : 'Pin to Top'}</span>
            </button>
          )}

          <span className="text-[10px] text-zinc-500 font-mono">
            {hasVoted ? 'Results live' : 'Tap to vote'}
          </span>
        </div>
      </div>

      {/* Question if different from main title */}
      {poll.question && (
        <h4 className="text-sm font-semibold text-zinc-900 leading-snug">
          {poll.question}
        </h4>
      )}

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((option: PollOptionResult) => {
          const isSelected = poll.user_voted_option_id === option.id;
          const isLeading = maxVotes > 0 && option.votes_count === maxVotes;
          const isVoting = votingOptionId === option.id;

          if (hasVoted) {
            // Live Percentage Bar view
            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs font-medium'
                    : 'border-stone-200 bg-white'
                }`}
              >
                {/* Background Progress Fill */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-500 rounded-xl ${
                    isSelected
                      ? 'bg-emerald-200/60'
                      : isLeading
                      ? 'bg-amber-100/70'
                      : 'bg-stone-100'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, option.percentage))}%` }}
                />

                {/* Content Overlay */}
                <div className="relative z-10 flex items-center justify-between p-2.5 sm:p-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    )}
                    {isLeading && !isSelected && (
                      <Trophy className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    )}
                    <span className="text-zinc-900 truncate font-medium">
                      {option.option_text}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full shrink-0">
                        Your vote
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      {option.percentage}%
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      ({option.votes_count})
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Interactive Voting button (Not yet voted)
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={Boolean(votingOptionId)}
              className={`w-full min-h-[44px] cursor-pointer text-left p-3 rounded-xl border border-stone-200/90 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex items-center justify-between gap-2.5 text-xs text-zinc-800 group shadow-2xs ${
                isVoting ? 'opacity-70 bg-emerald-50' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-4 h-4 rounded-full border border-stone-300 group-hover:border-emerald-600 group-hover:bg-emerald-100/50 flex items-center justify-center shrink-0 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-emerald-700" />
                </div>
                <span className="truncate group-hover:text-emerald-950 font-medium">
                  {option.option_text}
                </span>
              </div>

              {isVoting ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-800 animate-spin shrink-0" />
              ) : (
                <span className="text-[10px] font-medium text-stone-400 group-hover:text-emerald-800 shrink-0">
                  Vote
                </span>
              )}
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {errorMessage}
        </p>
      )}

      {/* Footer Info: Total Votes & Status */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 border-t border-stone-200/60">
        <span className="font-mono font-medium">
          {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'} cast
        </span>
        <div className="flex items-center gap-1 text-emerald-800 font-medium">
          <Sparkles className="w-3 h-3 text-emerald-700" />
          <span>Juja Campus Pulse</span>
        </div>
      </div>
    </div>
  );
}
