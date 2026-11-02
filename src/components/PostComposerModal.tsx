import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Shield,
  Zap,
  Lock,
  UserCheck,
  BarChart2,
  Plus,
  Calendar,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { Profile, PostType, Post } from '../types';
import {
  compressImage,
  formatFileSize,
  uploadPostImage,
  CompressedImageResult,
} from '../lib/imageCompression';
import { createPost, validatePostInput } from '../lib/posts';
import { validatePollInput, savePollToDatabase } from '../lib/polls';
import { MemeEditorModal } from './MemeEditorModal';

interface PostComposerModalProps {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  onRequestCreatePersona: () => void;
  onRequestAuth?: () => void;
  initialPostType?: PostType;
  initialMemeResult?: { file: File; previewUrl: string; caption: string } | null;
}

export function PostComposerModal({
  isOpen,
  profile,
  onClose,
  onPostCreated,
  onRequestCreatePersona,
  onRequestAuth,
  initialPostType,
  initialMemeResult,
}: PostComposerModalProps) {
  const [postType, setPostType] = useState<PostType>(initialPostType || 'story');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [memeModalOpen, setMemeModalOpen] = useState(false);

  useEffect(() => {
    if (initialPostType && isOpen) {
      setPostType(initialPostType);
    }
  }, [initialPostType, isOpen]);

  useEffect(() => {
    if (initialMemeResult && isOpen) {
      setCompressedResult({
        file: initialMemeResult.file,
        blob: initialMemeResult.file,
        previewUrl: initialMemeResult.previewUrl,
        originalSizeBytes: initialMemeResult.file.size,
        compressedSizeBytes: initialMemeResult.file.size,
        savingsPercent: 0,
        width: 800,
        height: 800,
        mimeType: 'image/png',
      });
      setPostType('meme');
      if (initialMemeResult.caption) {
        setBody(initialMemeResult.caption);
        setTitle((prev) => prev || initialMemeResult.caption.slice(0, 80));
      }
    }
  }, [initialMemeResult, isOpen]);

  // Persona posting toggle - strictly available only if user has a persona
  const hasPersona = Boolean(profile?.persona_name && profile.persona_name.trim().length > 0);
  const [isPersona, setIsPersona] = useState<boolean>(hasPersona);

  // Image state
  const [compressing, setCompressing] = useState(false);
  const [compressedResult, setCompressedResult] = useState<CompressedImageResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle image selection and automatic client-side compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so user can re-select same file if deleted
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setCompressing(true);
    setErrorMessage(null);

    try {
      // Compress image for weak campus data bundles
      const result = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.78,
      });
      setCompressedResult(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    if (compressedResult?.previewUrl) {
      URL.revokeObjectURL(compressedResult.previewUrl);
    }
    setCompressedResult(null);
  };

  const handleAddOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not logged in, prompt authentication
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth();
      } else {
        setErrorMessage('Please sign up or log in to publish posts in Juja.');
      }
      return;
    }

    setErrorMessage(null);

    // If confession, strictly require persona setup
    if (postType === 'confession' && !hasPersona) {
      setErrorMessage('A campus persona is required to submit a confession so your identity remains protected.');
      return;
    }

    // Validate inputs
    if (postType === 'poll') {
      const pollValidation = validatePollInput({
        question: body,
        options: pollOptions,
        title,
      });
      if (!pollValidation.isValid) {
        setErrorMessage(pollValidation.error);
        return;
      }
    } else {
      const validation = validatePostInput({
        postType,
        title,
        body,
        hasImage: Boolean(compressedResult),
        eventData:
          postType === 'event'
            ? {
                event_date: eventDate,
                event_place: eventPlace,
              }
            : undefined,
      });

      if (!validation.isValid) {
        setErrorMessage(validation.error);
        return;
      }
    }

    setSubmitting(true);

    try {
      let finalImageUrl: string | null = null;

      // 1. Upload compressed image to Supabase Storage if present
      if (compressedResult) {
        setUploadProgress('Uploading compressed photo...');
        const uploadRes = await uploadPostImage(
          compressedResult.file,
          profile.id,
          `${postType}_${Date.now()}.webp`
        );

        if (uploadRes.error) {
          throw new Error(uploadRes.error);
        }

        finalImageUrl = uploadRes.publicUrl;
      }

      // 2. Insert post to database (goes live immediately, community Juja)
      setUploadProgress(
        postType === 'poll'
          ? 'Publishing poll to Juja...'
          : postType === 'confession'
          ? 'Publishing confession live...'
          : postType === 'event'
          ? 'Scheduling campus event...'
          : postType === 'mushene'
          ? 'Broadcasting street mushene...'
          : 'Publishing post to Juja...'
      );

      // Confessions are ALWAYS posted under persona
      const isPostPersona = postType === 'confession' ? true : (hasPersona ? isPersona : false);

      const createRes = await createPost({
        authorId: profile.id,
        postType,
        title: title.trim() || null,
        body: body.trim(),
        imageUrl: finalImageUrl,
        isPersona: isPostPersona,
        authorRole: profile.role,
        requiresReview: profile.role === 'guest_blogger',
        eventData:
          postType === 'event'
            ? {
                event_date: eventDate.trim(),
                event_place: eventPlace.trim(),
                rsvp_count: 0,
              }
            : undefined,
      });

      if (createRes.error) {
        throw new Error(createRes.error);
      }

      if (createRes.post) {
        let finalPost = createRes.post;

        // 3. If poll, create and attach poll questions and options
        if (postType === 'poll') {
          const pollData = await savePollToDatabase({
            postId: createRes.post.id,
            question: body.trim(),
            options: pollOptions,
          });
          finalPost = {
            ...createRes.post,
            poll_data: pollData,
          };
        }

        onPostCreated(finalPost);
        // Clean up & reset
        setTitle('');
        setBody('');
        setEventDate('');
        setEventPlace('');
        setPollOptions(['', '']);
        setCompressedResult(null);
        setUploadProgress(null);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to publish post. Please check storage & database setup.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200/80 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <h2 id="composer-modal-title" className="font-display text-base font-bold text-zinc-950">
              New Campus Post
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-900 border border-emerald-200/60">
              Juja (JKUAT)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close composer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Guest Sign-in Banner if user is not authenticated yet */}
          {!profile && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold flex items-center gap-1">
                  <span>Sign in required to publish</span>
                </p>
                <p className="text-[11px] text-amber-900">
                  You can compose your post, but must log in to share it in Juja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onRequestAuth) onRequestAuth();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] cursor-pointer shrink-0 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Post Type Selector (Story, Mushene, Event, Poll, Confession, Meme, Photo, Ask Juja) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500">
              Post Type
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setPostType('story')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'story'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Story</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('mushene')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'mushene'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-rose-50 hover:text-rose-950 hover:border-rose-300'
                }`}
              >
                <span>🗣️</span>
                <span>Mushene</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('event')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'event'
                    ? 'bg-indigo-800 text-white border-indigo-800 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-indigo-50 hover:text-indigo-950 hover:border-indigo-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Event</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('poll')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'poll'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Poll</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostType('confession');
                  if (hasPersona) setIsPersona(true);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'confession'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-purple-50 hover:text-purple-950 hover:border-purple-300'
                }`}
              >
                <span>🤫</span>
                <span>Confession</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostType('meme');
                  if (!compressedResult) {
                    setMemeModalOpen(true);
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'meme'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-amber-50 hover:text-amber-950 hover:border-amber-300'
                }`}
              >
                <span>😂</span>
                <span>Meme</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('ask_juja')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'ask_juja'
                    ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-300'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask Juja</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('photo')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  postType === 'photo'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-zinc-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>
            </div>
          </div>

          {/* Ask Juja Explainer Banner */}
          {postType === 'ask_juja' && (
            <div className="p-3.5 rounded-2xl border border-cyan-200 bg-cyan-50/70 space-y-1">
              <h4 className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                <span>❓ Ask Juja Campus Community</span>
              </h4>
              <p className="text-[11px] text-cyan-900 leading-relaxed">
                Need answers about hostel rent, CAT venues, units, WiFi, or campus survival? Ask your question and fellow students will answer in comments.
              </p>
            </div>
          )}

          {/* Meme Post Type Quick Studio Launcher Banner */}
          {postType === 'meme' && (
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😂</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>In-Browser Meme Studio</span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">
                        Sheng Badges
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Pick templates or upload photos, add bold meme text & Sheng stickers.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMemeModalOpen(true)}
                  className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{compressedResult ? 'Edit Meme' : 'Open Meme Editor'}</span>
                </button>
              </div>

              {/* Meme Preview if generated */}
              {compressedResult?.previewUrl && (
                <div className="relative aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden border border-amber-300 shadow-sm bg-black group">
                  <img
                    src={compressedResult.previewUrl}
                    alt="Active Meme Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setMemeModalOpen(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer"
                  >
                    Click to Re-edit Meme
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Persona Toggle Section - Strict for Confession, toggleable for others */}
          {postType === 'confession' ? (
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/70 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl" aria-hidden="true">
                    {hasPersona ? profile?.persona_avatar || '🎭' : '🔒'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <span>Always Posted Under Campus Persona</span>
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-200/80 px-1.5 py-0.5 rounded">
                        Strictly Anonymous
                      </span>
                    </p>
                    <p className="text-[11px] text-purple-900 leading-snug">
                      {hasPersona ? (
                        <>
                          Students see you only as{' '}
                          <strong className="text-purple-950 font-mono font-bold">
                            {profile?.persona_name}
                          </strong>
                          . Your verified student identity ({profile?.real_name}) is stored securely and accessible only to administrators.
                        </>
                      ) : (
                        'You must create a campus persona before submitting a confession.'
                      )}
                    </p>
                  </div>
                </div>

                {!hasPersona && (
                  <button
                    type="button"
                    onClick={profile ? onRequestCreatePersona : onRequestAuth}
                    className="px-2.5 py-1 text-[11px] font-semibold text-purple-900 bg-purple-100 hover:bg-purple-200 rounded-lg border border-purple-300 transition-colors cursor-pointer shrink-0"
                  >
                    {profile ? 'Create Persona' : 'Sign In'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/80 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl" aria-hidden="true">
                    {hasPersona ? (isPersona ? (profile?.persona_avatar || '🎭') : '👤') : '🔒'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <span>Post as my persona</span>
                      {!hasPersona && (
                        <span className="text-[10px] font-normal text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                          Requires Persona
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      {hasPersona ? (
                        isPersona ? (
                          <>
                            Anonymous to students as{' '}
                            <strong className="text-emerald-800 font-mono">
                              {profile?.persona_name}
                            </strong>
                            . Real name hidden.
                          </>
                        ) : (
                          <>
                            Posting publicly as{' '}
                            <strong className="text-zinc-800 font-medium">
                              {profile?.real_name}
                            </strong>{' '}
                            (verified).
                          </>
                        )
                      ) : (
                        'Toggle is only available once you set up a campus persona.'
                      )}
                    </p>
                  </div>
                </div>

                {hasPersona ? (
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isPersona}
                      onChange={(e) => setIsPersona(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle post as persona"
                    />
                    <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={profile ? onRequestCreatePersona : onRequestAuth}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200/80 transition-colors cursor-pointer shrink-0"
                  >
                    {profile ? 'Create Persona' : 'Sign In'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1">
            <label
              htmlFor="post-title"
              className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500"
            >
              Title{' '}
              {postType === 'story'
                ? '(Optional)'
                : postType === 'event'
                ? '(Required Event Title)'
                : postType === 'mushene'
                ? '(Street Topic Header)'
                : postType === 'meme'
                ? '(Meme Headline / Setup)'
                : postType === 'poll'
                ? '(Topic header)'
                : postType === 'ask_juja'
                ? '(Question Topic / Unit / Subject)'
                : postType === 'confession'
                ? '(Optional confession title)'
                : '(Optional caption)'}
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder={
                postType === 'ask_juja'
                  ? 'e.g. Best WiFi spot near Gate B? or CAT 1 venue for SMA 2101?'
                  : postType === 'meme'
                  ? 'e.g. Stepping out of Gate C'
                  : postType === 'event'
                  ? 'e.g. Juja Tech & Coding Hackathon or Hall 6 Game Night'
                  : postType === 'mushene'
                  ? 'e.g. Gate C boda drama, or Cafeteria update'
                  : postType === 'confession'
                  ? 'e.g. Hall 1 8 AM Lecture Confession or Secret at Tech Park'
                  : postType === 'poll'
                  ? 'e.g. Juja Student Food Debate'
                  : postType === 'story'
                  ? 'e.g. Hall 6 water situation or Gate A food review'
                  : 'e.g. Sunset behind the Science Complex'
              }
              className="w-full min-h-[42px] px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 placeholder:text-zinc-400"
            />
          </div>

          {/* Event-specific Date & Venue inputs */}
          {postType === 'event' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80">
              <div className="space-y-1">
                <label
                  htmlFor="event-date"
                  className="text-[11px] font-semibold tracking-wide uppercase text-indigo-950 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Date & Time (Required)</span>
                </label>
                <input
                  id="event-date"
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="e.g. Tomorrow 5 PM, or Fri 14 Nov 2 PM"
                  className="w-full min-h-[40px] px-3.5 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-800/20 focus:border-indigo-800 placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-place"
                  className="text-[11px] font-semibold tracking-wide uppercase text-indigo-950 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Place / Venue (Required)</span>
                </label>
                <input
                  id="event-place"
                  type="text"
                  value={eventPlace}
                  onChange={(e) => setEventPlace(e.target.value)}
                  placeholder="e.g. Tech Park Hall 1 or Gate A Cafe"
                  className="w-full min-h-[40px] px-3.5 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-800/20 focus:border-indigo-800 placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}

          {/* Text / Body / Question / Confession / Mushene / Meme / Event Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label
                htmlFor="post-body"
                className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500"
              >
                {postType === 'ask_juja'
                  ? 'Ask Juja Question (Required • Students will reply)'
                  : postType === 'poll'
                  ? 'Poll Question (Required)'
                  : postType === 'confession'
                  ? 'Confession (Required • Anonymous • Goes Live Instantly)'
                  : postType === 'mushene'
                  ? 'Mushene Street Story (Required • Punchy)'
                  : postType === 'event'
                  ? 'Event Description & Schedule (Required)'
                  : postType === 'meme'
                  ? 'Meme Caption / Context'
                  : postType === 'story'
                  ? 'Story Text (Required)'
                  : 'Caption / Context'}
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {body.length} /{' '}
                {postType === 'poll'
                  ? '250'
                  : postType === 'ask_juja'
                  ? '2,500'
                  : postType === 'mushene'
                  ? '1,500'
                  : postType === 'meme'
                  ? '2,000'
                  : postType === 'confession'
                  ? '5,000'
                  : postType === 'event'
                  ? '5,000'
                  : postType === 'story'
                  ? '10,000'
                  : '3,000'}
              </span>
            </div>
            <textarea
              id="post-body"
              rows={postType === 'poll' ? 2 : postType === 'ask_juja' ? 3 : postType === 'mushene' ? 4 : postType === 'confession' ? 4 : postType === 'story' ? 5 : 3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                postType === 'ask_juja'
                  ? 'Ask your question clearly with any relevant context (unit code, hostel area, budget, semester)...'
                  : postType === 'meme'
                  ? "Add an optional punchline or caption for the campus feed..."
                  : postType === 'mushene'
                  ? "What's the raw campus street juice or punchy story? Keep it punchy, vivid, and honest..."
                  : postType === 'event'
                  ? "Describe the event: agenda, who can attend, what to bring, and any entry details..."
                  : postType === 'confession'
                  ? "What is your untold campus confession? Speak your mind honestly under your persona... It will go live immediately."
                  : postType === 'poll'
                  ? 'e.g. Where is the best late-night student food spot in Juja?'
                  : postType === 'story'
                  ? "What's going down on campus? Share stories, advice, mushene, or questions..."
                  : 'Add context, location, or details about this photo...'
              }
              className="w-full p-3.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 placeholder:text-zinc-400 resize-none leading-relaxed"
            />
          </div>

          {/* Poll Options (2 to 6 options) */}
          {postType === 'poll' && (
            <div className="space-y-2.5 pt-1 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-wide uppercase text-zinc-600 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Poll Options (2 to 6 options)</span>
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  {pollOptions.length} of 6
                </span>
              </div>

              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-4 text-[11px] font-mono text-zinc-400 text-center shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1} (e.g. ${
                        idx === 0
                          ? 'Gate C Chapo & Ndengu'
                          : idx === 1
                          ? 'Gate A Smokie Pasua'
                          : idx === 2
                          ? 'Container Chips Mwitu'
                          : 'Hostel Cooker Indomie'
                      })`}
                      maxLength={100}
                      className="flex-1 min-h-[38px] px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 placeholder:text-zinc-400"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Remove option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="cursor-pointer w-full py-2 border border-dashed border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option ({pollOptions.length}/6)</span>
                </button>
              )}
            </div>
          )}

          {/* Image Upload Area with Automatic Weak-Data Compression */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-800" />
                <span>
                  {postType === 'photo' ? 'Photo (Required)' : 'Photo (Optional)'}
                </span>
              </label>
              <span className="text-[10px] font-medium text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Auto data-saver for weak bundles</span>
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {compressedResult ? (
              // Selected & compressed image card
              <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-900 group">
                <img
                  src={compressedResult.previewUrl}
                  alt="Post preview"
                  className="w-full max-h-60 object-contain mx-auto bg-black/20"
                />

                {/* Compression stats banner */}
                <div className="p-3 bg-stone-900/90 backdrop-blur-xs text-white flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Optimized: {compressedResult.savingsPercent}% Data Saved</span>
                    </div>
                    <p className="text-[10px] text-stone-300">
                      {formatFileSize(compressedResult.originalSizeBytes)} original →{' '}
                      <strong className="text-white">
                        {formatFileSize(compressedResult.compressedSizeBytes)}
                      </strong>{' '}
                      ({compressedResult.width}×{compressedResult.height}px)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Remove photo"
                    className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // Empty upload trigger button
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className={`w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  postType === 'photo'
                    ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                {compressing ? (
                  <>
                    <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
                    <p className="text-xs font-semibold text-zinc-700">
                      Compressing image for fast Juja loading...
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Resizing & reducing bundle footprint
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-800">
                        {postType === 'photo'
                          ? 'Select or snap a photo'
                          : 'Add an optional photo'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Automatic compression (WebP, &lt;200KB) for weak campus connections
                      </p>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || compressing}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress || 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {postType === 'poll'
                      ? 'Publish Poll to Juja'
                      : postType === 'confession'
                      ? 'Publish Confession Live'
                      : 'Publish to Juja'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* In-Browser Meme Studio Modal */}
      <MemeEditorModal
        isOpen={memeModalOpen}
        onClose={() => setMemeModalOpen(false)}
        onPostMeme={(imageFile, imageUrl, memeCaption) => {
          setCompressedResult({
            file: imageFile,
            blob: imageFile,
            previewUrl: imageUrl,
            originalSizeBytes: imageFile.size,
            compressedSizeBytes: imageFile.size,
            savingsPercent: 0,
            width: 800,
            height: 800,
            mimeType: 'image/png',
          });
          setPostType('meme');
          if (memeCaption) {
            setBody(memeCaption);
            if (!title) {
              setTitle(memeCaption.slice(0, 80));
            }
          }
          setMemeModalOpen(false);
        }}
      />
    </div>
  );
}
