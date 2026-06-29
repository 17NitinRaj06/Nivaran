import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiLocationMarker, HiArrowUp, HiCheckCircle, HiClock,
  HiExclamationCircle, HiTrash, HiExternalLink,
  HiShare, HiBadgeCheck, HiCalendar, HiUser, HiPhotograph, HiChevronDown,
  HiExclamation,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  toggleUpvote, deleteReport,
} from '../../services/firestoreService';
import { sanitizeError } from '../../utils/errors';
import BadgeDisplay from '../ui/BadgeDisplay';
import { getBadgeAvatar } from '../../utils/badgeAvatar';

const statusConfig = {
  'pending': { label: 'Pending', icon: HiClock, color: 'text-yellow-600 bg-yellow-50' },
  'verified': { label: 'Verified', icon: HiCheckCircle, color: 'text-blue-600 bg-blue-50' },
  'assigned': { label: 'Assigned', icon: HiExclamationCircle, color: 'text-purple-600 bg-purple-50' },
  'in-progress': { label: 'In Progress', icon: HiExclamationCircle, color: 'text-orange-600 bg-orange-50' },
  'resolved': { label: 'Resolved', icon: HiCheckCircle, color: 'text-green-600 bg-green-50' },
};

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'object' && value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

function getStatusDates(statusHistory = [], createdAt) {
  const dates = {};
  if (createdAt) dates.pending = toDate(createdAt);
  statusHistory.forEach(h => {
    dates[h.status] = toDate(h.timestamp);
  });
  return dates;
}

function formatDate(value) {
  const d = toDate(value);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <cfg.icon size={12} />
      {cfg.label}
    </span>
  );
}

export default function FeedCard({ report, onUpvote, onDelete, showOwnerControls }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.uid === report.userId;
  const isResolved = report.status === 'resolved';
  const [upvoteCount, setUpvoteCount] = useState(report.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState((report.upvotedBy || []).includes(user?.uid));
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleUpvote = async () => {
    if (!user) { toast.error('Please sign in to upvote'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const result = await toggleUpvote(report.id, user.uid);
      setIsUpvoted(result.upvoted);
      setUpvoteCount(result.newCount);
      if (result.autoVerified) {
        toast.success('Report automatically verified (5+ upvotes)!');
      }
      if (onUpvote) onUpvote();
    } catch (err) {
      toast.error(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteReport(report.id, user.uid);
      toast.success('Report deleted');
      if (onDelete) onDelete();
    } catch (err) {
      toast.error(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/tracking/${report.id}`;
    const text = `${report.category} issue reported in ${[report.area, report.city].filter(Boolean).join(', ')}: ${report.description?.slice(0, 100)}...`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Nivaran — Civic Issue', text, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Link copied to clipboard');
    }
  };

  const timeAgo = (() => {
    const d = toDate(report.createdAt);
    if (!d) return 'Just now';
    return formatTimeAgo(d.getTime() / 1000);
  })();

  const locationParts = [report.area, report.city, report.state].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : '';

  const dates = getStatusDates(report.statusHistory, report.createdAt);

  return (
    <div className="card overflow-hidden group hover:shadow-card-hover relative">
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        {report.emergency && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
            <HiExclamation size={12} />
            SOS
          </span>
        )}
        <StatusBadge status={report.status} />
      </div>
      <div className="absolute top-3 right-3 z-10">
        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-forest-700 capitalize">
          {report.category}
        </span>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full ${getBadgeAvatar(report.badges).gradient} flex items-center justify-center shrink-0 overflow-hidden`}>
              {report.photoURL ? (
                <img src={report.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">{getBadgeAvatar(report.badges).emoji || (report.userName || 'A').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-forest-800 truncate">{report.userName || 'Anonymous'}</p>
              <p className="text-xs text-earth-400">{timeAgo}</p>
            </div>
          </div>
          <BadgeDisplay userId={report.userId} />
        </div>

        {report.imageURL && (
          <img src={report.imageURL} alt="Report" className="w-full h-48 object-cover rounded-xl" />
        )}
        {report.videoURL && !report.imageURL && (
          <video src={report.videoURL} controls className="w-full h-48 object-cover rounded-xl" />
        )}

        <p className="text-earth-700 text-sm leading-relaxed line-clamp-3">
          {report.generatedDescription || report.description}
        </p>

        {locationStr && (
          <div className="flex items-start gap-1.5 text-earth-400 text-xs">
            <HiLocationMarker size={14} className="shrink-0 mt-0.5" />
            <span>{locationStr}{report.pincode ? ` - ${report.pincode}` : ''}</span>
          </div>
        )}

        {isResolved && (
          <div className="border border-green-200 bg-green-50/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium text-green-800 hover:bg-green-50/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HiBadgeCheck size={16} className="text-green-600" />
                Resolved — View Summary
              </span>
              <HiChevronDown size={16} className={`transition-transform ${showSummary ? 'rotate-180' : ''}`} />
            </button>
            {showSummary && (
              <div className="px-3 pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {dates.pending && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-[10px] text-earth-400 uppercase flex items-center gap-1"><HiCalendar size={10} /> Reported</p>
                      <p className="text-xs font-medium text-earth-700">{formatDate(dates.pending)}</p>
                    </div>
                  )}
                  {dates.verified && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-[10px] text-earth-400 uppercase flex items-center gap-1"><HiCalendar size={10} /> Verified</p>
                      <p className="text-xs font-medium text-earth-700">{formatDate(dates.verified)}</p>
                    </div>
                  )}
                  {dates.assigned && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-[10px] text-earth-400 uppercase flex items-center gap-1"><HiCalendar size={10} /> Assigned</p>
                      <p className="text-xs font-medium text-earth-700">{formatDate(dates.assigned)}</p>
                    </div>
                  )}
                  {dates.resolved && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-[10px] text-earth-400 uppercase flex items-center gap-1"><HiCalendar size={10} /> Resolved</p>
                      <p className="text-xs font-medium text-green-700">{formatDate(dates.resolved)}</p>
                    </div>
                  )}
                </div>
                {(report.assignedTo || report.assignedDepartment) && (
                  <div className="bg-white/70 rounded-lg p-2.5 flex items-center gap-2">
                    <HiUser size={14} className="text-purple-500 shrink-0" />
                    <p className="text-xs text-earth-700">
                      Handled by <span className="font-medium">{report.assignedTo || 'Concerned Officer'}</span>
                      {report.assignedDepartment && <> ({report.assignedDepartment})</>}
                    </p>
                  </div>
                )}
                {(report.resolvedImageURL || report.imageURL) && (
                  <div className="relative">
                    <p className="text-[10px] text-earth-400 uppercase mb-1 flex items-center gap-1"><HiPhotograph size={10} /> Resolved Evidence</p>
                    <img
                      src={report.resolvedImageURL || report.imageURL}
                      alt="Resolved"
                      className="w-full h-36 object-cover rounded-lg border border-green-200"
                    />
                  </div>
                )}
                <p className="text-[10px] text-green-600 text-center italic">✓ This issue has been resolved and verified by authorities</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-beige-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isUpvoted ? 'bg-forest-50 text-forest-700' : 'text-earth-500 hover:bg-beige-50'
              }`}
            >
              <HiArrowUp size={16} className={isUpvoted ? 'text-forest-600' : ''} />
              <span>{upvoteCount}</span>
            </button>
            <button
              onClick={() => navigate(`/dashboard/tracking/${report.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-earth-500 hover:bg-beige-50 transition-all"
            >
              <HiExternalLink size={14} />
              Track
            </button>
            {!isResolved && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-earth-500 hover:bg-beige-50 transition-all"
              >
                <HiShare size={14} />
                Share
              </button>
            )}
          </div>

          {(showOwnerControls || isOwner) && isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <HiTrash size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(seconds) {
  const now = Date.now() / 1000;
  const diff = now - seconds;
  const mins = Math.floor(diff / 60);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(seconds * 1000).toLocaleDateString();
}
