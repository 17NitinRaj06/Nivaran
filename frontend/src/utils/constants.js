export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'streetlight', label: 'Streetlight', icon: '💡' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'drainage', label: 'Drainage', icon: '🌊' },
  { value: 'water', label: 'Water', icon: '🚰' },
  { value: 'road', label: 'Road', icon: '🛣️' },
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '📌' },
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'verified', label: 'Verified', color: 'text-blue-600 bg-blue-50' },
  { value: 'assigned', label: 'Assigned', color: 'text-purple-600 bg-purple-50' },
  { value: 'in-progress', label: 'In Progress', color: 'text-orange-600 bg-orange-50' },
  { value: 'resolved', label: 'Resolved', color: 'text-sage-600 bg-sage-50' },
];

export const STATUS_ORDER = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];

export const BADGES = {
  'First Responder': { icon: '🌱', desc: 'Report your first issue', minReports: 1 },
  'Community Watcher': { icon: '👁️', desc: 'Report 5 issues', minReports: 5 },
  'Neighborhood Hero': { icon: '🛡️', desc: 'Report 15 issues', minReports: 15 },
  'Civic Champion': { icon: '🏆', desc: 'Report 30 issues', minReports: 30 },
};

export const POINTS_PER_REPORT = 10;
export const POINTS_PER_RESOLUTION = 20;
export const POINTS_PER_UPVOTE_RECEIVED = 1;

export const DEFAULT_MAP_CENTER = [20.5937, 78.9629];
export const DEFAULT_MAP_ZOOM = 5;
