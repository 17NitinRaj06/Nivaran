import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HiDatabase, HiDocument, HiSearch, HiPlus, HiX, HiTrash,
  HiCheck, HiPencil, HiChevronLeft, HiChevronRight, HiExclamationCircle,
  HiRefresh, HiFilter, HiCollection,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { SkeletonLoader } from '../../components/skeletons/LoadingSkeleton';

const COLLECTIONS = ['reports', 'users'];

export default function AdminDatabase() {
  const { user } = useAuth();
  const [collection, setCollection] = useState('reports');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastId, setLastId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getToken = useCallback(async () => {
    if (!user) return '';
    try { return await user.getIdToken(); } catch { return ''; }
  }, [user]);

  const fetchDocs = useCallback(async (append = false) => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ limit: '30' });
      if (append && lastId) params.set('startAfter', lastId);
      const res = await fetch(`/api/admin/db/${collection}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDocs(prev => append ? [...prev, ...data.docs] : data.docs);
      setHasMore(data.hasMore);
      setLastId(data.lastId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [collection, getToken, lastId]);

  useEffect(() => {
    setDocs([]);
    setLastId(null);
    setHasMore(false);
    setSelectedDoc(null);
    fetchDocs();
  }, [collection]);

  const fetchDoc = async (id) => {
    setDocLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/db/${collection}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch document');
      const data = await res.json();
      setSelectedDoc(data);
      setEditData(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDocLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData || !selectedDoc) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/db/${collection}/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }
      const updated = await res.json();
      setSelectedDoc(updated);
      setEditData(null);
      setDocs(prev => prev.map(d => d.id === updated.id ? updated : d));
      toast.success('Document updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || deleteConfirm !== selectedDoc?.id) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/db/${collection}/${selectedDoc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      toast.success('Document deleted');
      setSelectedDoc(null);
      setDeleteConfirm(null);
      setDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredDocs = docs.filter(d => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return Object.values(d).some(v =>
      String(v).toLowerCase().includes(term)
    );
  });

  const formatValue = (val) => {
    if (val === null || val === undefined) return <span className="text-earth-300 italic">null</span>;
    if (typeof val === 'boolean') return <span className={val ? 'text-green-600' : 'text-red-500'}>{String(val)}</span>;
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + (JSON.stringify(val).length > 60 ? '...' : '');
    return String(val).slice(0, 80);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-forest-800 flex items-center gap-3">
            <HiDatabase className="text-forest-500" />
            Database Manager
          </h1>
          <p className="text-earth-600 mt-1">Direct read/write access to Firestore collections</p>
        </div>
        <button onClick={() => fetchDocs()} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
          <HiRefresh size={16} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 border-b border-beige-200 pb-3">
        {COLLECTIONS.map(c => (
          <button
            key={c}
            onClick={() => setCollection(c)}
            className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              collection === c ? 'bg-forest-600 text-white shadow' : 'bg-beige-50 text-earth-600 hover:bg-beige-100'
            }`}
          >
            <HiCollection size={16} className="inline mr-1.5" />
            {c}
          </button>
        ))}
        <div className="relative ml-auto">
          <HiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search all fields..." className="input-field pl-9 py-2 text-sm w-64"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="p-6"><SkeletonLoader type="table" /></div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-8 text-center"><p className="text-earth-500">No documents found</p></div>
          ) : (
            <div className="divide-y divide-beige-100 max-h-[70vh] overflow-y-auto">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => fetchDoc(doc.id)}
                  className={`p-3 hover:bg-beige-50 cursor-pointer transition-colors ${
                    selectedDoc?.id === doc.id ? 'bg-forest-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <HiDocument size={14} className="text-earth-400 shrink-0" />
                    <span className="text-xs font-mono text-forest-600 truncate">{doc.id}</span>
                  </div>
                  <div className="text-xs text-earth-500 space-y-0.5 ml-6">
                    {doc.userName && <span className="block truncate">{doc.userName}</span>}
                    {doc.email && <span className="block truncate">{doc.email}</span>}
                    {doc.description && <span className="block truncate">{doc.description?.slice(0, 60)}</span>}
                    {!doc.userName && !doc.email && !doc.description && <span className="text-earth-300 italic">No preview</span>}
                  </div>
                  <div className="flex gap-2 mt-1 ml-6">
                    {doc.status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                        doc.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        doc.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                        doc.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                        doc.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{doc.status}</span>
                    )}
                    {doc.role && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-beige-100 text-earth-600 capitalize">{doc.role}</span>
                    )}
                  </div>
                </div>
              ))}
              {hasMore && (
                <button
                  onClick={() => fetchDocs(true)}
                  className="w-full py-3 text-sm text-forest-600 hover:bg-beige-50 font-medium"
                >Load more</button>
              )}
            </div>
          )}
        </div>

        <div className="card p-0 overflow-hidden">
          {!selectedDoc ? (
            <div className="p-8 text-center text-earth-400">
              <HiDocument size={40} className="mx-auto mb-3 text-beige-300" />
              <p>Select a document to view details</p>
            </div>
          ) : docLoading ? (
            <div className="p-6"><SkeletonLoader type="page" /></div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-beige-100 p-4 flex items-center justify-between z-10">
                <h3 className="font-display text-base text-forest-700 truncate max-w-[200px]">
                  {selectedDoc.id}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditData(editData ? null : JSON.parse(JSON.stringify(selectedDoc)))}
                    className={`p-1.5 rounded-lg text-sm transition-all ${
                      editData ? 'bg-forest-100 text-forest-700' : 'text-earth-500 hover:bg-beige-50'
                    }`}
                    title="Edit"
                  ><HiPencil size={16} /></button>
                  <button
                    onClick={() => setDeleteConfirm(deleteConfirm === selectedDoc.id ? null : selectedDoc.id)}
                    className={`p-1.5 rounded-lg text-sm transition-all ${
                      deleteConfirm === selectedDoc.id ? 'bg-red-100 text-red-600' : 'text-red-500 hover:bg-red-50'
                    }`}
                    title="Delete"
                  ><HiTrash size={16} /></button>
                </div>
              </div>

              {deleteConfirm === selectedDoc.id && (
                <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 mb-2">Permanently delete this document?</p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} disabled={saving} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      {saving ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-xs px-4 py-1.5">Cancel</button>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                {Object.entries(editData || selectedDoc).map(([key, value]) => {
                  if (key === 'id') return null;
                  const isEditing = editData && key in editData;
                  const isLong = typeof value === 'string' && value.length > 60;
                  const isArray = Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date));

                  return (
                    <div key={key} className="border-b border-beige-50 pb-2 last:border-0">
                      <label className="block text-[10px] uppercase text-earth-400 font-medium mb-0.5 font-mono">{key}</label>
                      {isEditing ? (
                        isArray ? (
                          <textarea
                            value={JSON.stringify(value, null, 2)}
                            onChange={e => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setEditData(prev => ({ ...prev, [key]: parsed }));
                              } catch { /* invalid JSON, keep as string */ }
                            }}
                            className="input-field text-xs font-mono py-1 min-h-[60px]"
                          />
                        ) : (
                          <input
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={value ?? ''}
                            onChange={e => setEditData(prev => ({
                              ...prev,
                              [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value,
                            }))}
                            className="input-field text-xs py-1"
                          />
                        )
                      ) : (
                        <p className={`text-sm text-earth-700 ${isLong ? 'line-clamp-2' : ''}`}>
                          {formatValue(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {editData && (
                <div className="sticky bottom-0 bg-white border-t border-beige-100 p-4 flex gap-3">
                  <button onClick={() => setEditData(null)} className="btn-ghost flex-1 text-sm py-2">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><HiCheck size={16} /> Save</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
