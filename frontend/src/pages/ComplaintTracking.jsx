import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiLocationMarker, HiClock, HiArrowLeft, HiSearch,
  HiDocumentReport, HiExternalLink, HiClipboardCopy,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getReports } from '../services/firestoreService';
import TrackingTimeline from '../components/tracking/TrackingTimeline';
import { SkeletonLoader } from '../components/skeletons/LoadingSkeleton';

export default function ComplaintTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchId, setSearchId] = useState(id || '');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (id) {
      setSearchId(id);
      fetchReports();
    } else {
      fetchUserReports();
    }
  }, [id, user]);

  const fetchUserReports = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    try {
      const data = await getReports({ userId: user.uid, limit: 50 });
      setReports(data);
      if (data.length > 0 && !id) setSelectedReport(data[0]);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await getReports({ limit: 100 });
      setReports(data);
      const found = data.find(r => r.id === id || r.id?.startsWith(id));
      if (found) setSelectedReport(found);
      else toast.error('Complaint not found');
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchId.trim()) return;
    navigate(`/dashboard/tracking/${searchId.trim()}`);
  };

  const copyId = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copied!');
  };

  const handleRefresh = () => {
    if (selectedReport) {
      fetchReports();
    } else {
      fetchUserReports();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost flex items-center gap-2 text-sm mb-4">
          <HiArrowLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="font-display text-3xl text-forest-800">Complaint Tracking</h1>
        <p className="text-earth-600 mt-1">Track the real-time status of your complaints</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Complaint ID to track..."
            className="input-field pl-10 py-2.5 text-sm"
          />
        </div>
        <button onClick={handleSearch} className="btn-primary text-sm px-6">Track</button>
        <button onClick={handleRefresh} className="btn-secondary text-sm flex items-center gap-2">
          <HiClock size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : fetchError ? (
        <div className="text-center py-16 card">
          <HiDocumentReport className="mx-auto text-beige-300 mb-4" size={48} />
          <p className="text-earth-500 text-lg">Could not load tracking data</p>
          <button onClick={handleRefresh} className="btn-primary mt-4">Try Again</button>
        </div>
      ) : !id && reports.length === 0 ? (
        <div className="text-center py-16 card">
          <HiDocumentReport className="mx-auto text-beige-300 mb-4" size={48} />
          <p className="text-earth-500 text-lg mb-4">You haven't reported any complaints yet</p>
          <Link to="/dashboard/report" className="btn-primary">Report an Issue</Link>
        </div>
      ) : !selectedReport ? (
        <div className="text-center py-16 card">
          <p className="text-earth-500 text-lg">Enter a valid Complaint ID to track its status</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl text-forest-700">Complaint Details</h2>
                  <p className="text-xs text-earth-400 font-mono flex items-center gap-2 mt-1">
                    ID: {selectedReport.id}
                    <button onClick={() => copyId(selectedReport.id)} className="text-forest-500 hover:text-forest-700">
                      <HiClipboardCopy size={14} />
                    </button>
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                  selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  selectedReport.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                  selectedReport.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                  selectedReport.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{selectedReport.status}</span>
              </div>

              <div className="space-y-4">
                <p className="text-earth-700">{selectedReport.description}</p>

                {selectedReport.imageURL && (
                  <img src={selectedReport.imageURL} alt="" className="w-full max-h-64 object-cover rounded-xl" />
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-earth-400 text-xs">Category</p>
                    <p className="text-forest-700 font-medium capitalize">{selectedReport.category}</p>
                  </div>
                  <div>
                    <p className="text-earth-400 text-xs">Reporter</p>
                    <p className="text-forest-700 font-medium">{selectedReport.userName || 'Anonymous'}</p>
                  </div>
                  <div>
                    <p className="text-earth-400 text-xs">Location</p>
                    <p className="text-forest-700 font-medium">{selectedReport.area || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-earth-400 text-xs">Upvotes</p>
                    <p className="text-forest-700 font-medium">{selectedReport.upvotes || 0}</p>
                  </div>
                </div>

                {(selectedReport.assignedDepartment || selectedReport.assignedTo) && (
                  <div className="bg-beige-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-forest-700">Assigned To</p>
                    <p className="text-sm text-earth-600">
                      {selectedReport.assignedTo && `Officer: ${selectedReport.assignedTo}`}
                      {selectedReport.assignedDepartment && ` (${selectedReport.assignedDepartment})`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <TrackingTimeline
              currentStatus={selectedReport.status}
              statusHistory={selectedReport.statusHistory || []}
              createdAt={selectedReport.createdAt}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
