import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiBell, HiUser, HiLogout, HiCheckCircle, HiExclamationCircle,
  HiX, HiSparkles, HiTranslate,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { getUserNotifications, getUnreadCount, markAllNotificationsRead } from '../../services/notificationsService';
import { useTranslation } from '../../hooks/useTranslation';
import { LANGUAGES } from '../../i18n';

const typeConfig = {
  welcome: { icon: HiSparkles, color: 'text-forest-500 bg-forest-50' },
  new_report: { icon: HiExclamationCircle, color: 'text-orange-500 bg-orange-50' },
  status: { icon: HiCheckCircle, color: 'text-blue-500 bg-blue-50' },
};

function timeAgo(date) {
  if (!date?.seconds) return '';
  const diff = Date.now() - date.seconds * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardHeader() {
  const { user, userData, logout, isOfficer, isAdmin } = useAuth();
  const { t, currentLang, switchLanguage } = useTranslation();
  const showGamification = !isOfficer && !isAdmin;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserNotifications(user.uid).then(setNotifications);
    getUnreadCount(user.uid).then(setUnreadCount);
    const interval = setInterval(() => {
      getUserNotifications(user.uid).then(setNotifications);
      getUnreadCount(user.uid).then(setUnreadCount);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpen = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0) {
      markAllNotificationsRead(user.uid);
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="h-16 md:h-20 bg-white border-b border-beige-100 flex items-center justify-end px-4 md:px-8 gap-2">
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="p-2 text-earth-500 hover:text-forest-600 hover:bg-beige-50 rounded-xl transition-all"
          title="Language"
        >
          <HiTranslate size={20} />
        </button>
        {langOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-card border border-beige-100 py-1 z-50">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { switchLanguage(l.code); setLangOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 w-full text-left text-sm hover:bg-beige-50 transition-colors ${
                  currentLang === l.code ? 'text-forest-700 font-medium bg-forest-50' : 'text-earth-600'
                }`}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={notifRef}>
        <button
          onClick={handleOpen}
          className="relative p-2 text-earth-500 hover:text-forest-600 hover:bg-beige-50 rounded-xl transition-all"
        >
          <HiBell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-forest-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card border border-beige-100 overflow-hidden z-50">
            <div className="p-4 border-b border-beige-100 flex items-center justify-between">
              <h3 className="font-display text-lg text-forest-800">Notifications</h3>
              <button onClick={() => setNotifOpen(false)} className="text-earth-400 hover:text-earth-600"><HiX size={16} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <HiBell className="mx-auto text-beige-300 mb-2" size={32} />
                  <p className="text-earth-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = typeConfig[n.type] || { icon: HiExclamationCircle, color: 'text-earth-500 bg-beige-50' };
                  return (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-beige-50 hover:bg-beige-50 transition-colors cursor-pointer ${!n.read ? 'bg-forest-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-xl ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
                          <cfg.icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-earth-800">{n.title}</p>
                          <p className="text-xs text-earth-600 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-earth-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-forest-500 shrink-0 mt-2" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-beige-50 transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-nature-gradient flex items-center justify-center text-white font-medium text-sm overflow-hidden">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover" />
            ) : (
              userData?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-forest-800 truncate max-w-[120px]">{userData?.name || 'User'}</p>
            {showGamification && <p className="text-xs text-earth-500">{userData?.points || 0} pts</p>}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card border border-beige-100 py-2 z-50">
            <button onClick={() => { setDropdownOpen(false); navigate('/dashboard/profile'); }} className="flex items-center gap-3 px-4 py-3 text-earth-700 hover:bg-beige-50 w-full text-left font-medium">
              <HiUser size={18} /> Profile
            </button>
            <button onClick={() => { setDropdownOpen(false); navigate('/dashboard/my-reports'); }} className="flex items-center gap-3 px-4 py-3 text-earth-700 hover:bg-beige-50 w-full text-left font-medium">
              <HiCheckCircle size={18} /> My Reports
            </button>
            <hr className="my-2 border-beige-100" />
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 w-full text-left font-medium">
              <HiLogout size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
