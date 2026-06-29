import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiExclamationCircle,
  HiChartBar,
  HiUser,
  HiDocumentReport,
  HiLogout,
  HiMenuAlt2,
  HiX,
  HiShieldCheck,
  HiTranslate,
  HiLocationMarker,
  HiBadgeCheck,
  HiDatabase,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { LANGUAGES } from '../../i18n';

const commonLinks = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: HiHome },
  { to: '/dashboard/report', labelKey: 'nav.report', icon: HiExclamationCircle },
  { to: '/dashboard/my-reports', labelKey: 'nav.myReports', icon: HiDocumentReport },
  { to: '/dashboard/tracking', labelKey: 'nav.tracking', icon: HiLocationMarker },
  { to: '/dashboard/leaderboard', labelKey: 'nav.leaderboard', icon: HiChartBar },
  { to: '/dashboard/profile', labelKey: 'nav.profile', icon: HiUser },
];

const officerExcluded = ['/dashboard/report', '/dashboard/my-reports', '/dashboard/tracking', '/dashboard/leaderboard'];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { logout, user, userData, isOfficer, isAdmin } = useAuth();
  const { t, currentLang, switchLanguage } = useTranslation();
  const navigate = useNavigate();

  const filteredLinks = commonLinks.filter(l => !isOfficer || !officerExcluded.includes(l.to));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
      isActive
        ? 'bg-forest-50 text-forest-700'
        : 'text-earth-600 hover:bg-beige-50 hover:text-earth-800'
    }`;

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-xl shadow-soft"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <HiX size={20} /> : <HiMenuAlt2 size={20} />}
      </button>

      <AnimatePresence>
        {(collapsed || true) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed top-0 left-0 h-full w-64 bg-white border-r border-beige-100 z-40 hidden lg:flex flex-col"
          >
            <div className="p-6 border-b border-beige-100">
              <NavLink to="/dashboard" className="flex items-center gap-3 group">
                <img
                  src="/favicon_icon.png"
                  alt="Nivaran"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-forest-100"
                />
                <div>
                  <h2 className="font-display text-xl text-forest-800">Nivaran</h2>
                  <p className="text-xs text-earth-500">{t('app.tagline')}</p>
                </div>
              </NavLink>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dashboard'}
                  className={linkClass}
                >
                  <link.icon size={20} />
                  <span>{t(link.labelKey)}</span>
                </NavLink>
              ))}

              {isOfficer && (
                <NavLink to="/dashboard/officer" className={linkClass}>
                  <HiBadgeCheck size={20} />
                  <span>Officer Panel</span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/dashboard/admin" className={linkClass}>
                  <HiShieldCheck size={20} />
                  <span>{t('nav.admin')}</span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/dashboard/admin/database" className={linkClass}>
                  <HiDatabase size={20} />
                  <span>Database</span>
                </NavLink>
              )}
            </nav>

            <div className="p-4 border-t border-beige-100 space-y-2">
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-earth-500 hover:bg-beige-50 hover:text-earth-700 transition-all duration-200 w-full text-sm"
                >
                  <HiTranslate size={18} />
                  <span>{currentLang.toUpperCase()}</span>
                  <span className="ml-auto text-xs text-earth-400">{LANGUAGES.find(l => l.code === currentLang)?.nativeLabel}</span>
                </button>
                {langOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-card border border-beige-100 py-1 z-50">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { switchLanguage(l.code); setLangOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-2 w-full text-left text-sm hover:bg-beige-50 transition-colors ${
                          currentLang === l.code ? 'text-forest-700 font-medium bg-forest-50' : 'text-earth-600'
                        }`}
                      >
                        <span className="w-6 text-center">{l.code === 'en' ? '🇬🇧' : l.code === 'hi' ? '🇮🇳' : '🇧🇩'}</span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-earth-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
              >
                <HiLogout size={20} />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        className={`fixed top-0 left-0 h-full bg-white border-r border-beige-100 z-50 lg:hidden flex flex-col ${
          collapsed ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300`}
        style={{ width: '16rem' }}
      >
        <div className="p-6 border-b border-beige-100 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <img
              src="/favicon_icon.png"
              alt="Nivaran"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-forest-100"
            />
            <span className="font-display text-xl text-forest-800">Nivaran</span>
          </NavLink>
          <button onClick={() => setCollapsed(false)} className="p-1 text-earth-500 hover:text-earth-700">
            <HiX size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              onClick={() => setCollapsed(false)}
              className={linkClass}
            >
              <link.icon size={20} />
              <span>{t(link.labelKey)}</span>
            </NavLink>
          ))}
          {isOfficer && (
            <NavLink to="/dashboard/officer" onClick={() => setCollapsed(false)} className={linkClass}>
              <HiBadgeCheck size={20} />
              <span>Officer Panel</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/dashboard/admin" onClick={() => setCollapsed(false)} className={linkClass}>
              <HiShieldCheck size={20} />
              <span>{t('nav.admin')}</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/dashboard/admin/database" onClick={() => setCollapsed(false)} className={linkClass}>
              <HiDatabase size={20} />
              <span>Database</span>
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-beige-100 space-y-2">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-earth-500 hover:bg-beige-50 w-full text-sm"
          >
            <HiTranslate size={18} />
            <span>{currentLang.toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="space-y-1">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { switchLanguage(l.code); setLangOpen(false); setCollapsed(false); }}
                  className={`flex items-center gap-3 px-4 py-2 w-full text-left text-sm rounded-lg ${
                    currentLang === l.code ? 'text-forest-700 font-medium bg-forest-50' : 'text-earth-600 hover:bg-beige-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-earth-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
          >
            <HiLogout size={20} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
