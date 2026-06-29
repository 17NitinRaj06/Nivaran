import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiDocumentReport, HiPlus, HiExternalLink } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { getReports } from '../services/firestoreService';
import FeedCard from '../components/dashboard/FeedCard';

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchReports = () => {
    if (!user) return;
    setFetchError(false);
    setLoading(true);
    getReports({ userId: user.uid, limit: 50 })
      .then(setReports)
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [user]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-forest-800">My Reports</h1>
          <p className="text-earth-600 mt-1">Track all the issues you've reported.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/tracking" className="btn-secondary flex items-center gap-2">
            <HiExternalLink size={18} />
            Track Complaints
          </Link>
          <Link to="/dashboard/report" className="btn-primary flex items-center gap-2">
            <HiPlus size={18} />
            New Report
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-sage-300 border-t-forest-600 rounded-full animate-spin" />
        </div>
      ) : fetchError ? (
        <div className="text-center py-20">
          <p className="text-lg text-red-500 mb-2">Could not load reports.</p>
          <p className="text-earth-500">Try refreshing the page.</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <HiDocumentReport className="mx-auto text-beige-300 mb-4" size={48} />
          <p className="text-lg text-earth-500 mb-4">You haven't reported any issues yet.</p>
          <Link to="/dashboard/report" className="btn-primary">Report Your First Issue</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <FeedCard report={report} showOwnerControls onDelete={fetchReports} />
              <button
                onClick={() => navigate(`/dashboard/tracking/${report.id}`)}
                className="absolute bottom-4 right-4 text-xs text-forest-600 hover:text-forest-800 font-medium flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm"
              >
                <HiExternalLink size={12} />
                Track
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
