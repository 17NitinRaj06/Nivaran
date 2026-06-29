import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HiShieldCheck, HiCheckCircle, HiClock, HiExclamationCircle,
  HiSearch, HiUserGroup, HiLocationMarker, HiCheck, HiX, HiPhotograph, HiUpload,
  HiSparkles, HiLightBulb, HiVideoCamera, HiChip,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getReports } from '../../services/firestoreService';
import TrackingTimeline from '../../components/tracking/TrackingTimeline';
import { SkeletonLoader } from '../../components/skeletons/LoadingSkeleton';

const STATUS_ORDER = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];

export default function OfficerDashboard() {
  const { user, userData } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [assignModal, setAssignModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [resolvedImageURL, setResolvedImageURL] = useState('');
  const [resolvedImageFile, setResolvedImageFile] = useState(null);
  const [resolvedImagePreview, setResolvedImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [assignTo, setAssignTo] = useState('');
  const [assignDept, setAssignDept] = useState('');
  const [aiResolution, setAiResolution] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAssignment, setAiAssignment] = useState(null);
  const [aiAssignLoading, setAiAssignLoading] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = () => {
    getReports({ limit: 100 })
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const filteredReports = useMemo(() => {
    let filtered = [...reports];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.description?.toLowerCase().includes(term) ||
        r.area?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term) ||
        r.id?.toLowerCase().includes(term)
      );
    }
    if (statusTab !== 'all') filtered = filtered.filter(r => r.status === statusTab);
    return filtered;
  }, [reports, searchTerm, statusTab]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    assigned: reports.filter(r => r.status === 'assigned').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }), [reports]);

  const callOfficerApi = async (reportId, action, body = {}) => {
    try {
      const token = await user.getIdToken();
      const endpoint = action === 'verify' ? 'verify'
        : action === 'assign' ? 'assign'
        : 'officer-resolve';
      const res = await fetch(`/api/reports/${reportId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Action failed');
      }
      return true;
    } catch (err) {
      throw err;
    }
  };

  const handleVerify = async (reportId) => {
    try {
      await callOfficerApi(reportId, 'verify');
      toast.success('Report verified successfully');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'verified' } : r));
      setSelectedReport(prev => prev?.id === reportId ? { ...prev, status: 'verified' } : prev);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssign = async () => {
    if (!assignTo.trim() || !assignDept.trim()) {
      toast.error('Please fill in both officer name and department');
      return;
    }
    try {
      await callOfficerApi(selectedReport.id, 'assign', { assignedTo: assignTo, assignedDepartment: assignDept });
      toast.success('Report assigned successfully');
      setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: 'assigned', assignedTo: assignTo, assignedDepartment: assignDept } : r));
      setSelectedReport(prev => prev?.id === selectedReport.id ? { ...prev, status: 'assigned', assignedTo: assignTo, assignedDepartment: assignDept } : prev);
      setAssignModal(false);
      setAssignTo('');
      setAssignDept('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setResolvedImageFile(file);
    setResolvedImagePreview(URL.createObjectURL(file));
    setResolvedImageURL('');
  };

  const handleResolve = async () => {
    try {
      let imgUrl = '';
      if (resolvedImageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', resolvedImageFile);
        formData.append('folder', 'nivaran/resolved');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const { url } = await uploadRes.json();
        imgUrl = url;
        setUploadingImage(false);
      }
      await callOfficerApi(selectedReport.id, 'resolve', { resolvedImageURL: imgUrl });
      toast.success('Report marked as resolved');
      setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: 'resolved', resolvedImageURL: imgUrl } : r));
      setSelectedReport(prev => prev?.id === selectedReport.id ? { ...prev, status: 'resolved', resolvedImageURL: imgUrl } : prev);
      setResolveModal(false);
      setResolvedImageURL('');
      setResolvedImageFile(null);
      setResolvedImagePreview('');
    } catch (err) {
      setUploadingImage(false);
      toast.error(err.message);
    }
  };

  const handleAutoAssign = async (reportId) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/agentic/auto-assign/${reportId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Auto-assign failed');
      const data = await res.json();
      toast.success(`Auto-assigned to ${data.department}`);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'assigned', assignedDepartment: data.department } : r));
      setSelectedReport(prev => prev?.id === reportId ? { ...prev, status: 'assigned', assignedDepartment: data.department } : prev);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAiSuggestions = async (reportId) => {
    setAiLoading(true);
    setAiResolution(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/agentic/suggestions/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      setAiResolution(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiAssignment = async (reportId) => {
    setAiAssignLoading(true);
    setAiAssignment(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/agentic/suggest-assignment/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      setAiAssignment(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAiAssignLoading(false);
    }
  };

  const clearResolvedImage = () => {
    setResolvedImageFile(null);
    setResolvedImagePreview('');
    setResolvedImageURL('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: HiExclamationCircle, color: 'text-forest-600 bg-forest-50' },
    { label: 'Pending', value: stats.pending, icon: HiClock, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Verified', value: stats.verified, icon: HiCheckCircle, color: 'text-blue-600 bg-blue-50' },
    { label: 'Assigned', value: stats.assigned, icon: HiUserGroup, color: 'text-purple-600 bg-purple-50' },
    { label: 'In Progress', value: stats.inProgress, icon: HiExclamationCircle, color: 'text-orange-600 bg-orange-50' },
    { label: 'Resolved', value: stats.resolved, icon: HiCheckCircle, color: 'text-green-600 bg-green-50' },
  ];

  if (loading) return <div className="space-y-6"><SkeletonLoader type="page" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-forest-800">Officer Dashboard</h1>
        <p className="text-earth-600 mt-1">Manage and resolve civic complaints</p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
            <div className={`w-8 h-8 rounded-xl ${card.color} flex items-center justify-center mb-2`}><card.icon size={16} /></div>
            <p className="text-xl font-bold text-forest-800">{card.value}</p>
            <p className="text-xs text-earth-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search complaints..." className="input-field pl-10 py-2 text-sm" />
        </div>
        <div className="flex gap-1 bg-beige-50 rounded-xl p-1">
          {['all', 'pending', 'verified', 'assigned', 'in-progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusTab === s ? 'bg-white text-forest-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'
              }`}
            >{s === 'all' ? 'All' : s.replace('-', ' ')}</button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card space-y-0 overflow-hidden">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12"><p className="text-earth-500">No complaints found</p></div>
            ) : (
              <div className="divide-y divide-beige-100">
                {filteredReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`p-4 hover:bg-beige-50 cursor-pointer transition-colors flex items-start gap-4 ${
                      selectedReport?.id === r.id ? 'bg-forest-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      r.status === 'resolved' ? 'bg-green-500' :
                      r.status === 'verified' ? 'bg-blue-500' :
                      r.status === 'assigned' ? 'bg-purple-500' :
                      r.status === 'in-progress' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-forest-800 truncate">{r.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-earth-400">
                        <span className="capitalize">{r.category}</span>
                        {r.area && <span>{r.area}</span>}
                        <span className="text-earth-300 font-mono">#{r.id?.slice(0, 6)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        r.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                        r.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                        r.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedReport && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-forest-700">Complaint #{selectedReport.id?.slice(0, 8)}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-earth-400 hover:text-earth-600"><HiX size={18} /></button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-earth-700">{selectedReport.description}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="capitalize px-2 py-0.5 rounded-full bg-beige-100 text-earth-600">{selectedReport.category}</span>
                <span className={`capitalize px-2 py-0.5 rounded-full ${
                  selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  selectedReport.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                  selectedReport.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                  selectedReport.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{selectedReport.status}</span>
              </div>
              <p className="text-earth-400">{selectedReport.area}, {selectedReport.city}, {selectedReport.state}</p>
              {selectedReport.assignedTo && (
                <p className="text-forest-600">Assigned to: {selectedReport.assignedTo} ({selectedReport.assignedDepartment})</p>
              )}
              {selectedReport.imageURL && (
                <img src={selectedReport.imageURL} alt="" className="w-full h-28 object-cover rounded-lg" />
              )}
              {selectedReport.videoURL && (
                <div>
                  <p className="text-xs font-medium text-earth-500 mb-1">Video Evidence</p>
                  <video src={selectedReport.videoURL} controls className="w-full h-28 object-cover rounded-lg" />
                </div>
              )}
            </div>

            <div className="border-t border-beige-200 pt-4">
              <TrackingTimeline
                currentStatus={selectedReport.status}
                statusHistory={selectedReport.statusHistory || []}
                createdAt={selectedReport.createdAt}
              />
            </div>

            <div className="border-t border-beige-200 pt-4 space-y-2">
              <p className="text-sm font-medium text-earth-700">Actions</p>
              <div className="flex flex-wrap gap-2">
                {selectedReport.status === 'pending' && (
                  <button onClick={() => handleVerify(selectedReport.id)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                    <HiCheck size={14} /> Verify
                  </button>
                )}
                {(selectedReport.status === 'pending' || selectedReport.status === 'verified') && (
                  <>
                    <button onClick={() => setAssignModal(true)} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
                      <HiUserGroup size={14} /> Assign
                    </button>
                    <button onClick={() => handleAutoAssign(selectedReport.id)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                      <HiChip size={14} /> Auto-Assign (AI)
                    </button>
                    <button onClick={() => handleAiAssignment(selectedReport.id)} className="text-xs px-4 py-2 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5 transition-all">
                      <HiSparkles size={14} /> AI Suggest
                    </button>
                  </>
                )}
                {(selectedReport.status === 'assigned' || selectedReport.status === 'in-progress') && (
                  <button onClick={() => { clearResolvedImage(); setResolveModal(true); }} className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                    <HiCheckCircle size={14} /> Mark Resolved
                  </button>
                )}
                {selectedReport.status === 'verified' && (
                  <button onClick={() => { clearResolvedImage(); setResolveModal(true); }} className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                    <HiCheckCircle size={14} /> Resolve Directly
                  </button>
                )}
                {selectedReport.status !== 'resolved' && (
                  <button onClick={() => handleAiSuggestions(selectedReport.id)} className="text-xs px-4 py-2 rounded-lg border border-forest-300 text-forest-700 hover:bg-forest-50 flex items-center gap-1.5 transition-all">
                    <HiLightBulb size={14} /> AI Resolution Plan
                  </button>
                )}
              </div>
            </div>

            {aiLoading && (
              <div className="border-t border-beige-200 pt-3">
                <div className="flex items-center gap-2 text-forest-600">
                  <HiSparkles className="animate-pulse" size={14} />
                  <span className="text-xs font-medium">Generating AI resolution plan...</span>
                  <div className="w-3 h-3 border-2 border-forest-600 border-t-transparent rounded-full animate-spin ml-auto" />
                </div>
              </div>
            )}

            {aiResolution && (
              <div className="border-t border-beige-200 pt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-forest-700">
                  <HiLightBulb size={14} />
                  <span className="text-xs font-semibold">AI Resolution Plan</span>
                </div>
                <div className="bg-sage-50 rounded-xl p-3 space-y-1.5 text-xs">
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Priority:</span> <span className={`capitalize ${aiResolution.priority === 'critical' ? 'text-red-600' : aiResolution.priority === 'high' ? 'text-orange-600' : 'text-earth-600'}`}>{aiResolution.priority}</span></p>
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Dept:</span> {aiResolution.requiredDepartment}</p>
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Est. time:</span> {aiResolution.estimatedResolutionTime}</p>
                  <div>
                    <p className="font-medium text-earth-700 mb-0.5">Steps:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-earth-600">
                      {aiResolution.steps?.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {aiAssignment && (
              <div className="border-t border-beige-200 pt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-purple-700">
                  <HiSparkles size={14} />
                  <span className="text-xs font-semibold">AI Assignment Suggestion</span>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 space-y-1 text-xs">
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Officer:</span> {aiAssignment.suggestedOfficer}</p>
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Dept:</span> {aiAssignment.department}</p>
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Priority:</span> {aiAssignment.priority}</p>
                  <p className="text-earth-600"><span className="font-medium text-earth-700">Deadline:</span> {aiAssignment.suggestedDeadline}</p>
                  <p className="text-earth-500 italic">{aiAssignment.reason}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { clearResolvedImage(); setResolveModal(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl text-forest-700 mb-4">Resolve Complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-earth-700 mb-2">Resolved Evidence Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-beige-300 rounded-xl p-4 text-center cursor-pointer hover:border-forest-400 transition-colors"
                >
                  {resolvedImagePreview ? (
                    <div className="relative">
                      <img src={resolvedImagePreview} alt="Resolved preview" className="w-full h-36 object-cover rounded-lg" />
                      <button onClick={(e) => { e.stopPropagation(); clearResolvedImage(); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow">
                        <HiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <HiUpload size={32} className="mx-auto text-earth-300 mb-2" />
                      <p className="text-sm text-earth-500 font-medium">Click to upload a photo</p>
                      <p className="text-xs text-earth-400 mt-1">JPEG, PNG, or WebP — max 5MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setResolveModal(false); clearResolvedImage(); }} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleResolve} disabled={uploadingImage} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {uploadingImage ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</> : 'Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl text-forest-700 mb-4">Assign Complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-earth-700 mb-1">Officer Name</label>
                <input type="text" value={assignTo} onChange={e => setAssignTo(e.target.value)} placeholder="e.g. Rajesh Kumar" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-earth-700 mb-1">Department</label>
                <select value={assignDept} onChange={e => setAssignDept(e.target.value)} className="input-field">
                  <option value="">Select department</option>
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="Public Works Dept">Public Works Dept</option>
                  <option value="Electricity Board">Electricity Board</option>
                  <option value="Water Supply Dept">Water Supply Dept</option>
                  <option value="Sanitation Dept">Sanitation Dept</option>
                  <option value="Traffic Police">Traffic Police</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAssignModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleAssign} className="btn-primary flex-1">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
