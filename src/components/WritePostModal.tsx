import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { JUJA_SPOTS } from '../data/seedData';
import { validatePostDraft } from '../lib/feedLogic';
import { compressAndUploadImage } from '../lib/imageCompressor';
import { CampusUser, PostDraftInput, PostType } from '../types/laodicean';

interface WritePostModalProps {
  isOpen: boolean;
  currentUser: CampusUser | null;
  onClose: () => void;
  onPublish: (draft: PostDraftInput, author: CampusUser) => Promise<void>;
}

const POST_TYPE_OPTIONS: { type: PostType; label: string; hint: string }[] = [
  { type: PostType.Story, label: 'Story', hint: 'Longer campus blog, guide, or essay' },
  { type: PostType.Gist, label: 'Quick Gist', hint: 'Fast update, tip, or overheard moment' },
  { type: PostType.Photo, label: 'Photo', hint: 'Compressed photo with caption' },
  { type: PostType.Notice, label: 'Notice', hint: 'Housing, lost & found, or meetup' },
];

/**
 * Accessible post composer modal / mobile bottom sheet.
 * Compresses images client-side so posts stay fast on weak campus mobile data.
 */
export const WritePostModal: React.FC<WritePostModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onPublish,
}) => {
  const [postType, setPostType] = useState<PostType>(PostType.Story);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [spot, setSpot] = useState('Gate C');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageKb, setImageKb] = useState<number | undefined>(undefined);
  const [compressing, setCompressing] = useState(false);

  // Quick author fields when visitor hasn't signed in yet
  const [authorName, setAuthorName] = useState(currentUser?.name ?? '');
  const [authorHandle, setAuthorHandle] = useState(currentUser?.handle ?? '');
  const [authorCourse, setAuthorCourse] = useState(currentUser?.course ?? '');

  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const compressed = await compressAndUploadImage(file);
      setImageUrl(compressed.imageUrl);
      setImageKb(compressed.sizeKb);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not compress image. Try another file.'
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const draft: PostDraftInput = {
      communitySlug: 'juja',
      postType,
      title,
      body,
      spot,
      imageUrl,
      imageAlt: title.trim() || body.trim().slice(0, 72),
      imageKb,
    };

    const validationError = validatePostDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    let resolvedUser = currentUser;
    if (!resolvedUser) {
      if (authorName.trim().length < 2) {
        setError('Please enter your display name before publishing.');
        return;
      }
      const cleanHandle =
        authorHandle.trim().replace(/^@/, '') ||
        authorName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .slice(0, 16) ||
        'juja_writer';

      resolvedUser = {
        id: `u-${Date.now()}`,
        name: authorName.trim(),
        handle: `@${cleanHandle}`,
        course: authorCourse.trim() || 'JKUAT · Juja',
        email: '',
      };
    }

    setPublishing(true);
    try {
      await onPublish(draft, resolvedUser);
      setTitle('');
      setBody('');
      setImageUrl(undefined);
      setImageKb(undefined);
      onClose();
    } finally {
      setPublishing(false);
    }
  };

  const selectedOption = POST_TYPE_OPTIONS.find((o) => o.type === postType)!;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-post-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#FAF9F6] rounded-t-3xl sm:rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-3.5">
          <div>
            <h2
              id="write-post-title"
              className="font-display text-xl font-bold text-zinc-950"
            >
              Publish to c/juja
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{selectedOption.hint}</p>
          </div>
          <button
            type="button"
            aria-label="Close post composer"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg inline-flex items-center justify-center text-zinc-600 hover:bg-stone-200/70 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interactive post-type selector */}
          <div>
            <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Post format
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-stone-200/70 rounded-xl">
              {POST_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setPostType(option.type);
                    setError(null);
                  }}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    postType === option.type
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {!currentUser && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="composer-author-name"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Your Name
                </label>
                <input
                  id="composer-author-name"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Kevin Njoroge"
                  className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
              <div>
                <label
                  htmlFor="composer-author-handle"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Handle
                </label>
                <input
                  id="composer-author-handle"
                  type="text"
                  value={authorHandle}
                  onChange={(e) => setAuthorHandle(e.target.value)}
                  placeholder="@kevo_ee"
                  className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
              <div>
                <label
                  htmlFor="composer-author-course"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Course / Year (optional)
                </label>
                <input
                  id="composer-author-course"
                  type="text"
                  value={authorCourse}
                  onChange={(e) => setAuthorCourse(e.target.value)}
                  placeholder="Civil Eng · Yr 2"
                  className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
            </div>
          )}

          {/* Spot picker */}
          <div>
            <label
              htmlFor="composer-spot"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              Campus or Juja spot
            </label>
            <select
              id="composer-spot"
              value={spot}
              onChange={(e) => setSpot(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
            >
              {JUJA_SPOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Campus">General Campus</option>
            </select>
          </div>

          {/* Headline field (required for Story & Notice, optional for Photo) */}
          {postType !== PostType.Gist && (
            <div>
              <label
                htmlFor="composer-title"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                {postType === PostType.Photo ? 'Headline (optional)' : 'Headline'}
              </label>
              <input
                id="composer-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  postType === PostType.Notice
                    ? 'e.g. Lost Student ID near Hall 6 walkway'
                    : 'e.g. Surviving 8 AM Labs at Engineering Complex'
                }
                className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
              />
            </div>
          )}

          {/* Body field */}
          <div>
            <label
              htmlFor="composer-body"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              {postType === PostType.Story
                ? 'Your story'
                : postType === PostType.Photo
                  ? 'Photo caption & context'
                  : 'What is happening in Juja?'}
            </label>
            <textarea
              id="composer-body"
              rows={postType === PostType.Story ? 6 : 4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                postType === PostType.Gist
                  ? 'Drop a quick tip, campus update, or thought...'
                  : 'Write naturally like you are telling a friend after class...'
              }
              className="w-full p-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 leading-relaxed focus:outline-none focus:border-emerald-800"
            />
          </div>

          {/* Compressed photo uploader */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="composer-photo-input"
                className="text-xs font-medium text-zinc-700"
              >
                {postType === PostType.Photo
                  ? 'Upload photo (auto-compressed for weak data)'
                  : 'Attach photo (optional, auto-compressed)'}
              </label>
              {imageKb && (
                <span className="text-xs font-mono tabular-nums text-emerald-800">
                  Compressed to ~{imageKb} KB
                </span>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                <img
                  src={imageUrl}
                  alt="Upload preview"
                  className="w-full max-h-52 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(undefined);
                    setImageKb(undefined);
                  }}
                  className="absolute top-2 right-2 min-h-[36px] px-3 rounded-lg bg-zinc-900/85 text-white text-xs font-medium cursor-pointer"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <label
                htmlFor="composer-photo-input"
                className="min-h-[48px] px-4 py-3 rounded-xl border border-dashed border-stone-300 hover:border-emerald-700 bg-white flex items-center justify-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer transition-colors"
              >
                <ImagePlus className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                <span>
                  {compressing
                    ? 'Compressing photo for fast loading…'
                    : 'Choose photo from phone or laptop'}
                </span>
                <input
                  id="composer-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishing || compressing}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {publishing ? 'Publishing…' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
