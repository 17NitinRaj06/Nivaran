import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiStar,
  HiBadgeCheck,
  HiDocumentReport,
  HiTrendingUp,
  HiCamera,
  HiTrash,
  HiExclamationCircle,
  HiX,
} from 'react-icons/hi';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getReports, updateUserProfile, deleteUserAccount } from '../services/firestoreService';
import { getBadgeAvatar } from '../utils/badgeAvatar';

const badgeInfo = {
  'First Responder': { icon: '🌱', desc: 'Report your first issue', requirement: '1 report' },
  'Community Watcher': { icon: '👁️', desc: 'Report 5 issues', requirement: '5 reports' },
  'Neighborhood Hero': { icon: '🛡️', desc: 'Report 15 issues', requirement: '15 reports' },
  'Civic Champion': { icon: '🏆', desc: 'Report 30 issues', requirement: '30 reports' },
};

export default function Profile() {
  const { user, userData, refreshUserData, logout, isOfficer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const showGamification = !isOfficer && !isAdmin;
  const [reportCount, setReportCount] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const photoRef = useRef(null);

  useEffect(() => {
    if (!userData?.id) return;
    getReports({ userId: userData.id, limit: 100 })
      .then((r) => setReportCount(r.length))
      .catch(console.error);
  }, [userData]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'nivaran/profiles');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      await updateUserProfile(user.uid, { photoURL: url });
      await refreshUserData();
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Could not upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateUserProfile(user.uid, { photoURL: '' });
      await refreshUserData();
      toast.success('Profile picture removed');
    } catch {
      toast.error('Could not remove photo');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteUserAccount(user.uid);
      await deleteUser(user);
      toast.success('Account deleted successfully');
      setDeleteModal(false);
      await logout();
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (err.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in, then try again');
      } else {
        toast.error(err.message || 'Failed to delete account');
      }
    } finally {
      setDeleting(false);
    }
  };

  const points = userData?.points || 0;
  const badges = userData?.badges || [];
  const avatar = getBadgeAvatar(badges);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 text-center"
      >
        <div className="relative w-24 h-24 mx-auto mb-4 group">
          <button
            onClick={() => photoRef.current?.click()}
            className={`w-24 h-24 rounded-full overflow-hidden ${avatar.gradient} flex items-center justify-center text-4xl shadow-lg relative`}
            disabled={uploadingPhoto}
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              avatar.emoji || (userData?.name || 'U').charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              {uploadingPhoto ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiCamera size={22} className="text-white" />
              )}
            </div>
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {userData?.photoURL && (
            <button
              onClick={handleRemovePhoto}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
              title="Remove profile picture"
            >
              <HiTrash size={14} />
            </button>
          )}
          {avatar.label && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium bg-white px-2 py-0.5 rounded-full shadow-sm text-forest-600">
              {avatar.label}
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl text-forest-800 mb-1">
          {userData?.name || 'User'}
        </h1>
        <p className="text-earth-500 mb-6">{userData?.email}</p>

        {showGamification && (
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-forest-700">{points}</p>
              <p className="text-sm text-earth-500">Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-forest-700">{badges.length}</p>
              <p className="text-sm text-earth-500">Badges</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-forest-700">{reportCount}</p>
              <p className="text-sm text-earth-500">Reports</p>
            </div>
          </div>
        )}
      </motion.div>

      {showGamification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <h2 className="font-display text-2xl text-forest-800 mb-6 flex items-center gap-2">
            <HiBadgeCheck className="text-forest-500" />
            Badges & Achievements
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(badgeInfo).map(([name, info]) => {
              const earned = badges.includes(name);
              return (
                <div
                  key={name}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    earned
                      ? 'border-forest-200 bg-forest-50'
                      : 'border-beige-200 bg-beige-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <p className="font-medium text-forest-800">{name}</p>
                      <p className="text-xs text-earth-500">{info.desc}</p>
                    </div>
                    {earned && (
                      <span className="ml-auto text-sage-600 text-xs font-medium bg-sage-100 px-2 py-0.5 rounded-full">
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-earth-400">
                    Requirement: {info.requirement}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {showGamification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8"
        >
          <h2 className="font-display text-2xl text-forest-800 mb-4 flex items-center gap-2">
            <HiTrendingUp className="text-forest-500" />
            Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Points', value: points, icon: HiStar },
              { label: 'Badges Earned', value: badges.length, icon: HiBadgeCheck },
              { label: 'Reports Filed', value: reportCount, icon: HiDocumentReport },
              { label: 'Impact Score', value: points + reportCount * 10, icon: HiTrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-beige-50 rounded-xl">
                <stat.icon className="mx-auto text-forest-500 mb-2" size={24} />
                <p className="text-2xl font-bold text-forest-800">{stat.value}</p>
                <p className="text-xs text-earth-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-8 border-red-200 border-2"
        >
          <h2 className="font-display text-2xl text-red-700 mb-4 flex items-center gap-2">
            <HiExclamationCircle className="text-red-500" />
            Danger Zone
          </h2>
          <p className="text-earth-600 text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <HiTrash size={16} />
            Delete Account
          </button>
        </motion.div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-red-700 flex items-center gap-2">
                <HiExclamationCircle size={22} />
                Delete Account
              </h3>
              <button onClick={() => { setDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }} className="text-earth-400 hover:text-earth-600">
                <HiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
                This will permanently delete your account, all your reports, and all associated data. You cannot undo this.
              </div>
              <div>
                <label className="block text-sm text-earth-700 mb-1">Type <span className="font-bold text-red-600">DELETE</span> to confirm</label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="input-field" placeholder="Type DELETE" />
              </div>
              <div>
                <label className="block text-sm text-earth-700 mb-1">Enter your password</label>
                <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} className="input-field" placeholder="Your password" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword} className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                  {deleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</> : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
