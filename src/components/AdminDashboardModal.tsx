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
  UserPlus,
  Send,
  RotateCcw,
  Check,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  Filter,
  Plus,
} from 'lucide-react';
import { Profile, FeedPost, ReportStatus, PostStatus, UserRole, GuestBloggerAccount } from '../types';
import {
  EnrichedReport,
  PersonaIdentityRecord,
  getLocalReports,
  getPersonaDirectory,
  togglePostStatus,
  updateReportStatus,
  getHiddenPostIds,
  getAutoHideThreshold,
  setAutoHideThreshold,
  dismissAllReportsAndRestore,
} from '../lib/moderation';
import {
  getBannedWords,
  addBannedWord,
  removeBannedWord,
  resetBannedWords,
  containsBannedWords,
} from '../lib/bannedWords';
import { SEED_JUJA_POSTS } from '../lib/posts';
import {
  getLocalGuestBloggers,
  getLocalPendingQueue,
  createGuestBloggerAccount,
  updateGuestBloggerSettings,
  approvePendingPost,
  sendBackPendingPost,
} from '../lib/guestBloggers';
import {
  getCommunityRequests,
  approveCommunityRequest,
  rejectCommunityRequest,
  getAllCommunities,
} from '../lib/communities';
import { Community, CommunityRequest } from '../types';

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
  const [activeTab, setActiveTab] = useState<
    'queue' | 'guest_bloggers' | 'community_requests' | 'reports' | 'personas' | 'posts' | 'banned_words'
  >('queue');
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [personas, setPersonas] = useState<PersonaIdentityRecord[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [postStatuses, setPostStatuses] = useState<Record<string, 'live' | 'hidden'>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReportStatus, setFilterReportStatus] = useState<ReportStatus | 'all' | 'auto_hidden'>('all');
  const [postFilter, setPostFilter] = useState<'all' | 'live' | 'hidden'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Community Requests & Multi-Campus State
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [approvedCommunities, setApprovedCommunities] = useState<Community[]>([]);
  const [rejectReasonTargetId, setRejectReasonTargetId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Banned Words & Auto-Hide Threshold State
  const [bannedWordsList, setBannedWordsList] = useState<string[]>([]);
  const [newBannedWordInput, setNewBannedWordInput] = useState('');
  const [bannedWordError, setBannedWordError] = useState<string | null>(null);
  const [bannedWordSuccess, setBannedWordSuccess] = useState<string | null>(null);
  const [thresholdState, setThresholdState] = useState<number>(3);
  const [testText, setTestText] = useState('');

  // Guest Bloggers & Pending Queue state
  const [pendingQueue, setPendingQueue] = useState<FeedPost[]>([]);
  const [guestBloggers, setGuestBloggers] = useState<GuestBloggerAccount[]>([]);
  const [previewPost, setPreviewPost] = useState<FeedPost | null>(null);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // New Guest Blogger Form
  const [newBloggerName, setNewBloggerName] = useState('');
  const [newBloggerEmail, setNewBloggerEmail] = useState('');
  const [newBloggerPersona, setNewBloggerPersona] = useState('');
  const [newBloggerAvatar, setNewBloggerAvatar] = useState('✍️');
  const [newBloggerBio, setNewBloggerBio] = useState('');
  const [newBloggerRequireReview, setNewBloggerRequireReview] = useState(true);
  const [createBloggerError, setCreateBloggerError] = useState<string | null>(null);
  const [createBloggerSuccess, setCreateBloggerSuccess] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (!isOpen) return;

    setReports(getLocalReports());
    setHiddenIds(getHiddenPostIds());
    setPendingQueue(getLocalPendingQueue());
    setGuestBloggers(getLocalGuestBloggers());
    setBannedWordsList(getBannedWords());
    setThresholdState(getAutoHideThreshold());
    setCommunityRequests(getCommunityRequests());
    setApprovedCommunities(getAllCommunities());

    getPersonaDirectory().then((data) => {
      setPersonas(data);
    });

    const handleSync = () => {
      setReports(getLocalReports());
      setHiddenIds(getHiddenPostIds());
      setPendingQueue(getLocalPendingQueue());
      setGuestBloggers(getLocalGuestBloggers());
      setBannedWordsList(getBannedWords());
      setThresholdState(getAutoHideThreshold());
      setCommunityRequests(getCommunityRequests());
      setApprovedCommunities(getAllCommunities());
    };

    window.addEventListener('reports-updated', handleSync);
    window.addEventListener('post-status-changed', handleSync);
    window.addEventListener('pending-queue-updated', handleSync);
    window.addEventListener('guest-bloggers-updated', handleSync);
    window.addEventListener('banned-words-updated', handleSync);
    window.addEventListener('autohide-threshold-changed', handleSync);
    window.addEventListener('content-autohidden', handleSync);

    return () => {
      window.removeEventListener('reports-updated', handleSync);
      window.removeEventListener('post-status-changed', handleSync);
      window.removeEventListener('pending-queue-updated', handleSync);
      window.removeEventListener('guest-bloggers-updated', handleSync);
      window.removeEventListener('banned-words-updated', handleSync);
      window.removeEventListener('autohide-threshold-changed', handleSync);
      window.removeEventListener('content-autohidden', handleSync);
    };
  }, [isOpen]);

  if (!isOpen || currentUserProfile?.role !== 'admin') return null;

  // Handle Approve post from queue
  const handleApprove = (postId: string) => {
    setActionLoadingId(`approve-${postId}`);
    try {
      const res = approvePendingPost(postId, currentUserProfile.id);
      if (res.success && res.approvedPost) {
        setPendingQueue(getLocalPendingQueue());
        if (onPostStatusChange) {
          onPostStatusChange(postId, 'live');
        }
        setNotificationMsg(`✅ Post approved! It is now live in the Juja campus feed.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      } else if (res.error) {
        setNotificationMsg(`Error: ${res.error}`);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Send Back with feedback
  const handleSendBack = (postId: string) => {
    if (!feedbackText.trim()) {
      setFeedbackError('Please enter editorial feedback explaining the revisions needed.');
      return;
    }

    setActionLoadingId(`sendback-${postId}`);
    try {
      const res = sendBackPendingPost(postId, feedbackText.trim(), currentUserProfile.id);
      if (res.success) {
        setPendingQueue(getLocalPendingQueue());
        setFeedbackTargetId(null);
        setFeedbackText('');
        setFeedbackError(null);
        setNotificationMsg(`↩️ Post sent back to guest blogger with revision notes.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      } else if (res.error) {
        setFeedbackError(res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Create Guest Blogger Account
  const handleCreateBlogger = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateBloggerError(null);
    setCreateBloggerSuccess(null);

    const res = createGuestBloggerAccount({
      display_name: newBloggerName,
      email: newBloggerEmail,
      persona_name: newBloggerPersona,
      persona_avatar: newBloggerAvatar,
      bio: newBloggerBio,
      require_review: newBloggerRequireReview,
      created_by: currentUserProfile.real_name,
    });

    if (!res.success) {
      setCreateBloggerError(res.error || 'Failed to create guest blogger account.');
      return;
    }

    setGuestBloggers(getLocalGuestBloggers());
    setCreateBloggerSuccess(`🎉 Guest blogger "${newBloggerName}" created successfully!`);
    setNewBloggerName('');
    setNewBloggerEmail('');
    setNewBloggerPersona('');
    setNewBloggerBio('');
    setTimeout(() => setCreateBloggerSuccess(null), 4000);
  };

  // Handle Approve Community Request -> Launches community and appoints creator as moderator
  const handleApproveCommunity = (reqId: string) => {
    setActionLoadingId(`comm-app-${reqId}`);
    try {
      const res = approveCommunityRequest(reqId, currentUserProfile?.id || '00000000-0000-0000-0000-000000000001');
      if (res.success && res.community) {
        setCommunityRequests(getCommunityRequests());
        setApprovedCommunities(getAllCommunities());
        setNotificationMsg(`🎉 Campus community "${res.community.name}" approved & launched! Creator appointed as moderator.`);
        window.dispatchEvent(new CustomEvent('community-approved', { detail: { community: res.community } }));
      } else {
        setNotificationMsg(`Approval failed: ${res.error || 'Unknown error'}`);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Community Request with reason
  const handleRejectCommunity = (reqId: string) => {
    setActionLoadingId(`comm-rej-${reqId}`);
    try {
      const res = rejectCommunityRequest(reqId, rejectReasonInput.trim() || undefined);
      if (res.success) {
        setCommunityRequests(getCommunityRequests());
        setRejectReasonTargetId(null);
        setRejectReasonInput('');
        setNotificationMsg(`Community request rejected.`);
      } else {
        setNotificationMsg(`Rejection failed: ${res.error || 'Unknown error'}`);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

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

  // Handle Add Banned Word
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    setBannedWordError(null);
    setBannedWordSuccess(null);
    const trimmed = newBannedWordInput.trim().toLowerCase();
    const res = addBannedWord(trimmed);
    if (!res.success) {
      setBannedWordError(res.error || 'Failed to add word');
      return;
    }
    setBannedWordsList(res.words);
    setNewBannedWordInput('');
    setBannedWordSuccess(`Added "${trimmed}" to banned words list.`);
    setTimeout(() => setBannedWordSuccess(null), 3000);
  };

  // Handle Remove Banned Word
  const handleRemoveWord = (word: string) => {
    const res = removeBannedWord(word);
    setBannedWordsList(res.words);
    setBannedWordSuccess(`Removed "${word}" from banned words list.`);
    setTimeout(() => setBannedWordSuccess(null), 3000);
  };

  // Handle Reset Banned Words
  const handleResetWords = () => {
    const defaults = resetBannedWords();
    setBannedWordsList(defaults);
    setBannedWordSuccess('Banned words reset to campus defaults.');
    setTimeout(() => setBannedWordSuccess(null), 3000);
  };

  // Handle Change Auto-Hide Threshold
  const handleChangeThreshold = (val: number) => {
    setAutoHideThreshold(val);
    setThresholdState(val);
    setNotificationMsg(`🛡️ Auto-hide threshold updated: items will auto-hide at ${val} reports.`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Handle Restore and Dismiss All Reports for an Auto-Hidden item
  const handleRestoreAndDismissAll = async (targetType: 'post' | 'comment', targetId: string) => {
    setActionLoadingId(`restore-all-${targetId}`);
    try {
      await dismissAllReportsAndRestore(targetType, targetId);
      setReports(getLocalReports());
      setHiddenIds(getHiddenPostIds());
      setNotificationMsg(`✅ Item restored to live and all reports dismissed.`);
      setTimeout(() => setNotificationMsg(null), 4000);
      if (targetType === 'post' && onPostStatusChange) {
        onPostStatusChange(targetId, 'live');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered pending queue
  const filteredQueue = pendingQueue.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      p.body.toLowerCase().includes(q) ||
      (p.author_real_name && p.author_real_name.toLowerCase().includes(q)) ||
      p.persona_name.toLowerCase().includes(q)
    );
  });

  // Filtered guest bloggers
  const filteredBloggers = guestBloggers.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.display_name.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.persona_name.toLowerCase().includes(q) ||
      (b.bio && b.bio.toLowerCase().includes(q))
    );
  });

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filterReportStatus === 'auto_hidden') {
      if (!r.auto_hidden && r.post_status !== 'hidden') return false;
    } else if (filterReportStatus !== 'all' && r.status !== filterReportStatus) {
      return false;
    }
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
  const queuePendingCount = pendingQueue.filter((p) => p.status === 'pending').length;
  const pendingCommCount = communityRequests.filter((c) => c.status === 'pending').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dashboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in duration-200">
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
                Active Session: <strong className="text-white">Campus Super Admin</strong> (Verified Moderator Access)
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

        {/* Global Notification Banner */}
        {notificationMsg && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between">
            <span>{notificationMsg}</span>
            <button
              type="button"
              onClick={() => setNotificationMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Selector & Search Bar */}
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* 1. Pending Review Queue Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'queue'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue</span>
              {queuePendingCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-white text-amber-800 px-1.5 py-0.2 rounded-full">
                  {queuePendingCount}
                </span>
              )}
            </button>

            {/* 2. Guest Bloggers Management Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('guest_bloggers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'guest_bloggers'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Guest Bloggers</span>
              <span className="text-[10px] font-bold bg-stone-100 text-zinc-700 px-1.5 py-0.2 rounded-full">
                {guestBloggers.length}
              </span>
            </button>

            {/* 3. Campus Community Requests Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('community_requests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'community_requests'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Requests</span>
              {pendingCommCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-white text-emerald-800 px-1.5 py-0.2 rounded-full">
                  {pendingCommCount}
                </span>
              )}
            </button>

            {/* 3. Reports Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
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

            {/* 4. Persona Identity Reveal */}
            <button
              type="button"
              onClick={() => setActiveTab('personas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'personas'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Persona Reveal</span>
            </button>

            {/* 5. Hide / Restore Posts */}
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'posts'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Feed Posts</span>
            </button>

            {/* 6. Banned Words & Auto-Moderation Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('banned_words')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'banned_words'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Banned Words & Rules</span>
              <span className="text-[10px] font-bold bg-stone-100 text-zinc-700 px-1.5 py-0.2 rounded-full">
                {bannedWordsList.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* TAB 1: PENDING REVIEW QUEUE */}
        {activeTab === 'queue' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Editorial Review Queue</p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Posts from guest bloggers require administrator approval before going live in the Juja campus stream.
                  You can preview each submission, approve it to go live immediately, or send it back with revision notes.
                </p>
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-semibold text-zinc-700">Review queue is empty</p>
                <p className="text-[11px] text-zinc-400">All guest blogger posts have been processed.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredQueue.map((post) => {
                  const isPending = post.status === 'pending';
                  const isRejected = post.status === 'rejected';

                  return (
                    <div
                      key={post.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isPending
                          ? 'border-amber-200 bg-white shadow-2xs'
                          : 'border-stone-200 bg-stone-50/70'
                      }`}
                    >
                      {/* Card Header: Author Info + Status Badge */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {post.persona_avatar || '✍️'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-900">
                                {post.author_real_name || 'Guest Blogger'}
                              </span>
                              <span className="text-[10px] font-semibold font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded">
                                Guest Blogger
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Handle: <span className="font-mono text-zinc-700">{post.persona_name}</span> • Submitted {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200 capitalize">
                            {post.post_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {isPending ? '⏳ Awaiting Review' : isRejected ? '↩️ Sent Back' : '✅ Live'}
                          </span>
                        </div>
                      </div>

                      {/* Post Snippet */}
                      <div className="space-y-1 bg-stone-50/60 p-3 rounded-xl border border-stone-200/60">
                        {post.title && (
                          <h4 className="font-bold text-xs text-zinc-950">
                            {post.title}
                          </h4>
                        )}
                        <p className="text-xs text-zinc-700 line-clamp-3 leading-relaxed">
                          {post.body}
                        </p>
                        {post.image_url && (
                          <div className="pt-1.5">
                            <img
                              src={post.image_url}
                              alt="Post attachment"
                              className="h-24 w-auto object-cover rounded-lg border border-stone-200"
                            />
                          </div>
                        )}
                      </div>

                      {/* Sent Back Note if present */}
                      {post.review_feedback && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-0.5">
                          <p className="font-bold text-[11px] flex items-center gap-1 text-rose-950">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Editorial Feedback Given:</span>
                          </p>
                          <p className="text-[11px] text-rose-800 italic">
                            "{post.review_feedback}"
                          </p>
                        </div>
                      )}

                      {/* Inline Send Back Box */}
                      {feedbackTargetId === post.id && (
                        <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 space-y-2">
                          <p className="text-xs font-bold text-zinc-800">
                            Editorial Revision Feedback for {post.author_real_name || 'Blogger'}:
                          </p>
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="e.g. Please clarify the exact hall or time, or verify the quotes with student council..."
                            rows={3}
                            className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
                          />
                          {feedbackError && (
                            <p className="text-[11px] text-rose-600 font-medium">{feedbackError}</p>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackTargetId(null);
                                setFeedbackText('');
                                setFeedbackError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-stone-200 font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendBack(post.id)}
                              disabled={actionLoadingId === `sendback-${post.id}`}
                              className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {actionLoadingId === `sendback-${post.id}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>Send Back to Blogger</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewPost(post)}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-zinc-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Preview Full Post</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {isPending && feedbackTargetId !== post.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackTargetId(post.id);
                                setFeedbackText('');
                                setFeedbackError(null);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Send Back</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleApprove(post.id)}
                            disabled={actionLoadingId === `approve-${post.id}`}
                            className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {actionLoadingId === `approve-${post.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Approve & Go Live</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GUEST BLOGGERS MANAGEMENT */}
        {activeTab === 'guest_bloggers' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Create Guest Blogger Form */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-zinc-950">
                    Create Guest Blogger Account
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Grant designated campus writers, clubs, or societies verified guest posting privileges.
                  </p>
                </div>
              </div>

              {createBloggerSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>{createBloggerSuccess}</span>
                </div>
              )}

              {createBloggerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                  <span>{createBloggerError}</span>
                </div>
              )}

              <form onSubmit={handleCreateBlogger} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Display Name / Society Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBloggerName}
                      onChange={(e) => setNewBloggerName(e.target.value)}
                      placeholder="e.g. Dennis K. (JKUAT Law Society)"
                      className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Campus Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newBloggerEmail}
                      onChange={(e) => setNewBloggerEmail(e.target.value)}
                      placeholder="e.g. law.society@students.jkuat.ac.ke"
                      className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Campus Persona / Handle *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBloggerPersona}
                      onChange={(e) => setNewBloggerPersona(e.target.value)}
                      placeholder="e.g. @jkuat_law"
                      className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Avatar Emoji
                    </label>
                    <div className="flex items-center gap-1.5">
                      {['🌿', '⚖️', '✍️', '⚡', '🔬', '🎪', '📸'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewBloggerAvatar(emoji)}
                          className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-transform cursor-pointer ${
                            newBloggerAvatar === emoji
                              ? 'bg-blue-600 text-white scale-110 shadow-xs'
                              : 'bg-white border border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Blogger Bio / Mission Note
                  </label>
                  <input
                    type="text"
                    value={newBloggerBio}
                    onChange={(e) => setNewBloggerBio(e.target.value)}
                    placeholder="e.g. Official campus legal awareness and student constitutional rights."
                    className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
                  />
                </div>

                {/* Require Review Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newBloggerRequireReview}
                    onChange={(e) => setNewBloggerRequireReview(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300"
                  />
                  <span className="text-xs font-semibold text-zinc-800">
                    Require editorial review before posts go live in the feed (Recommended)
                  </span>
                </label>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Guest Blogger</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Registered Guest Bloggers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Registered Guest Bloggers ({filteredBloggers.length})
                </h4>
                <span className="text-[11px] text-zinc-500">
                  Role: <strong className="font-mono text-zinc-700">guest_blogger</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredBloggers.map((blogger) => (
                  <div
                    key={blogger.id}
                    className="p-3.5 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center text-sm font-bold shrink-0">
                            {blogger.persona_avatar}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-zinc-950">{blogger.display_name}</p>
                            <p className="text-[11px] font-mono text-blue-700">{blogger.persona_name}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            blogger.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {blogger.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 font-mono truncate">{blogger.email}</p>
                      {blogger.bio && (
                        <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed bg-stone-50 p-2 rounded-xl">
                          {blogger.bio}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500">Review required:</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateGuestBloggerSettings(blogger.id, {
                              require_review: !blogger.require_review,
                            })
                          }
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            blogger.require_review
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {blogger.require_review ? 'YES (Pending)' : 'NO (Direct)'}
                        </button>
                      </div>

                      <span className="text-[10px] text-zinc-400">
                        Added {new Date(blogger.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">
                Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
              </span>
              <div className="flex items-center gap-1">
                {(['all', 'pending', 'auto_hidden', 'resolved', 'dismissed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterReportStatus(status)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                      filterReportStatus === status
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-600 hover:bg-stone-100'
                    }`}
                  >
                    {status === 'auto_hidden' ? '🚨 Auto-Hidden' : status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredReports.map((report) => {
                const isAutoHidden = report.auto_hidden || report.post_status === 'hidden';

                return (
                  <div
                    key={report.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 shadow-2xs ${
                      isAutoHidden ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          {report.reason}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Target: {report.target_type}
                        </span>
                        {isAutoHidden && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Auto-Hidden</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-zinc-500">
                          {report.target_author_persona || 'Real Identity'}
                        </span>
                        <span className="text-zinc-400">→</span>
                        <span className="text-xs font-bold text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {report.target_author_real_name || 'Verified Author'}
                        </span>
                      </div>
                    </div>

                    {isAutoHidden && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-950 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[11px] text-amber-900 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          <span>This {report.target_type} reached report threshold and was auto-hidden.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRestoreAndDismissAll(report.target_type, (report.post_id || report.comment_id)!)}
                          disabled={actionLoadingId === `restore-all-${report.post_id || report.comment_id}`}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Restore & Dismiss All</span>
                        </button>
                      </div>
                    )}

                    <div className="p-2.5 bg-stone-50 rounded-xl text-xs text-zinc-700 italic border border-stone-200/60">
                      "{report.target_snippet}"
                    </div>

                    {report.details && (
                      <p className="text-[11px] text-zinc-600">
                        <strong>Reporter Note:</strong> {report.details}
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        Reported {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {report.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResolveReport(report.id, 'dismissed')}
                              disabled={actionLoadingId === `report-${report.id}`}
                              className="px-2.5 py-1 text-xs text-zinc-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveReport(report.id, 'resolved')}
                              disabled={actionLoadingId === `report-${report.id}`}
                              className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 cursor-pointer shadow-xs"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PERSONA IDENTITY REVEAL */}
        {activeTab === 'personas' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Campus Deanonymization Directory</p>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Real names are strictly shielded from public students and search indexing, but full identity mappings remain accessible to verified campus administrators.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPersonas.map((rec) => (
                <div
                  key={rec.user_id}
                  className="p-3.5 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base">{rec.persona_avatar}</span>
                        <span className="font-mono text-xs font-bold text-purple-900 truncate">
                          {rec.persona_name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                        {rec.role}
                      </span>
                    </div>

                    <div className="p-2 bg-stone-50 rounded-xl text-xs space-y-0.5 border border-stone-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Verified Identity
                      </p>
                      <p className="font-bold text-zinc-950 text-xs">{rec.real_name}</p>
                    </div>

                    {rec.sample_confession && (
                      <p className="text-[11px] text-zinc-600 line-clamp-2 italic pt-1">
                        "{rec.sample_confession}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{rec.total_posts_count} posts total</span>
                    <span>{rec.confessions_count} confessions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: HIDE / RESTORE FEED POSTS */}
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

        {/* TAB 6: BANNED WORDS & AUTO-MODERATION RULES */}
        {activeTab === 'banned_words' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Auto-Hide Threshold Configuration Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-zinc-950">
                      Auto-Hide Report Threshold
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Number of community reports required to automatically hide content pending review
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5].map((threshold) => (
                    <button
                      key={threshold}
                      type="button"
                      onClick={() => handleChangeThreshold(threshold)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        thresholdState === threshold
                          ? 'bg-rose-700 text-white shadow-xs scale-105'
                          : 'bg-white border border-stone-300 text-zinc-700 hover:bg-stone-100'
                      }`}
                    >
                      {threshold} Reports {threshold === 3 ? '(Default)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-600 leading-relaxed">
                When a campus post or comment reaches <strong>{thresholdState} pending reports</strong>, it is immediately removed from the active feed view. It remains stored for administrator review where you can 1-tap restore or confirm deletion.
              </div>
            </div>

            {/* Banned Words Editor */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-display text-sm font-bold text-zinc-950 flex items-center gap-2">
                    <span>Restricted Keywords & Scam Phrases</span>
                    <span className="text-[10px] font-mono font-bold bg-stone-100 text-zinc-700 px-2 py-0.5 rounded-full">
                      {bannedWordsList.length} Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Content containing these words is automatically blocked upon submission with friendly guidance.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetWords}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>
              </div>

              {bannedWordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>{bannedWordSuccess}</span>
                </div>
              )}

              {bannedWordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                  <span>{bannedWordError}</span>
                </div>
              )}

              {/* Add Word Form */}
              <form onSubmit={handleAddWord} className="flex gap-2">
                <input
                  type="text"
                  value={newBannedWordInput}
                  onChange={(e) => setNewBannedWordInput(e.target.value)}
                  placeholder="Enter a new restricted word or phrase (e.g. fake clearance, leak answers)..."
                  className="flex-1 text-xs px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Word</span>
                </button>
              </form>

              {/* Banned Words Tag Cloud */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider block">
                  Active Filter List (Click × to remove):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200/80">
                  {bannedWordsList.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-mono text-zinc-800 shadow-2xs group hover:border-rose-300"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(word)}
                        className="w-4 h-4 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                        title={`Remove "${word}"`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Filter Tester Simulator */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-600" />
                <h4 className="font-bold text-xs text-zinc-900">
                  Interactive Filter Tester
                </h4>
              </div>
              <p className="text-[11px] text-zinc-500">
                Type sample student text to preview whether the banned words filter will catch it.
              </p>
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Test a student submission here (e.g. Someone is offering an exam leak at Gate C)..."
                className="w-full text-xs px-3.5 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800 text-zinc-900"
              />

              {testText.trim().length > 0 && (() => {
                const match = containsBannedWords(testText, bannedWordsList);
                return match.hasBannedWord ? (
                  <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Blocked:</strong> Contains banned phrase <strong>"{match.matchedWord}"</strong>.</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span><strong>Allowed:</strong> No banned keywords detected in this submission.</span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: COMMUNITY REQUESTS & MULTI-CAMPUS GOVERNANCE */}
        {activeTab === 'community_requests' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Campus Expansion & Community Approval</p>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Review student proposals for new university campus spaces. Approving a request immediately activates the community, publishes its <span className="font-mono">/c/:slug</span> shareable URL, and appoints the creator as the official community moderator with powers to customize campus rules and hide inappropriate posts.
                </p>
              </div>
            </div>

            {/* Pending Requests List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Campus Proposals ({communityRequests.filter((r) => r.status === 'pending').length})</span>
                </h3>
              </div>

              {communityRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-zinc-700">No pending campus proposals</p>
                  <p className="text-[11px] text-zinc-400">All submitted university requests have been processed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communityRequests.map((req) => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';
                    const isRejected = req.status === 'rejected';
                    const isLoading = actionLoadingId === `comm-app-${req.id}` || actionLoadingId === `comm-rej-${req.id}`;
                    const showRejectInput = rejectReasonTargetId === req.id;

                    return (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isPending
                            ? 'bg-white border-amber-300/80 shadow-xs ring-1 ring-amber-400/20'
                            : isApproved
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-stone-50 border-stone-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-2.5">
                            <span className="text-2xl p-2 rounded-xl bg-stone-100 border border-stone-200">
                              {req.icon || '🎓'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-zinc-950">
                                  {req.name}
                                </h4>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                  /c/{req.slug}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    isPending
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : isApproved
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-stone-200 text-stone-700'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>

                              {req.tagline && (
                                <p className="text-xs text-zinc-700 font-medium mt-0.5">
                                  &quot;{req.tagline}&quot;
                                </p>
                              )}
                              {req.description && (
                                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                  {req.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Theme swatch */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200 text-[11px] text-zinc-600">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block shrink-0"
                              style={{ backgroundColor: req.color || '#064e3b' }}
                            />
                            <span className="font-mono uppercase text-[10px]">{req.color || '#064e3b'}</span>
                          </div>
                        </div>

                        {/* Rules snippet & Requester info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 text-[11px] space-y-1">
                            <p className="font-semibold text-zinc-700">Requester / Proposed Moderator:</p>
                            <p className="text-zinc-600">
                              <strong>{req.requester_name}</strong>
                              {req.requester_persona && (
                                <span className="text-emerald-800 ml-1 font-mono">({req.requester_persona})</span>
                              )}
                            </p>
                            <p className="text-stone-400 text-[10px]">
                              Submitted {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 text-[11px] space-y-1">
                            <p className="font-semibold text-zinc-700">Initial Rules ({req.rules?.length || 0}):</p>
                            <p className="text-zinc-600 italic line-clamp-2">
                              {req.rules && req.rules.length > 0
                                ? req.rules[0]
                                : 'Default platform safety guidelines'}
                            </p>
                          </div>
                        </div>

                        {/* Rejection reason box if rejected */}
                        {isRejected && req.rejection_reason && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                            <strong>Reason:</strong> {req.rejection_reason}
                          </div>
                        )}

                        {/* Action buttons */}
                        {isPending && (
                          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-500">
                              Approving will grant <strong>{req.requester_name}</strong> moderator powers.
                            </span>

                            <div className="flex items-center gap-2">
                              {showRejectInput ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={rejectReasonInput}
                                    onChange={(e) => setRejectReasonInput(e.target.value)}
                                    placeholder="Reason for declining..."
                                    className="text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-zinc-800"
                                  />
                                  <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleRejectCommunity(req.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectReasonTargetId(null)}
                                    className="px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-stone-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => setRejectReasonTargetId(req.id)}
                                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-rose-50 hover:text-rose-700 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleApproveCommunity(req.id)}
                                className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve & Launch Campus</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Currently Live Communities Summary */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-600">
                Live Campus Communities ({approvedCommunities.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {approvedCommunities.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{comm.icon || '🎓'}</span>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{comm.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">/c/{comm.slug}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-zinc-700 border border-stone-200">
                        {(comm.member_count || 1).toLocaleString()} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Post Preview Drawer */}
        {previewPost && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-sm font-bold">
                    {previewPost.persona_avatar || '✍️'}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-zinc-950">
                      {previewPost.author_real_name || 'Guest Blogger'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {previewPost.persona_name} • {previewPost.community_name || 'Juja'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPost(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-stone-100 text-stone-700">
                    {previewPost.post_type}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-900 border border-amber-300">
                    {previewPost.status}
                  </span>
                </div>

                {previewPost.title && (
                  <h2 className="font-display text-base font-bold text-zinc-950 leading-snug">
                    {previewPost.title}
                  </h2>
                )}

                <p className="text-xs text-zinc-800 whitespace-pre-line leading-relaxed">
                  {previewPost.body}
                </p>

                {previewPost.image_url && (
                  <img
                    src={previewPost.image_url}
                    alt={previewPost.title || 'Meme/Photo'}
                    className="w-full max-h-72 object-cover rounded-xl border border-stone-200"
                  />
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPost(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Close Preview
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackTargetId(previewPost.id);
                      setPreviewPost(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Send Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(previewPost.id);
                      setPreviewPost(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Go Live</span>
                  </button>
                </div>
              </div>
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
