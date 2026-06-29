import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  HiExclamationCircle,
  HiCheckCircle,
  HiClock,
  HiTrendingUp,
} from 'react-icons/hi';
import FeedCard from '../components/dashboard/FeedCard';
import FilterBar from '../components/dashboard/FilterBar';
import { useAuth } from '../context/AuthContext';
import { getReports } from '../services/firestoreService';
import { useTranslation } from '../hooks/useTranslation';
import { SkeletonLoader } from '../components/skeletons/LoadingSkeleton';

const EnhancedMapView = lazy(() => import('../components/map/EnhancedMapView'));

const analyticsCards = [
  { labelKey: 'dashboard.totalReports', key: 'total', icon: HiExclamationCircle, color: 'text-forest-600 bg-forest-50' },
  { labelKey: 'dashboard.resolved', key: 'resolved', icon: HiCheckCircle, color: 'text-sage-600 bg-sage-50' },
  { labelKey: 'dashboard.inProgress', key: 'inProgress', icon: HiClock, color: 'text-beige-600 bg-beige-50' },
  { labelKey: 'dashboard.resolutionRate', key: 'rate', icon: HiTrendingUp, color: 'text-earth-600 bg-earth-50' },
];

const INITIAL_LIMIT = 20;

export default function Dashboard() {
  const { userData } = useAuth();
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [view, setView] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [analytics, setAnalytics] = useState({
    total: 0, resolved: 0, inProgress: 0, rate: 0,
  });
  useEffect(() => {
    let cancelled = false;
    getReports({ limit: INITIAL_LIMIT })
      .then((data) => {
        setReports(data);
        setFilteredReports(data);
        const resolved = data.filter((r) => r.status === 'resolved').length;
        const inProgress = data.filter(
          (r) => r.status === 'verified' || r.status === 'assigned'
        ).length;
        setAnalytics({
          total: data.length,
          resolved,
          inProgress,
          rate: data.length > 0 ? Math.round((resolved / data.length) * 100) : 0,
        });
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleFilter = (filtered) => setFilteredReports(filtered);
  const handleUpvote = () => getReports({ limit: INITIAL_LIMIT }).then(setReports).catch(console.error);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-forest-800">
          {t('dashboard.welcome')}, {userData?.name?.split(' ')[0] || 'Community Member'}
        </h1>
        <p className="text-earth-600 mt-1">Here's what's happening in your community.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card glass card-glass"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              <span className="text-2xl font-bold text-forest-800">
                {card.key === 'rate' ? `${analytics[card.key]}%` : analytics[card.key]}
              </span>
            </div>
            <p className="text-earth-500 text-sm font-medium">{t(card.labelKey)}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4 border-b border-beige-200 pb-4">
        <button
          onClick={() => { setView('feed'); setMapReady(false); }}
          className={`px-5 py-2 rounded-xl font-medium transition-all ${
            view === 'feed' ? 'bg-forest-600 text-white' : 'text-earth-600 hover:bg-beige-50'
          }`}
        >
          {t('dashboard.feedView')}
        </button>
        <button
          onClick={() => { setView('map'); setMapReady(true); }}
          className={`px-5 py-2 rounded-xl font-medium transition-all ${
            view === 'map' ? 'bg-forest-600 text-white' : 'text-earth-600 hover:bg-beige-50'
          }`}
        >
          {t('dashboard.mapView')}
        </button>
      </div>

      <FilterBar reports={reports} onFilter={handleFilter} />

      {loading ? (
        <SkeletonLoader type="card" count={6} />
      ) : view === 'feed' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-earth-500 text-lg">{t('dashboard.noReports')}</p>
            </div>
          ) : (
            filteredReports.slice(0, INITIAL_LIMIT).map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <FeedCard report={report} onUpvote={handleUpvote} />
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="h-[600px] rounded-2xl overflow-hidden shadow-card">
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-sage-300 border-t-forest-600 rounded-full animate-spin" /></div>}>
            {mapReady && (
              <EnhancedMapView
                reports={filteredReports}
                showHeatmap={true}
                height="600px"
              />
            )}
          </Suspense>
        </div>
      )}
    </div>
  );
}
