import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Pin,
  ExternalLink,
} from 'lucide-react';
import { MemeOfTheWeekContest, FeedPost, Profile } from '../types';
import {
  getMemeOfTheWeekContest,
  voteForMemeCandidate,
  pinWinningMeme,
  calculateMemeVotePercentages,
  getWinningMemeCandidate,
} from '../lib/memeOfTheWeek';

interface MemeOfTheWeekSectionProps {
  onSelectPost?: (post: FeedPost) => void;
  currentUserProfile?: Profile | null;
  className?: string;
}

export function MemeOfTheWeekSection({
  onSelectPost,
  currentUserProfile,
  className = '',
}: MemeOfTheWeekSectionProps) {
  const [contest, setContest] = useState<MemeOfTheWeekContest>(getMemeOfTheWeekContest());
  const [isExpanded, setIsExpanded] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  useEffect(() => {
    setContest(getMemeOfTheWeekContest());

    const handleUpdate = () => {
      setContest(getMemeOfTheWeekContest());
    };
    window.addEventListener('meme-of-week-updated', handleUpdate);
    return () => window.removeEventListener('meme-of-week-updated', handleUpdate);
  }, []);

  const percentages = calculateMemeVotePercentages(contest.candidates);
  const winningCandidate = getWinningMemeCandidate(contest);
  const isAdmin = currentUserProfile?.role === 'admin';

  const handleVote = (candidateId: string) => {
    const res = voteForMemeCandidate(candidateId);
    if (res.success) {
      setContest(res.contest);
      setVoteFeedback('Vote recorded! Thanks for deciding this week’s campus champion.');
      setTimeout(() => setVoteFeedback(null), 3500);
    } else if (res.error) {
      setVoteFeedback(res.error);
      setTimeout(() => setVoteFeedback(null), 3500);
    }
  };

  const handlePin = (postId: string) => {
    const res = pinWinningMeme(postId);
    setContest(res.contest);
    setVoteFeedback('Pinned as official Meme of the Week winner!');
    setTimeout(() => setVoteFeedback(null), 3500);
  };

  return (
    <div
      aria-label="Juja Meme of the Week Competition"
      className={`bg-linear-to-r from-amber-500/10 via-purple-500/5 to-emerald-500/10 border border-amber-300/80 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3 ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Trophy className="w-4 h-4 fill-amber-950/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-zinc-950 flex items-center gap-1.5">
                <span>Meme of the Week</span>
                <span className="text-[10px] font-mono bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Voting Open
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-zinc-600">
              Juja campus votes on the top 3 memes. Current leader is pinned at the top!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {winningCandidate && (
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-300/80 text-amber-950 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Leader: <strong>{winningCandidate.title}</strong></span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Voting' : 'Vote Now'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {voteFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-in fade-in">
          <span>{voteFeedback}</span>
          <button
            type="button"
            onClick={() => setVoteFeedback(null)}
            className="text-emerald-700 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Pinned Winner Highlight Strip (when collapsed) */}
      {!isExpanded && winningCandidate && (
        <div className="bg-white/90 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base shrink-0">👑</span>
            <div className="min-w-0">
              <p className="font-bold text-zinc-950 truncate">
                Pinned Winner: {winningCandidate.title}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                By {winningCandidate.authorName} • {winningCandidate.votesCount} campus votes ({percentages[winningCandidate.id] || 0}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
              <Pin className="w-3 h-3" />
              <span>Pinned Winner</span>
            </span>
          </div>
        </div>
      )}

      {/* Expanded 3 Candidate Cards for Interactive Voting */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {contest.candidates.map((cand) => {
            const pct = percentages[cand.id] || 0;
            const hasVoted = contest.userVotedCandidateId === cand.id;
            const isWinner = winningCandidate?.id === cand.id;

            return (
              <div
                key={cand.id}
                className={`bg-white rounded-2xl border p-3 flex flex-col justify-between gap-2.5 transition-all shadow-2xs ${
                  isWinner
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-zinc-700 font-mono truncate">
                      {cand.authorName}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-0.5">
                        <Trophy className="w-3 h-3 text-amber-700" />
                        <span>Winner</span>
                      </span>
                    )}
                  </div>

                  {cand.imageUrl && (
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={cand.imageUrl}
                        alt={cand.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-zinc-950 leading-snug line-clamp-1">
                    {cand.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    "{cand.captionSnippet}"
                  </p>
                </div>

                {/* Voting Progress & Button */}
                <div className="space-y-2 pt-1 border-t border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-600 font-mono">
                      <span>{cand.votesCount} votes</span>
                      <span className="font-bold text-zinc-900">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isWinner ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleVote(cand.id)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        hasVoted
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-zinc-800'
                      }`}
                    >
                      {hasVoted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Voted ✓</span>
                        </>
                      ) : (
                        <span>Vote Meme</span>
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handlePin(cand.postId)}
                        title="Pin this meme as winner"
                        className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-zinc-600 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
