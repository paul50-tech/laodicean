/**
 * Banned Words & Keyword Moderation Service for Laodicean.
 * Allows campus administrators to manage a restricted word list.
 * Automatically checks posts, comments, polls, and moments before submission.
 */

export const BANNED_WORDS_STORAGE_KEY = 'laodicean_banned_words_store';

export const DEFAULT_BANNED_WORDS: string[] = [
  'doxx',
  'leak nudes',
  'exam leak',
  'cat leak',
  'fake marks',
  'pay for grades',
  'hire hacker',
  'bitcoin scam',
  'forex signals',
  'free airtime scam',
  'tribal war',
  'hate speech',
  'nigger',
  'faggot',
  'malaya',
  'kihii',
];

/**
 * Returns default banned words list.
 */
export function getDefaultBannedWords(): string[] {
  return [...DEFAULT_BANNED_WORDS];
}

/**
 * Retrieves the currently active banned words list from localStorage.
 */
export function getBannedWords(): string[] {
  if (typeof window === 'undefined') return DEFAULT_BANNED_WORDS;
  try {
    const raw = localStorage.getItem(BANNED_WORDS_STORAGE_KEY);
    if (!raw) return DEFAULT_BANNED_WORDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BANNED_WORDS;
  } catch {
    return DEFAULT_BANNED_WORDS;
  }
}

/**
 * Persists banned words list to localStorage.
 */
export function saveBannedWords(words: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanList = Array.from(
      new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean))
    );
    localStorage.setItem(BANNED_WORDS_STORAGE_KEY, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent('banned-words-updated', { detail: { words: cleanList } }));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Adds a new word or phrase to the banned list.
 */
export function addBannedWord(newWord: string): {
  success: boolean;
  error?: string;
  words: string[];
} {
  const trimmed = (newWord || '').trim().toLowerCase();
  if (!trimmed) {
    return { success: false, error: 'Word or phrase cannot be empty.', words: getBannedWords() };
  }
  if (trimmed.length < 2) {
    return { success: false, error: 'Word must be at least 2 characters.', words: getBannedWords() };
  }
  if (trimmed.length > 60) {
    return { success: false, error: 'Word or phrase must be 60 characters or less.', words: getBannedWords() };
  }

  const current = getBannedWords();
  if (current.includes(trimmed)) {
    return { success: false, error: `"${trimmed}" is already on the banned list.`, words: current };
  }

  const updated = [...current, trimmed];
  saveBannedWords(updated);
  return { success: true, words: updated };
}

/**
 * Removes a word or phrase from the banned list.
 */
export function removeBannedWord(wordToRemove: string): {
  success: boolean;
  words: string[];
} {
  const trimmed = (wordToRemove || '').trim().toLowerCase();
  const current = getBannedWords();
  const updated = current.filter((w) => w !== trimmed);
  saveBannedWords(updated);
  return { success: true, words: updated };
}

/**
 * Resets banned words to system defaults.
 */
export function resetBannedWords(): string[] {
  const defaults = getDefaultBannedWords();
  saveBannedWords(defaults);
  return defaults;
}

/**
 * Pure function: Checks whether text contains any banned words or phrases.
 * Returns match status and the offending keyword.
 */
export function containsBannedWords(
  text: string,
  wordList: string[] = getBannedWords()
): { hasBannedWord: boolean; matchedWord?: string } {
  if (!text || !wordList || wordList.length === 0) {
    return { hasBannedWord: false };
  }

  const normalized = text.toLowerCase();

  for (const banned of wordList) {
    const cleanBanned = banned.trim().toLowerCase();
    if (!cleanBanned) continue;

    // Check multi-word phrase or word substring with boundaries where applicable
    if (cleanBanned.includes(' ')) {
      if (normalized.includes(cleanBanned)) {
        return { hasBannedWord: true, matchedWord: cleanBanned };
      }
    } else {
      // Escape special regex chars
      const escaped = cleanBanned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match whole word or exact pattern
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(normalized)) {
        return { hasBannedWord: true, matchedWord: cleanBanned };
      }
    }
  }

  return { hasBannedWord: false };
}
