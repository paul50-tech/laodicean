import React, { useState } from 'react';
import { CommentWithAuthor, Profile } from '../types';
import { postComment } from '../lib/comments';
import { checkRateLimit, recordActionTimestamp } from '../lib/rateLimit';
import { toggleCommentStatus } from '../lib/moderation';
import {
  CornerDownRight,
  Send,
  Loader2,
  Clock,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Flag,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ProfileBadgeTag } from './ProfileBadgeTag';

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUserProfile?: Profile | null;
  onRequireAuth: (message: string) => void;
  onReplyAdded: (newReply: CommentWithAuthor) => void;
  onReportComment?: (comment: CommentWithAuthor) => void;
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserProfile,
  onRequireAuth,
  onReplyAdded,
  onReportComment,
  depth = 0,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [postAsPersona, setPostAsPersona] = useState(
    Boolean(currentUserProfile?.persona_name)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = currentUserProfile?.role === 'admin';

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const handleOpenReply = () => {
    if (!currentUserProfile) {
      onRequireAuth('Sign in to reply to this campus discussion!');
      return;
    }
    setIsReplying(true);
    setError(null);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;

    if (!replyBody.trim()) {
      setError('Please enter your reply text.');
      return;
    }

    // Rate limit check against spam
    const rateCheck = checkRateLimit('comment', currentUserProfile.id);
    if (!rateCheck.allowed) {
      setError(rateCheck.message);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await postComment({
        postId: comment.post_id,
        authorId: currentUserProfile.id,
        body: replyBody.trim(),
        isPersona: postAsPersona,
        parentId: comment.id,
        profile: currentUserProfile,
      });

      if (res.error || !res.comment) {
        setError(res.error || 'Failed to post reply.');
        return;
      }

      recordActionTimestamp('comment', currentUserProfile.id);

      onReplyAdded(res.comment);
      setReplyBody('');
      setIsReplying(false);
    } catch {
      setError('Network error while posting reply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`space-y-2 text-xs ${depth > 0 ? 'mt-2.5' : 'mt-3'}`}>
      <div className="bg-stone-50/70 border border-stone-200/70 rounded-xl p-3 space-y-2">
        {/* Author Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-xs shrink-0 shadow-2xs">
              {comment.is_persona ? comment.persona_avatar || '🎭' : '👤'}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {comment.is_persona ? (
                <>
                  <span className="font-mono text-[11px] font-bold text-zinc-900 truncate">
                    {comment.persona_name}
                  </span>
                  <span className="text-[9px] font-medium text-purple-700 bg-purple-100/70 px-1 py-0.2 rounded border border-purple-200/60">
                    Persona
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold text-zinc-900 truncate">
                    {comment.author_real_name || 'Campus Student'}
                  </span>
                  <span className="text-[9px] font-medium text-emerald-800 bg-emerald-100/70 px-1 py-0.2 rounded border border-emerald-200/60 flex items-center gap-0.5">
                    <UserCheck className="w-2.5 h-2.5 text-emerald-700" />
                    <span>Real Name</span>
                  </span>
                </>
              )}

              {/* Profile Badges */}
              <ProfileBadgeTag
                badges={comment.badges}
                authorName={comment.author_real_name}
                personaName={comment.persona_name}
              />

              {/* Admin unmask tag if viewer is admin/author */}
              {comment.is_persona && comment.author_real_name && (
                <span
                  title={`Admin View: Real identity is ${comment.author_real_name}`}
                  className="text-[9px] font-mono text-amber-900 bg-amber-50 px-1 rounded flex items-center gap-0.5"
                >
                  <ShieldAlert className="w-2.5 h-2.5 text-amber-700" />
                  <span>Admin: {comment.author_real_name}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-zinc-400 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            <span>{formatRelativeTime(comment.created_at)}</span>
          </div>
        </div>

        {/* Comment Body or Auto-Hidden Placeholder */}
        {comment.is_hidden ? (
          isAdmin ? (
            <div className="space-y-2">
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Hidden Pending Review (Reports threshold reached)</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleCommentStatus(comment.id, 'live')}
                  className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800 cursor-pointer"
                >
                  Restore
                </button>
              </div>
              <p className="text-zinc-700 line-through text-xs italic pl-0.5">
                {comment.body}
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950 space-y-0.5">
              <p className="font-bold text-[11px] flex items-center gap-1 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Comment Hidden Pending Moderation</span>
              </p>
              <p className="text-[10px] text-amber-800 leading-relaxed">
                This comment reached the community report threshold and has been auto-hidden pending admin review.
              </p>
            </div>
          )
        ) : (
          <p className="text-zinc-800 leading-relaxed whitespace-pre-line text-xs pl-0.5">
            {comment.body}
          </p>
        )}

        {/* Action bar: Reply and Report buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 text-[11px]">
          <button
            type="button"
            onClick={handleOpenReply}
            className="cursor-pointer inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <CornerDownRight className="w-3 h-3 text-emerald-700" />
            <span>Reply</span>
          </button>

          {!comment.is_hidden && onReportComment && (
            <button
              type="button"
              onClick={() => onReportComment(comment)}
              className="cursor-pointer inline-flex items-center gap-1 text-[10px] text-stone-400 hover:text-rose-600 transition-colors"
              title="Report this comment to moderators"
            >
              <Flag className="w-2.5 h-2.5" />
              <span>Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Reply Composer */}
      {isReplying && (
        <form
          onSubmit={handleSubmitReply}
          className="ml-3 sm:ml-5 p-3 bg-white border border-emerald-200 rounded-xl space-y-2 shadow-xs"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-700 flex items-center gap-1">
              <CornerDownRight className="w-3 h-3 text-emerald-700" />
              <span>
                Replying to{' '}
                {comment.is_persona ? comment.persona_name : comment.author_real_name || 'student'}
              </span>
            </span>

            {/* Persona toggle for replies */}
            {currentUserProfile?.persona_name ? (
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-zinc-600 font-medium">
                <input
                  type="checkbox"
                  checked={postAsPersona}
                  onChange={(e) => setPostAsPersona(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 h-3.5 w-3.5"
                />
                <span className="text-[10px]">
                  Reply as {currentUserProfile.persona_name}
                </span>
              </label>
            ) : (
              <span className="text-[10px] text-zinc-400">Replying with Real Name</span>
            )}
          </div>

          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Type your reply here..."
            rows={2}
            className="w-full text-xs p-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
          />

          {error && <p className="text-[11px] text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReplyBody('');
              }}
              className="cursor-pointer px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !replyBody.trim()}
              className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>Post Reply</span>
            </button>
          </div>
        </form>
      )}

      {/* Threaded nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-3 sm:pl-4 border-l-2 border-emerald-800/20 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserProfile={currentUserProfile}
              onRequireAuth={onRequireAuth}
              onReplyAdded={onReplyAdded}
              onReportComment={onReportComment}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
