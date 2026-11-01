import React, { useState, useEffect, useCallback } from 'react';
import { CommentWithAuthor, Profile } from '../types';
import {
  fetchComments,
  postComment,
  countAllComments,
  buildCommentTree,
} from '../lib/comments';
import { CommentItem } from './CommentItem';
import {
  MessageCircle,
  Send,
  Loader2,
  Lock,
  User,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface CommentsSectionProps {
  postId: string;
  currentUserProfile?: Profile | null;
  onRequireAuth: (message: string) => void;
  onCommentCountChange?: (count: number) => void;
  onReportComment?: (comment: CommentWithAuthor) => void;
}

export function CommentsSection({
  postId,
  currentUserProfile,
  onRequireAuth,
  onCommentCountChange,
  onReportComment,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [postAsPersona, setPostAsPersona] = useState(
    Boolean(currentUserProfile?.persona_name)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync persona toggle when user profile changes
  useEffect(() => {
    if (currentUserProfile?.persona_name) {
      setPostAsPersona(true);
    }
  }, [currentUserProfile?.persona_name]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const tree = await fetchComments(postId);
      setComments(tree);
      const total = countAllComments(tree);
      onCommentCountChange?.(total);
    } finally {
      setLoading(false);
    }
  }, [postId, onCommentCountChange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handler for posting a top-level comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserProfile) {
      onRequireAuth('Sign in with your campus account to join the conversation!');
      return;
    }

    if (!newCommentBody.trim()) {
      setError('Please write a comment before posting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await postComment({
        postId,
        authorId: currentUserProfile.id,
        body: newCommentBody.trim(),
        isPersona: postAsPersona,
        parentId: null,
        profile: currentUserProfile,
      });

      if (res.error || !res.comment) {
        setError(res.error || 'Failed to post comment.');
        return;
      }

      setComments((prev) => {
        const updated = [...prev, res.comment!];
        const newTotal = countAllComments(updated);
        onCommentCountChange?.(newTotal);
        return updated;
      });

      setNewCommentBody('');
    } catch {
      setError('Network error while posting comment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler when an inline reply is added anywhere in the tree
  const handleReplyAdded = (newReply: CommentWithAuthor) => {
    setComments((prev) => {
      // Flatten existing tree plus new reply, then re-build tree
      const flatten = (items: CommentWithAuthor[]): CommentWithAuthor[] => {
        const acc: CommentWithAuthor[] = [];
        for (const item of items) {
          acc.push(item);
          if (item.replies && item.replies.length > 0) {
            acc.push(...flatten(item.replies));
          }
        }
        return acc;
      };

      const flat = [...flatten(prev), newReply];
      const remapped = buildCommentTree(flat);
      const newTotal = countAllComments(remapped);
      onCommentCountChange?.(newTotal);
      return remapped;
    });
  };

  const totalCount = countAllComments(comments);

  return (
    <div className="pt-3 border-t border-stone-100 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <h4 className="font-semibold text-zinc-900 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
          <span>Comments</span>
          <span className="font-mono text-[11px] text-zinc-500 bg-stone-100 px-1.5 py-0.2 rounded-full">
            {totalCount}
          </span>
        </h4>
        <span className="text-[10px] text-zinc-400">Open to all students</span>
      </div>

      {/* Top-Level Composer */}
      {currentUserProfile ? (
        <form onSubmit={handleSubmitComment} className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <span className="font-medium">Posting as:</span>
              <span className="font-bold text-zinc-900">
                {postAsPersona
                  ? currentUserProfile.persona_name || '@persona'
                  : currentUserProfile.real_name || 'Campus Student'}
              </span>
            </div>

            {/* Persona toggle if profile has persona */}
            {currentUserProfile.persona_name ? (
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-zinc-600 font-medium">
                <input
                  type="checkbox"
                  checked={postAsPersona}
                  onChange={(e) => setPostAsPersona(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 h-3.5 w-3.5"
                />
                <span className="text-[11px]">Post as my persona</span>
              </label>
            ) : (
              <span className="text-[10px] text-zinc-400">
                (Set up a persona in profile to comment anonymously)
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              placeholder="Drop a thought, reply, or campus tip..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800 transition-all placeholder:text-zinc-400"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting || !newCommentBody.trim()}
              className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-600">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Anyone can read comments. Sign in to comment or reply.</span>
          </div>
          <button
            type="button"
            onClick={() =>
              onRequireAuth('Sign in with your campus account to join the discussion!')
            }
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-4 text-center text-xs text-zinc-400 animate-pulse">
          Loading campus comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-xs text-zinc-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((rootComment) => (
            <CommentItem
              key={rootComment.id}
              comment={rootComment}
              currentUserProfile={currentUserProfile}
              onRequireAuth={onRequireAuth}
              onReplyAdded={handleReplyAdded}
              onReportComment={onReportComment}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
