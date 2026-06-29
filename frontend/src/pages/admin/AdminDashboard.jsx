import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiDocumentReport, HiCheckCircle, HiClock, HiTrendingUp,
  HiSearch, HiFilter, HiChevronDown, HiX, HiUserGroup,
  HiExclamationCircle, HiCalendar, HiDownload,
} from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getReports } from '../../services/firestoreService';
import { SkeletonLoader } from '../../components/skeletons/LoadingSkeleton';
import TrackingTimeline from '../../components/tracking/TrackingTimeline';
import PredictiveInsights from './PredictiveInsights';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const COLORS = ['#2d6e34', '#689a50', '#bc9a61', '#eab308', '#f97316', '#ef4444', '#3b82f6', '#8b5cf6'];
const STATUS_ORDER = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];

export default function AdminDashboard() {
  const { user, userData } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    getReports({ limit: 200 })
      .then(data => {
        const enriched = data.map(r => ({
          ...r,
          date: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(),
        }));
        setReports(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = useMemo(() => {
    let filtered = [...reports];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.description?.toLowerCase().includes(term) ||
        r.area?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term) ||
        r.userName?.toLowerCase().includes(term) ||
        r.id?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(r => r.category === categoryFilter);
    return filtered;
  }, [reports, searchTerm, statusFilter, categoryFilter]);

  const analytics = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const pending = reports.filter(r => r.status === 'pending' || r.status === 'verified').length;
    const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'assigned').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const byCategory = {};
    reports.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });
    const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    const byDay = {};
    reports.forEach(r => {
      const day = r.date?.toISOString()?.slice(0, 10);
      if (day) {
        if (!byDay[day]) byDay[day] = { date: day, total: 0, resolved: 0, pending: 0 };
        byDay[day].total++;
        if (r.status === 'resolved') byDay[day].resolved++;
        else byDay[day].pending++;
      }
    });
    const trendData = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

    const byStatus = {};
    reports.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

    const uniqueUsers = new Set(reports.map(r => r.userId)).size;

    return { total, resolved, pending, inProgress, rate, categoryData, trendData, statusData, uniqueUsers };
  }, [reports]);

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, note: `Status updated to ${newStatus} by admin` }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Report marked as ${newStatus}`);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      setSelectedReport(prev => prev?.id === reportId ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const generatePDF = async () => {
    const toastId = toast.loading('Generating PDF...');
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Nivaran - Complaint Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
      doc.text(`Total Reports: ${analytics.total} | Resolved: ${analytics.resolved} | Pending: ${analytics.pending}`, 14, 36);

      const tableData = filteredReports.map(r => [
        r.id?.slice(0, 8) || 'N/A',
        r.category || 'N/A',
        r.status || 'N/A',
        r.area || 'N/A',
        r.city || 'N/A',
        r.userName || 'Anonymous',
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['ID', 'Category', 'Status', 'Area', 'City', 'Reporter']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [45, 110, 52] },
      });

      doc.save(`nivaran-report-${Date.now()}.pdf`);
      toast.dismiss(toastId);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.dismiss(toastId);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) return <div className="space-y-6"><SkeletonLoader type="page" /></div>;

  const overviewCards = [
    { label: 'Total Complaints', value: analytics.total, icon: HiDocumentReport, color: 'text-forest-600 bg-forest-50', trend: '+12%' },
    { label: 'Resolved', value: analytics.resolved, icon: HiCheckCircle, color: 'text-green-600 bg-green-50', trend: '+8%' },
    { label: 'Pending', value: analytics.pending, icon: HiClock, color: 'text-yellow-600 bg-yellow-50', trend: '-3%' },
    { label: 'Resolution Rate', value: `${analytics.rate}%`, icon: HiTrendingUp, color: 'text-blue-600 bg-blue-50', trend: '+5%' },
    { label: 'Active Users', value: analytics.uniqueUsers, icon: HiUserGroup, color: 'text-purple-600 bg-purple-50', trend: '' },
    { label: 'In Progress', value: analytics.inProgress, icon: HiExclamationCircle, color: 'text-orange-600 bg-orange-50', trend: '' },
  ];

  return (
    <div className={`space-y-6 ${darkMode ? 'dark' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-forest-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-earth-600 dark:text-earth-400 mt-1">Comprehensive overview of all civic complaints</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generatePDF} className="btn-secondary flex items-center gap-2 text-sm">
            <HiDownload size={16} /> Export PDF
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${darkMode ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600'}`}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {overviewCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} dark:opacity-80 flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              <span className="text-2xl font-bold text-forest-800 dark:text-white">{card.value}</span>
            </div>
            <p className="text-earth-500 dark:text-earth-400 text-sm font-medium">{card.label}</p>
            {card.trend && <span className="text-xs text-green-600 dark:text-green-400">{card.trend}</span>}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-beige-200 dark:border-gray-700 pb-3">
        {['overview', 'complaints', 'analytics', 'predictions'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              viewMode === mode ? 'bg-forest-600 text-white' : 'text-earth-600 dark:text-earth-400 hover:bg-beige-50 dark:hover:bg-gray-700'
            }`}
          >
            {mode === 'overview' ? 'Overview' : mode === 'complaints' ? 'Complaints' : mode === 'analytics' ? 'Analytics' : 'Predictions'}
          </button>
        ))}
      </div>

      {viewMode === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card dark:bg-gray-800 dark:border-gray-700">
            <h3 className="font-display text-lg text-forest-700 dark:text-white mb-4">Daily Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.trendData.slice(-30)}>
                <defs>
                  <linearGradient id="totalG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d6e34" stopOpacity={0.3}/><stop offset="95%" stopColor="#2d6e34" stopOpacity={0}/></linearGradient>
                  <linearGradient id="resolvedG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5) || ''} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#2d6e34" fill="url(#totalG)" name="Total" />
                <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#resolvedG)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card dark:bg-gray-800 dark:border-gray-700">
            <h3 className="font-display text-lg text-forest-700 dark:text-white mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={analytics.categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name }) => name}>
                  {analytics.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {viewMode === 'complaints' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
              <input
                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search complaints..." className="input-field pl-10 py-2.5 text-sm"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2.5 text-sm w-36">
              <option value="all">All Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field py-2.5 text-sm w-36">
              <option value="all">All Categories</option>
              {[...new Set(reports.map(r => r.category))].filter(Boolean).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <span className="text-xs text-earth-400">{filteredReports.length} results</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-beige-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-earth-500 font-medium">ID</th>
                      <th className="text-left py-3 px-2 text-earth-500 font-medium">Description</th>
                      <th className="text-left py-3 px-2 text-earth-500 font-medium">Category</th>
                      <th className="text-left py-3 px-2 text-earth-500 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-earth-500 font-medium">Location</th>
                      <th className="text-left py-3 px-2 text-earth-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.slice(0, 50).map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-beige-50 dark:border-gray-700 hover:bg-beige-50 dark:hover:bg-gray-700 cursor-pointer ${
                          selectedReport?.id === r.id ? 'bg-forest-50 dark:bg-gray-600' : ''
                        }`}
                        onClick={() => setSelectedReport(r)}
                      >
                        <td className="py-3 px-2 text-earth-400 font-mono text-xs">{r.id?.slice(0, 8)}</td>
                        <td className="py-3 px-2 text-earth-700 dark:text-earth-300 max-w-[200px] truncate">{r.description?.slice(0, 60)}</td>
                        <td className="py-3 px-2"><span className="capitalize px-2 py-0.5 rounded-full text-xs bg-beige-100 dark:bg-gray-600 text-earth-600 dark:text-earth-300">{r.category}</span></td>
                        <td className="py-3 px-2">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            r.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                            r.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                            r.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{r.status}</span>
                        </td>
                        <td className="py-3 px-2 text-earth-500 text-xs">{r.area || r.city || 'N/A'}</td>
                        <td className="py-3 px-2">
                          <select
                            value={r.status}
                            onChange={e => { e.stopPropagation(); handleStatusUpdate(r.id, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            className="text-xs px-2 py-1 rounded-lg border border-beige-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                          >
                            {STATUS_ORDER.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                          </select>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReport && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card dark:bg-gray-800 dark:border-gray-700 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-forest-700 dark:text-white">Complaint Details</h3>
                  <button onClick={() => setSelectedReport(null)} className="text-earth-400 hover:text-earth-600"><HiX size={18} /></button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-earth-500">ID</p>
                    <p className="text-sm text-earth-700 dark:text-earth-300 font-mono">{selectedReport.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-500">Reporter</p>
                    <p className="text-sm text-earth-700 dark:text-earth-300">{selectedReport.userName || 'Anonymous'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-500">Description</p>
                    <p className="text-sm text-earth-700 dark:text-earth-300">{selectedReport.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <p className="text-xs text-earth-500">Category</p>
                      <span className="capitalize text-sm font-medium text-forest-700 dark:text-forest-300">{selectedReport.category}</span>
                    </div>
                    <div>
                      <p className="text-xs text-earth-500">Status</p>
                      <span className="capitalize text-sm font-medium">{selectedReport.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-earth-500">Location</p>
                    <p className="text-sm text-earth-700 dark:text-earth-300">{selectedReport.area}, {selectedReport.city}, {selectedReport.state}</p>
                  </div>
                  {selectedReport.imageURL && (
                    <div>
                      <p className="text-xs text-earth-500 mb-1">Image</p>
                      <img src={selectedReport.imageURL} alt="" className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  )}
                  {selectedReport.videoURL && (
                    <div>
                      <p className="text-xs text-earth-500 mb-1">Video Evidence</p>
                      <video src={selectedReport.videoURL} controls className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  )}
                </div>

                <div className="border-t border-beige-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-earth-700 dark:text-earth-300 mb-3">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(selectedReport.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          selectedReport.status === s ? 'bg-forest-600 text-white' : 'bg-beige-50 dark:bg-gray-700 text-earth-600 dark:text-earth-300 hover:bg-beige-100'
                        }`}
                      >{s.replace('-', ' ')}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}

      {viewMode === 'analytics' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card dark:bg-gray-800 dark:border-gray-700">
            <h3 className="font-display text-lg text-forest-700 dark:text-white mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analytics.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card dark:bg-gray-800 dark:border-gray-700">
            <h3 className="font-display text-lg text-forest-700 dark:text-white mb-4">Weekly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trendData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5) || ''} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2d6e34" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} name="Resolved" />
                <Line type="monotone" dataKey="pending" stroke="#eab308" strokeWidth={2} dot={false} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {viewMode === 'predictions' && <PredictiveInsights />}
    </div>
  );
}
