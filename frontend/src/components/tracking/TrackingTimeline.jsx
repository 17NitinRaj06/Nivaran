import { motion } from 'framer-motion';
import { HiClock, HiCheckCircle, HiShieldCheck, HiUserGroup, HiCog } from 'react-icons/hi';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: HiClock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { key: 'verified', label: 'Verified', icon: HiShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'assigned', label: 'Assigned', icon: HiUserGroup, color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'in-progress', label: 'In Progress', icon: HiCog, color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'resolved', label: 'Resolved', icon: HiCheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
];

const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

export default function TrackingTimeline({ currentStatus, statusHistory = [], createdAt }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const fullHistory = [];
  if (createdAt) {
    fullHistory.push({ status: 'pending', timestamp: createdAt, label: 'Report Submitted' });
  }
  if (statusHistory && statusHistory.length > 0) {
    statusHistory.forEach(h => {
      if (h.status !== 'pending') fullHistory.push(h);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-forest-700">Progress Timeline</h3>
        <span className="text-xs text-earth-400">
          Status: <strong className="text-forest-600 capitalize">{currentStatus}</strong>
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-beige-200" />

        <div className="space-y-0">
          {STATUS_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = currentIdx >= idx;
            const isCurrent = currentIdx === idx;
            const historyEntry = fullHistory.find(h => h.status === step.key);

            return (
              <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                <motion.div
                  initial={false}
                  animate={{ scale: isCurrent ? 1.2 : 1 }}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted ? step.bg : 'bg-beige-100'
                  } ${isCurrent ? 'ring-4 ring-forest-200' : ''}`}
                >
                  <StepIcon size={18} className={isCompleted ? step.color : 'text-earth-300'} />
                </motion.div>

                <div className="flex-1 min-w-0 pt-1.5">
                  <p className={`font-medium ${isCompleted ? 'text-forest-800' : 'text-earth-400'}`}>
                    {step.label}
                  </p>
                  {historyEntry && (
                    <p className="text-xs text-earth-500 mt-0.5">
                      {formatTimestamp(historyEntry.timestamp)}
                      {historyEntry.note && ` - ${historyEntry.note}`}
                    </p>
                  )}
                  {isCurrent && !historyEntry && (
                    <p className="text-xs text-forest-600 mt-0.5 font-medium animate-pulse">
                      Currently active
                    </p>
                  )}
                </div>

                {isCompleted && (
                  <HiCheckCircle className="text-green-500 shrink-0 mt-2" size={16} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {fullHistory.length > 0 && (
        <div className="border-t border-beige-200 pt-4">
          <h4 className="text-sm font-medium text-earth-700 mb-3">Status History</h4>
          <div className="space-y-2">
            {fullHistory.map((h, i) => {
              const stepConfig = STATUS_STEPS.find(s => s.key === h.status);
              const Icon = stepConfig?.icon || HiClock;
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${stepConfig?.bg || 'bg-beige-200'}`} />
                  <span className="capitalize text-earth-700 font-medium">{h.status}</span>
                  {h.note && <span className="text-earth-500">- {h.note}</span>}
                  <span className="text-xs text-earth-400 ml-auto">
                    {formatTimestamp(h.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
