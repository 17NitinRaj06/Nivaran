import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiTrophy } from 'react-icons/hi2';
import { HiStar, HiBadgeCheck } from 'react-icons/hi';
import { getLeaderboard } from '../services/firestoreService';

const rankColors = [
  'bg-yellow-100 text-yellow-700 border-yellow-300',
  'bg-gray-100 text-gray-600 border-gray-300',
  'bg-orange-100 text-orange-700 border-orange-300',
  'bg-beige-50 text-earth-600 border-beige-200',
  'bg-beige-50 text-earth-600 border-beige-200',
];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(50)
      .then(setLeaders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-nature-gradient flex items-center justify-center">
          <HiTrophy className="text-white" size={32} />
        </div>
        <h1 className="font-display text-3xl text-forest-800 mb-2">
          Community Leaderboard
        </h1>
        <p className="text-earth-600">
          Top contributors making a difference in their neighborhoods.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-sage-300 border-t-forest-600 rounded-full animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-earth-500 text-lg">No contributors yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, i) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card flex items-center gap-4 p-4 ${
                i < 3 ? 'ring-2 ring-forest-200' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border-2 shrink-0 ${
                  rankColors[i] || rankColors[4]
                }`}
              >
                {i + 1}
              </div>

              <div className="w-12 h-12 rounded-full bg-nature-gradient flex items-center justify-center text-white font-bold text-lg shrink-0">
                {(leader.name || 'A').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-forest-800 truncate">
                    {leader.name || 'Anonymous'}
                  </p>
                  {leader.badges?.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {leader.badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge}
                          className="text-xs"
                          title={badge}
                        >
                          {badge === 'First Responder' && '🌱'}
                          {badge === 'Community Watcher' && '👁️'}
                          {badge === 'Neighborhood Hero' && '🛡️'}
                          {badge === 'Civic Champion' && '🏆'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-earth-400">
                  {leader.reportsCount || 0} reports filed
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-forest-700">
                  {leader.points || 0}
                </p>
                <p className="text-xs text-earth-400">points</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
