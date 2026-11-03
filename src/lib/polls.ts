/**
 * Poll creation, voting, percentage calculation, and pinning service for Laodicean.
 * Supports 2-6 options, single-vote enforcement, live percentage bars,
 * and admin "Poll of the Week" pinning.
 */

import { supabase } from './supabase';
import { PollOptionResult, PollWithResults } from '../types';
import { containsBannedWords } from './bannedWords';

export const PINNED_POLL_KEY = 'laodicean_pinned_poll_id';
export const VOTED_POLLS_KEY = 'laodicean_voted_polls';
export const LOCAL_POLLS_STORE_KEY = 'laodicean_local_polls';

export const DEFAULT_PINNED_POLL_ID = 'seed-juja-3';

export interface PollValidationResult {
  isValid: boolean;
  error: string | null;
  warning?: string | null;
}

/**
 * Pure heuristic: Detects whether a poll question or option appears to name or target real individuals
 * (e.g. students, lecturers, faculty members), violating Juja Rule #3.
 */
export function detectRealPersonInPoll(
  question: string,
  options: string[] = []
): { detected: boolean; reason?: string } {
  const combined = [question, ...options].join(' ').toLowerCase();

  // 1. Direct targeted phrasing patterns
  const targetedPhrases = [
    'who is the prettiest',
    'who is the ugliest',
    'who is the most toxic',
    'who is the worst lecturer',
    'who is the best lecturer',
    'who is the worst prof',
    'who is the best prof',
    'vote out lecturer',
    'who has the worst attitude',
    'who is dating who',
    'who cheated on',
    'which student is',
    'expose lecturer',
    'expose student',
  ];

  for (const phrase of targetedPhrases) {
    if (combined.includes(phrase)) {
      return {
        detected: true,
        reason: `Poll appears to target or rank individual people ("${phrase}"). Juja Rule #3 strictly prohibits polls about individuals.`,
      };
    }
  }

  // 2. Titles followed by names
  const titleRegex = /\b(prof|professor|dr|doctor|lecturer|mr|mrs|miss)\b\.?\s+[a-z]{3,}/i;
  if (titleRegex.test(question)) {
    return {
      detected: true,
      reason: 'Poll question refers to a specific faculty member or individual by title/name. Please keep polls focused on units, spots, or topics.',
    };
  }

  for (const opt of options) {
    if (titleRegex.test(opt)) {
      return {
        detected: true,
        reason: `Poll option "${opt}" names a specific individual. Juja Rule #3 prohibits naming individuals in poll options.`,
      };
    }
  }

  return { detected: false };
}

/**
 * Pure function to calculate integer percentages that display cleanly as bars.
 */
export function calculatePollPercentages(
  options: { id: string; votes_count: number }[]
): { [optionId: string]: number } {
  const result: { [optionId: string]: number } = {};
  if (!options || options.length === 0) return result;

  const total = options.reduce((sum, opt) => sum + (opt.votes_count || 0), 0);

  if (total <= 0) {
    options.forEach((opt) => {
      result[opt.id] = 0;
    });
    return result;
  }

  options.forEach((opt) => {
    const raw = ((opt.votes_count || 0) / total) * 100;
    result[opt.id] = Math.round(raw);
  });

  return result;
}

/**
 * Pure validator for Poll creation:
 * - Question: 5-250 characters
 * - Options: 2 to 6 non-empty options
 * - No duplicate options
 */
export function validatePollInput(params: {
  question: string;
  options: string[];
  title?: string | null;
  confirmNoRealPeople?: boolean;
}): PollValidationResult {
  const trimmedQuestion = (params.question || '').trim();

  if (!trimmedQuestion) {
    return {
      isValid: false,
      error: 'Please enter a poll question for the campus.',
    };
  }

  if (trimmedQuestion.length < 5) {
    return {
      isValid: false,
      error: 'Poll question must be at least 5 characters.',
    };
  }

  if (trimmedQuestion.length > 250) {
    return {
      isValid: false,
      error: 'Poll question must be 250 characters or less.',
    };
  }

  // Filter non-empty options
  const cleanOptions = (params.options || []).map((o) => (o || '').trim()).filter(Boolean);

  if (cleanOptions.length < 2) {
    return {
      isValid: false,
      error: 'A poll must have at least 2 options.',
    };
  }

  if (cleanOptions.length > 6) {
    return {
      isValid: false,
      error: 'A poll cannot have more than 6 options.',
    };
  }

  for (const opt of cleanOptions) {
    if (opt.length > 100) {
      return {
        isValid: false,
        error: `Option "${opt.slice(0, 20)}..." exceeds 100 characters.`,
      };
    }
  }

  // Check for duplicates
  const seen = new Set<string>();
  for (const opt of cleanOptions) {
    const lower = opt.toLowerCase();
    if (seen.has(lower)) {
      return {
        isValid: false,
        error: `Duplicate option found: "${opt}". Each option must be distinct.`,
      };
    }
    seen.add(lower);
  }

  // Check for banned words in question or options
  const questionBanned = containsBannedWords(trimmedQuestion);
  if (questionBanned.hasBannedWord) {
    return {
      isValid: false,
      error: `Poll question contains prohibited word "${questionBanned.matchedWord}". Please follow Juja community rules.`,
    };
  }

  for (const opt of cleanOptions) {
    const optBanned = containsBannedWords(opt);
    if (optBanned.hasBannedWord) {
      return {
        isValid: false,
        error: `Poll option "${opt}" contains prohibited word "${optBanned.matchedWord}". Please follow Juja community rules.`,
      };
    }
  }

  // Rule #3 Check: Naming real people
  const realPersonCheck = detectRealPersonInPoll(trimmedQuestion, cleanOptions);
  if (realPersonCheck.detected) {
    return {
      isValid: false,
      error: realPersonCheck.reason || 'Poll violates Rule #3: Polls cannot name, rank, or target individual people.',
    };
  }

  // If confirmNoRealPeople is explicitly provided and false, reject
  if (params.confirmNoRealPeople === false) {
    return {
      isValid: false,
      error: 'You must confirm that this poll does not name or target real individuals (Juja Rule #3).',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Pure function to record a vote on a poll, updating counts and percentage bars.
 * Enforces one vote per user per poll.
 */
export function recordLocalPollVote(
  poll: PollWithResults,
  optionId: string,
  userId: string
): { success: boolean; poll: PollWithResults; error?: string } {
  if (poll.user_voted_option_id) {
    return {
      success: false,
      poll,
      error: 'You have already voted on this poll.',
    };
  }

  const optionExists = poll.options.some((o) => o.id === optionId);
  if (!optionExists) {
    return {
      success: false,
      poll,
      error: 'Invalid poll option selected.',
    };
  }

  const updatedRawOptions = poll.options.map((opt) => ({
    ...opt,
    votes_count: opt.id === optionId ? opt.votes_count + 1 : opt.votes_count,
  }));

  const totalVotes = updatedRawOptions.reduce((sum, o) => sum + o.votes_count, 0);
  const percentages = calculatePollPercentages(updatedRawOptions);

  const updatedOptions: PollOptionResult[] = updatedRawOptions.map((opt) => ({
    ...opt,
    percentage: percentages[opt.id] ?? 0,
  }));

  const updatedPoll: PollWithResults = {
    ...poll,
    options: updatedOptions,
    total_votes: totalVotes,
    user_voted_option_id: optionId,
  };

  return {
    success: true,
    poll: updatedPoll,
  };
}

/**
 * Flagship seed poll for the Juja Campus food debate (seed-juja-3).
 */
export const SEED_JUJA_POLL_DATA: PollWithResults = {
  id: 'poll-seed-juja-3',
  post_id: 'seed-juja-3',
  question: 'Where is the best late-night student food spot in Juja?',
  options: [
    {
      id: 'opt-gate-c-chapo',
      poll_id: 'poll-seed-juja-3',
      option_text: 'Gate C Mama Chapo & Ndengu (Budget King 👑)',
      position: 0,
      votes_count: 188,
      percentage: 44,
    },
    {
      id: 'opt-gate-a-smokie',
      poll_id: 'poll-seed-juja-3',
      option_text: 'Gate A Smokie Pasua & Kuku Choma',
      position: 1,
      votes_count: 142,
      percentage: 33,
    },
    {
      id: 'opt-container-chips',
      poll_id: 'poll-seed-juja-3',
      option_text: 'Container Chips Mwitu & Ketchup',
      position: 2,
      votes_count: 64,
      percentage: 15,
    },
    {
      id: 'opt-hostel-indomie',
      poll_id: 'poll-seed-juja-3',
      option_text: 'Hostel Cooker Indomie Survival',
      position: 3,
      votes_count: 35,
      percentage: 8,
    },
  ],
  total_votes: 429,
  user_voted_option_id: null,
};

/**
 * In-memory / localStorage cache for polls so votes persist across browser reloads.
 */
function getLocalPollStore(): { [postId: string]: PollWithResults } {
  if (typeof window === 'undefined') return { 'seed-juja-3': SEED_JUJA_POLL_DATA };
  try {
    const raw = localStorage.getItem(LOCAL_POLLS_STORE_KEY);
    if (!raw) {
      return { 'seed-juja-3': SEED_JUJA_POLL_DATA };
    }
    const parsed = JSON.parse(raw);
    if (!parsed['seed-juja-3']) {
      parsed['seed-juja-3'] = SEED_JUJA_POLL_DATA;
    }
    return parsed;
  } catch {
    return { 'seed-juja-3': SEED_JUJA_POLL_DATA };
  }
}

function saveLocalPollStore(store: { [postId: string]: PollWithResults }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_POLLS_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Retrieves the currently pinned "Poll of the Week" post ID.
 * Defaults to 'seed-juja-3' if none set.
 */
export function getPinnedPollId(): string | null {
  if (typeof window === 'undefined') return DEFAULT_PINNED_POLL_ID;
  try {
    const stored = localStorage.getItem(PINNED_POLL_KEY);
    if (stored !== null) {
      return stored === '' ? null : stored;
    }
    return DEFAULT_PINNED_POLL_ID;
  } catch {
    return DEFAULT_PINNED_POLL_ID;
  }
}

/**
 * Admin action to pin or unpin a poll as "Poll of the Week".
 */
export function setPinnedPollId(postId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (postId) {
      localStorage.setItem(PINNED_POLL_KEY, postId);
    } else {
      localStorage.setItem(PINNED_POLL_KEY, '');
    }
    // Dispatch custom event so all feed listeners update immediately
    window.dispatchEvent(new CustomEvent('pinned-poll-change', { detail: { postId } }));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Checks if a specific post is the pinned Poll of the Week.
 */
export function isPollPinned(postId: string): boolean {
  if (!postId) return false;
  return getPinnedPollId() === postId;
}

/**
 * Helper to check if a user has voted on a poll in localStorage.
 */
export function getUserVotedOptionLocal(pollId: string, userId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VOTED_POLLS_KEY);
    if (!raw) return null;
    const votes = JSON.parse(raw);
    const key = userId ? `${pollId}_${userId}` : pollId;
    return votes[key] || null;
  } catch {
    return null;
  }
}

/**
 * Returns a stable guest campus device ID so visitors can vote once even without signing up.
 */
export function getOrCreateGuestDeviceId(): string {
  if (typeof window === 'undefined') return 'guest-device-ssr';
  try {
    const key = 'laodicean_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'device_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'guest-device';
  }
}

/**
 * Helper to record a vote in localStorage.
 */
export function saveUserVotedOptionLocal(pollId: string, optionId: string, userId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(VOTED_POLLS_KEY);
    const votes = raw ? JSON.parse(raw) : {};
    const key = userId ? `${pollId}_${userId}` : pollId;
    votes[key] = optionId;
    localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(votes));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetches poll data (question, options, live vote counts, and user vote status)
 * for a specific post. Supports Supabase and local cache fallback.
 */
export async function getPollDataForPost(
  postId: string,
  userId?: string | null
): Promise<PollWithResults | null> {
  if (!postId) return null;

  // Check local store first (especially for seed or offline posts)
  const store = getLocalPollStore();
  const localPoll = store[postId];

  // Seed posts use human-friendly IDs, skip remote Supabase UUID query
  if (postId.startsWith('seed-')) {
    if (localPoll) {
      const userVote = getUserVotedOptionLocal(localPoll.id, userId);
      return {
        ...localPoll,
        user_voted_option_id: userVote || localPoll.user_voted_option_id,
      };
    }
    return null;
  }

  if (supabase) {
    try {
      // 1. Fetch poll header
      const { data: pollRow, error: pollError } = await supabase
        .from('polls')
        .select('id, post_id, question, created_at')
        .eq('post_id', postId)
        .maybeSingle();

      if (!pollError && pollRow) {
        // 2. Fetch options
        const { data: optionsData, error: optError } = await supabase
          .from('poll_options')
          .select('id, poll_id, option_text, position')
          .eq('poll_id', pollRow.id)
          .order('position', { ascending: true });

        if (!optError && Array.isArray(optionsData)) {
          // 3. Fetch votes count per option
          const { data: votesData } = await supabase
            .from('poll_votes')
            .select('option_id, user_id')
            .eq('poll_id', pollRow.id);

          const votesCountMap: { [optId: string]: number } = {};
          let userVotedOptionId: string | null = null;

          if (Array.isArray(votesData)) {
            votesData.forEach((v) => {
              votesCountMap[v.option_id] = (votesCountMap[v.option_id] || 0) + 1;
              if (userId && v.user_id === userId) {
                userVotedOptionId = v.option_id;
              }
            });
          }

          // Fallback to local storage for user voted option if not found in db query
          if (!userVotedOptionId) {
            userVotedOptionId = getUserVotedOptionLocal(pollRow.id, userId);
          }

          const rawOptions = optionsData.map((opt) => ({
            id: opt.id,
            poll_id: opt.poll_id,
            option_text: opt.option_text,
            position: opt.position,
            votes_count: votesCountMap[opt.id] || 0,
          }));

          const percentages = calculatePollPercentages(rawOptions);
          const totalVotes = rawOptions.reduce((s, o) => s + o.votes_count, 0);

          const result: PollWithResults = {
            id: pollRow.id,
            post_id: pollRow.post_id,
            question: pollRow.question,
            options: rawOptions.map((o) => ({
              ...o,
              percentage: percentages[o.id] ?? 0,
            })),
            total_votes: totalVotes,
            user_voted_option_id: userVotedOptionId,
          };

          return result;
        }
      }
    } catch {
      // Fall through to local poll data
    }
  }

  if (localPoll) {
    const userVote = getUserVotedOptionLocal(localPoll.id, userId);
    return {
      ...localPoll,
      user_voted_option_id: userVote || localPoll.user_voted_option_id,
    };
  }

  return null;
}

/**
 * Casts a vote on a poll option.
 * Prevents multiple votes per user.
 */
export async function submitVote(params: {
  poll: PollWithResults;
  optionId: string;
  userId: string;
}): Promise<{ success: boolean; poll: PollWithResults; error?: string }> {
  const { poll, optionId, userId } = params;

  // 1. Check if user already voted locally
  const alreadyVoted = getUserVotedOptionLocal(poll.id, userId);
  if (alreadyVoted || poll.user_voted_option_id) {
    return {
      success: false,
      poll,
      error: 'You have already voted on this poll.',
    };
  }

  // 2. Pure calculation of updated poll results
  const recorded = recordLocalPollVote(poll, optionId, userId);
  if (!recorded.success) {
    return recorded;
  }

  // 3. Persist locally immediately for instant UX
  saveUserVotedOptionLocal(poll.id, optionId, userId);
  const store = getLocalPollStore();
  store[poll.post_id] = recorded.poll;
  saveLocalPollStore(store);

  // 4. If Supabase is active and IDs are real UUIDs, persist to poll_votes
  if (supabase && !poll.post_id.startsWith('seed-') && !poll.id.startsWith('poll-seed-')) {
    try {
      await supabase.from('poll_votes').insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: userId,
      });
    } catch {
      // In-memory / local storage already updated
    }
  }

  return {
    success: true,
    poll: recorded.poll,
  };
}

/**
 * Creates a poll alongside a post.
 * Writes to Supabase tables or local cache.
 */
export async function savePollToDatabase(params: {
  postId: string;
  question: string;
  options: string[];
}): Promise<PollWithResults> {
  const { postId, question, options } = params;
  const pollId = `poll-${postId}`;

  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

  const initialOptions: PollOptionResult[] = cleanOptions.map((optText, index) => ({
    id: `opt-${postId}-${index}`,
    poll_id: pollId,
    option_text: optText,
    position: index,
    votes_count: 0,
    percentage: 0,
  }));

  const newPoll: PollWithResults = {
    id: pollId,
    post_id: postId,
    question: question.trim(),
    options: initialOptions,
    total_votes: 0,
    user_voted_option_id: null,
  };

  // Save to local cache
  const store = getLocalPollStore();
  store[postId] = newPoll;
  saveLocalPollStore(store);

  // If Supabase is active, persist to database
  if (supabase) {
    try {
      const { data: pollRow, error: pollErr } = await supabase
        .from('polls')
        .insert({
          post_id: postId,
          question: question.trim(),
        })
        .select()
        .single();

      if (!pollErr && pollRow) {
        const optionRows = cleanOptions.map((text, idx) => ({
          poll_id: pollRow.id,
          option_text: text,
          position: idx,
        }));

        const { data: createdOptions } = await supabase
          .from('poll_options')
          .insert(optionRows)
          .select();

        if (Array.isArray(createdOptions) && createdOptions.length > 0) {
          const dbPoll: PollWithResults = {
            id: pollRow.id,
            post_id: postId,
            question: pollRow.question,
            options: createdOptions.map((o) => ({
              id: o.id,
              poll_id: o.poll_id,
              option_text: o.option_text,
              position: o.position,
              votes_count: 0,
              percentage: 0,
            })),
            total_votes: 0,
            user_voted_option_id: null,
          };
          store[postId] = dbPoll;
          saveLocalPollStore(store);
          return dbPoll;
        }
      }
    } catch {
      // Retain newPoll
    }
  }

  return newPoll;
}
