import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Search,
  UserCheck,
  RefreshCw,
  Loader2,
  ExternalLink,
  MessageSquare,
  FileText,
  Clock,
} from 'lucide-react';
import { Profile, FeedPost, ReportStatus, PostStatus } from '../types';
import {
  EnrichedReport,
  PersonaIdentityRecord,
  getLocalReports,
  getPersonaDirectory,
  togglePostStatus,
  updateReportStatus,
  getHiddenPostIds,
} from '../lib/moderation';
import { SEED_JUJA_POSTS } from '../lib/posts';

interface AdminDashboardModalProps {
  isOpen: boolean;
  currentUserProfile: Profile | null;
  posts: FeedPost[];
  onClose: () => void;
  onPostStatusChange?: (postId: string, newStatus: 'live' | 'hidden') => void;
  onNavigateToPost?: (postId: string) => void;
}

export function AdminDashboardModal({
  isOpen,
  currentUserProfile,
  posts,
  onClose,
  onPostStatusChange,
  onNavigateToPost,
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'personas' | 'posts'>('reports');
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [personas, setPersonas] = useState<PersonaIdentityRecord[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [postStatuses, setPostStatuses] = useState<Record<string, 'live' | 'hidden'>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReportStatus, setFilterReportStatus] = useState<ReportStatus | 'all'>('all');
  const [postFilter, setPostFilter] = useState<'all' | 'live' | 'hidden'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (!isOpen) return;

    setReports(getLocalReports());
    setHiddenIds(getHiddenPostIds());

    getPersonaDirectory().then((data) => {
      setPersonas(data);
    });

    const handleReportsUpdate = () => {
      setReports(getLocalReports());
      setHiddenIds(getHiddenPostIds());
    };

    window.addEventListener('reports-updated', handleReportsUpdate);
    window.addEventListener('post-status-changed', handleReportsUpdate);

    return () => {
      window.removeEventListener('reports-updated', handleReportsUpdate);
      window.removeEventListener('post-status-changed', handleReportsUpdate);
    };
  }, [isOpen]);

  if (!isOpen || currentUserProfile?.role !== 'admin') return null;

  // Handle Hide / Restore with 1 tap
  const handleToggleHide = async (postId: string, currentStatus?: PostStatus) => {
    const effectiveStatus =
      postStatuses[postId] ??
      (hiddenIds.has(postId) ? 'hidden' : currentStatus === 'hidden' ? 'hidden' : 'live');
    const nextStatus = effectiveStatus === 'hidden' ? 'live' : 'hidden';

    setActionLoadingId(`hide-${postId}`);
    try {
      await togglePostStatus(postId, nextStatus);

      setPostStatuses((prev) => ({ ...prev, [postId]: nextStatus }));

      const nextHidden = new Set(hiddenIds);
      if (nextStatus === 'hidden') {
        nextHidden.add(postId);
      } else {
        nextHidden.delete(postId);
      }
      setHiddenIds(nextHidden);

      if (onPostStatusChange) {
        onPostStatusChange(postId, nextStatus);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Report Status update
  const handleResolveReport = async (reportId: string, status: ReportStatus) => {
    setActionLoadingId(`report-${reportId}`);
    try {
      await updateReportStatus(reportId, status);
      setReports(getLocalReports());
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filterReportStatus !== 'all' && r.status !== filterReportStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.reason.toLowerCase().includes(q) ||
      r.target_snippet.toLowerCase().includes(q) ||
      (r.target_author_persona && r.target_author_persona.toLowerCase().includes(q)) ||
      (r.target_author_real_name && r.target_author_real_name.toLowerCase().includes(q))
    );
  });

  // Filtered personas
  const filteredPersonas = personas.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.persona_name.toLowerCase().includes(q) ||
      p.real_name.toLowerCase().includes(q) ||
      (p.sample_confession && p.sample_confession.toLowerCase().includes(q))
    );
  });

  // Combined posts list (from feed + seed)
  const allPosts = Array.from(
    new Map([...posts, ...SEED_JUJA_POSTS].map((p) => [p.id, p])).values()
  ).filter((p) => {
    const isHidden = hiddenIds.has(p.id) || p.status === 'hidden';
    if (postFilter === 'live' && isHidden) return false;
    if (postFilter === 'hidden' && !isHidden) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      p.body.toLowerCase().includes(q) ||
      p.persona_name.toLowerCase().includes(q) ||
      (p.author_real_name && p.author_real_name.toLowerCase().includes(q))
    );
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dashboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="admin-dashboard-title" className="font-display text-sm font-bold tracking-tight">
                  Juja Campus Moderation & Admin Deck
                </h2>
                <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30 uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Logged in as <strong className="text-white">{currentUserProfile.real_name}</strong> ({currentUserProfile.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector & Search Bar */}
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Reported Content</span>
              {pendingCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-white text-rose-800 px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'personas'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Persona Identity Reveal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Hide / Restore Posts</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, handle, name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
            />
          </div>
        </div>

        {/* Tab 1: Reported Items Queue */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">
                {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} listed
              </span>
              <div className="flex items-center gap-1">
                {(['all', 'pending', 'resolved', 'dismissed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterReportStatus(st)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                      filterReportStatus === st
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-600 hover:bg-stone-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-8 text-center space-y-2 border border-dashed border-stone-200 rounded-2xl bg-stone-50">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-900">Queue is Clear</h4>
                <p className="text-[11px] text-zinc-500">No reports match the current filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => {
                  const isPost = Boolean(report.post_id);
                  const postStatus = report.post_id ? postStatuses[report.post_id] : undefined;
                  const isHidden =
                    postStatus === 'hidden' ||
                    (postStatus === undefined &&
                      ((report.post_id && hiddenIds.has(report.post_id)) ||
                        report.post_status === 'hidden'));

                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3 hover:border-stone-300 transition-all"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              report.status === 'pending'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : report.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {report.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                            Reason: {report.reason.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {new Date(report.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Admin Deanonymization Notice */}
                        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-xs">
                          <span className="font-mono text-purple-900 font-bold">
                            {report.target_author_persona || '@anonymous'}
                          </span>
                          <span className="text-purple-400">→</span>
                          <span className="font-semibold text-zinc-900 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-700" />
                            <span>Real: {report.target_author_real_name || 'Verified Student'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                        {report.target_title && (
                          <p className="font-bold text-xs text-zinc-900">
                            {report.target_title}
                          </p>
                        )}
                        <p className="text-xs text-zinc-700 italic">
                          &ldquo;{report.target_snippet}&rdquo;
                        </p>
                        {report.details && (
                          <p className="text-[11px] text-rose-700 pt-1 font-medium border-t border-stone-200/60 mt-1.5">
                            Reporter notes: {report.details}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 flex-wrap">
                        <div className="flex items-center gap-2">
                          {isPost && report.post_id && (
                            <button
                              type="button"
                              onClick={() => handleToggleHide(report.post_id!)}
                              disabled={actionLoadingId === `hide-${report.post_id}`}
                              className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                isHidden
                                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                              }`}
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Restore Post to Feed</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Hide Post With 1-Tap</span>
                                </>
                              )}
                            </button>
                          )}

                          {report.post_id && onNavigateToPost && (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToPost(report.post_id!);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Post</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {report.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => handleResolveReport(report.id, 'resolved')}
                              className="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          {report.status !== 'dismissed' && (
                            <button
                              type="button"
                              onClick={() => handleResolveReport(report.id, 'dismissed')}
                              className="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:bg-stone-100 transition-colors"
                            >
                              Dismiss
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
        )}

        {/* Tab 2: Persona Identity Reveal / De-anonymizer */}
        {activeTab === 'personas' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-900">
                <ShieldAlert className="w-4 h-4 text-purple-800" />
                <span>Admin Deanonymization Directory</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                As Juja System Administrator, you have authorization to inspect real student identities behind anonymous campus personas and confessions to enforce safety and prevent targeted harassment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPersonas.map((persona) => (
                <div
                  key={persona.user_id + persona.persona_name}
                  className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-2.5 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl shrink-0 border border-stone-200 shadow-2xs">
                        {persona.persona_avatar}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="font-mono text-xs font-bold text-purple-950 truncate">
                          {persona.persona_name}
                        </p>
                        <p className="text-xs font-bold text-zinc-950 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{persona.real_name}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 uppercase border border-stone-200">
                      {persona.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-1 border-t border-stone-100 font-mono">
                    <span>{persona.confessions_count} Confessions</span>
                    <span>•</span>
                    <span>{persona.total_posts_count} Total Posts</span>
                  </div>

                  {persona.sample_confession && (
                    <div className="p-2 bg-stone-50 rounded-lg text-[11px] text-zinc-600 italic line-clamp-2 border border-stone-200/60">
                      &ldquo;{persona.sample_confession}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Hide / Restore Feed Posts */}
        {activeTab === 'posts' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">
                {allPosts.length} Campus {allPosts.length === 1 ? 'post' : 'posts'}
              </span>
              <div className="flex items-center gap-1">
                {(['all', 'live', 'hidden'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPostFilter(filter)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                      postFilter === filter
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-600 hover:bg-stone-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {allPosts.map((post) => {
                const currentStatus = postStatuses[post.id] ?? (hiddenIds.has(post.id) ? 'hidden' : post.status);
                const isHidden = currentStatus === 'hidden';

                return (
                  <div
                    key={post.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      isHidden
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isHidden
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isHidden ? '🚫 Hidden from Feed' : '✅ Live on Feed'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 capitalize border border-stone-200">
                          {post.post_type}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          ID: {post.id.slice(0, 12)}
                        </span>
                      </div>

                      {/* Author unmask */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-mono text-zinc-600">
                          {post.is_persona ? post.persona_name : 'Verified Name'}
                        </span>
                        <span className="text-zinc-400">→</span>
                        <span className="font-bold text-zinc-900">
                          {post.author_real_name || 'Verified Author'}
                        </span>
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <div className="space-y-0.5">
                      {post.title && (
                        <h4 className="font-bold text-xs text-zinc-950 truncate">
                          {post.title}
                        </h4>
                      )}
                      <p className="text-xs text-zinc-700 line-clamp-2">{post.body}</p>
                    </div>

                    {/* One-Tap Hide / Restore Button */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleHide(post.id, currentStatus)}
                        disabled={actionLoadingId === `hide-${post.id}`}
                        className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isHidden
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
                            : 'bg-rose-700 text-white hover:bg-rose-800 shadow-xs'
                        }`}
                      >
                        {actionLoadingId === `hide-${post.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>1-Tap Restore Post</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>1-Tap Hide Post</span>
                          </>
                        )}
                      </button>

                      {onNavigateToPost && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToPost(post.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs text-zinc-600 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Juja Campus Governance • Role-Based Access Control</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-zinc-800 font-semibold cursor-pointer transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
