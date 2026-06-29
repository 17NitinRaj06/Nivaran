const badgeLevels = [
  { badges: [],               emoji: '',     gradient: 'bg-nature-gradient', label: '' },
  { badges: ['First Responder'],   emoji: '🌱', gradient: 'bg-gradient-to-br from-sage-300 to-forest-400', label: 'First Responder' },
  { badges: ['Community Watcher'], emoji: '👁️', gradient: 'bg-gradient-to-br from-sage-400 to-forest-500', label: 'Community Watcher' },
  { badges: ['Neighborhood Hero'], emoji: '🛡️', gradient: 'bg-gradient-to-br from-forest-400 to-forest-600', label: 'Neighborhood Hero' },
  { badges: ['Civic Champion'],    emoji: '🏆', gradient: 'bg-gradient-to-br from-amber-400 to-forest-600', label: 'Civic Champion' },
];

const badgeOrder = ['Civic Champion', 'Neighborhood Hero', 'Community Watcher', 'First Responder'];

export function getBadgeAvatar(badges = []) {
  const level = badgeOrder.find((b) => badges.includes(b));
  const match = badgeLevels.find((b) => b.badges.includes(level)) || badgeLevels[0];
  return {
    emoji: match.emoji,
    gradient: match.gradient,
    label: match.label,
  };
}
