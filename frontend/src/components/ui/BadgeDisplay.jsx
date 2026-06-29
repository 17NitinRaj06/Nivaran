import { useState, useEffect } from 'react';
import { HiBadgeCheck } from 'react-icons/hi';
import { getUserData } from '../../services/firestoreService';

const badgeIcons = {
  'First Responder': '🌱',
  'Community Watcher': '👁️',
  'Neighborhood Hero': '🛡️',
  'Civic Champion': '🏆',
};

export default function BadgeDisplay({ userId, size = 'sm' }) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (!userId) return;
    getUserData(userId).then((data) => {
      if (data?.badges) setBadges(data.badges);
    });
  }, [userId]);

  if (badges.length === 0) return null;

  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1" title={badges.join(', ')}>
      {badges.slice(0, 2).map((badge) => (
        <span
          key={badge}
          className={`${sizeClass} ${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-beige-100 flex items-center justify-center`}
          title={badge}
        >
          {badgeIcons[badge] || '⭐'}
        </span>
      ))}
      {badges.length > 2 && (
        <span className={`${sizeClass} text-earth-400 font-medium`}>
          +{badges.length - 2}
        </span>
      )}
    </div>
  );
}
