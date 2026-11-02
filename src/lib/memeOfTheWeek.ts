/**
 * Weekly Meme of the Week Voting & Pinned Winner Service for Juja Campus.
 * 
 * Features:
 * - Weekly curated meme contest with 3 candidate memes.
 * - Interactive voting with real-time percentage progress bars.
 * - Current winner pinned at the top of the feed with crown/trophy badge.
 * - Admin/contestant pinning capabilities.
 */

import { MemeCandidate, MemeOfTheWeekContest } from '../types';

export const LOCAL_MEME_OF_WEEK_KEY = 'laodicean_meme_of_week_contest';

export const DEFAULT_MEME_OF_WEEK_CONTEST: MemeOfTheWeekContest = {
  id: 'contest-week-44',
  weekLabel: 'Juja Meme of the Week • Week 44',
  candidates: [
    {
      id: 'cand-1',
      postId: 'seed-juja-meme-1',
      title: 'Stepping Out of Gate C Reality',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      authorName: '@stage_watcher',
      votesCount: 142,
      captionSnippet: 'Walking out of Gate C looking fresh, returning looking like a powdered doughnut.',
    },
    {
      id: 'cand-2',
      postId: 'seed-juja-meme-2',
      title: 'The JKUAT Wifi Experience',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      authorName: '@tech_park_ninja',
      votesCount: 98,
      captionSnippet: 'Full signal at Tech Park, but only ping works. 1 KB/s pure suspense.',
    },
    {
      id: 'cand-3',
      postId: 'seed-juja-10',
      title: 'Submitting Assignments at 11:59 PM',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      authorName: '@clutch_coder',
      votesCount: 185,
      captionSnippet: 'The portal upload spinner carrying the weight of an entire semester.',
    },
  ],
  pinnedWinnerPostId: 'seed-juja-10',
  userVotedCandidateId: null,
  totalVotes: 425,
};

/**
 * Retrieves the current contest state from localStorage with fallback.
 */
export function getMemeOfTheWeekContest(): MemeOfTheWeekContest {
  if (typeof window === 'undefined') return { ...DEFAULT_MEME_OF_WEEK_CONTEST };

  try {
    const raw = localStorage.getItem(LOCAL_MEME_OF_WEEK_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_MEME_OF_WEEK_KEY, JSON.stringify(DEFAULT_MEME_OF_WEEK_CONTEST));
      return { ...DEFAULT_MEME_OF_WEEK_CONTEST };
    }
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.candidates) ? parsed : { ...DEFAULT_MEME_OF_WEEK_CONTEST };
  } catch {
    return { ...DEFAULT_MEME_OF_WEEK_CONTEST };
  }
}

/**
 * Saves contest state to localStorage and dispatches event.
 */
export function saveMemeOfTheWeekContest(contest: MemeOfTheWeekContest): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_MEME_OF_WEEK_KEY, JSON.stringify(contest));
    window.dispatchEvent(
      new CustomEvent('meme-of-week-updated', { detail: { contest } })
    );
  } catch {
    // Ignore quota errors
  }
}

/**
 * Calculates percentage distribution of votes.
 */
export function calculateMemeVotePercentages(
  candidates: MemeCandidate[]
): Record<string, number> {
  const total = candidates.reduce((sum, c) => sum + c.votesCount, 0);
  if (total === 0) {
    const equalShare = candidates.length > 0 ? Math.round(100 / candidates.length) : 0;
    const res: Record<string, number> = {};
    candidates.forEach((c) => {
      res[c.id] = equalShare;
    });
    return res;
  }

  const result: Record<string, number> = {};
  for (const c of candidates) {
    result[c.id] = Math.round((c.votesCount / total) * 100);
  }
  return result;
}

/**
 * Resolves the current winning candidate (pinned by admin or highest votes).
 */
export function getWinningMemeCandidate(
  contest: MemeOfTheWeekContest
): MemeCandidate | null {
  if (!contest || contest.candidates.length === 0) return null;

  // 1. If explicit pinned winner ID is set, locate candidate
  if (contest.pinnedWinnerPostId) {
    const pinned = contest.candidates.find(
      (c) => c.postId === contest.pinnedWinnerPostId || c.id === contest.pinnedWinnerPostId
    );
    if (pinned) return pinned;
  }

  // 2. Otherwise pick candidate with highest votes
  return [...contest.candidates].sort((a, b) => b.votesCount - a.votesCount)[0] || null;
}

/**
 * Casts a vote for a candidate meme.
 */
export function voteForMemeCandidate(
  candidateId: string
): { success: boolean; contest: MemeOfTheWeekContest; error?: string } {
  const contest = getMemeOfTheWeekContest();

  if (contest.userVotedCandidateId === candidateId) {
    return { success: false, contest, error: 'You have already voted for this meme.' };
  }

  const prevVotedId = contest.userVotedCandidateId;

  const updatedCandidates = contest.candidates.map((c) => {
    if (c.id === candidateId) {
      return { ...c, votesCount: c.votesCount + 1 };
    }
    // If switching vote from another candidate, decrement previous
    if (prevVotedId && c.id === prevVotedId) {
      return { ...c, votesCount: Math.max(0, c.votesCount - 1) };
    }
    return c;
  });

  const newTotal = updatedCandidates.reduce((sum, c) => sum + c.votesCount, 0);

  // Automatically update pinned winner to highest voted if not locked
  const highest = [...updatedCandidates].sort((a, b) => b.votesCount - a.votesCount)[0];
  const newPinned = contest.pinnedWinnerPostId || highest?.postId;

  const updatedContest: MemeOfTheWeekContest = {
    ...contest,
    candidates: updatedCandidates,
    userVotedCandidateId: candidateId,
    totalVotes: newTotal,
    pinnedWinnerPostId: newPinned,
  };

  saveMemeOfTheWeekContest(updatedContest);

  return { success: true, contest: updatedContest };
}

/**
 * Pins a specific meme as the official Meme of the Week winner.
 */
export function pinWinningMeme(
  postId: string
): { success: boolean; contest: MemeOfTheWeekContest } {
  const contest = getMemeOfTheWeekContest();
  const updatedContest: MemeOfTheWeekContest = {
    ...contest,
    pinnedWinnerPostId: postId,
  };
  saveMemeOfTheWeekContest(updatedContest);
  return { success: true, contest: updatedContest };
}
