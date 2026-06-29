import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiMenuAlt3, HiX, HiTranslate } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { LANGUAGES } from '../../i18n';

const landingLinks = [
  { to: '/#about', labelKey: 'nav.about' },
  { to: '/#impact', labelKey: 'nav.impact' },
  { to: '/#awareness', labelKey: 'nav.awareness' },
  { to: '/dashboard/leaderboard', labelKey: 'nav.leaderboard' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { user } = useAuth();
  const { t, currentLang, switchLanguage } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const scrollToSection = (hash) => {
    if (location.pathname !== '/') {
      navigate('/' + hash);
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-soft' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/favicon_icon.png" alt="Nivaran" className="w-9 h-9 rounded-full ring-2 ring-forest-200" />
            <span className="font-display text-xl text-forest-800">Nivaran</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {landingLinks.map((link) => (
              link.to.startsWith('/#') ? (
                <button
                  key={link.to}
                  onClick={() => scrollToSection(link.to.substring(1))}
                  className="px-4 py-2 text-sm font-medium text-earth-600 hover:text-forest-700 hover:bg-beige-50 rounded-xl transition-all"
                >
                  {t(link.labelKey)}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-sm font-medium text-earth-600 hover:text-forest-700 hover:bg-beige-50 rounded-xl transition-all"
                >
                  {t(link.labelKey)}
                </Link>
              )
            ))}

            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm px-5 py-2">{t('nav.dashboard')}</Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-earth-600 hover:text-forest-700 hover:bg-beige-50 rounded-xl transition-all">{t('nav.signIn')}</Link>
                <Link to="/signup" className="btn-primary text-sm px-5 py-2">{t('nav.getStarted')}</Link>
              </>
            )}

            <div className="relative ml-2">
              <button onClick={() => setLangOpen(!langOpen)} className="p-2 text-earth-500 hover:text-forest-600 hover:bg-beige-50 rounded-xl transition-all">
                <HiTranslate size={18} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-card border border-beige-100 py-1 z-50">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { switchLanguage(l.code); setLangOpen(false); }}
                      className={`flex items-center gap-2 px-4 py-2 w-full text-left text-sm hover:bg-beige-50 ${currentLang === l.code ? 'text-forest-700 font-medium bg-forest-50' : 'text-earth-600'}`}
                    >{l.nativeLabel}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-earth-600 hover:text-forest-700">
            {open ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-beige-100 px-4 py-4 space-y-2">
          {landingLinks.map((link) => (
            link.to.startsWith('/#') ? (
              <button key={link.to} onClick={() => { scrollToSection(link.to.substring(1)); setOpen(false); }}
                className="block w-full text-left px-4 py-2 rounded-xl text-earth-600 hover:bg-beige-50 font-medium"
              >{t(link.labelKey)}</button>
            ) : (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-xl text-earth-600 hover:bg-beige-50 font-medium"
              >{t(link.labelKey)}</Link>
            )
          ))}
          <hr className="border-beige-100" />
          {user ? (
            <Link to="/dashboard" onClick={() => setOpen(false)}
              className="block px-4 py-2 rounded-xl text-forest-700 bg-forest-50 font-medium"
            >{t('nav.dashboard')}</Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-xl text-earth-600 hover:bg-beige-50 font-medium"
              >{t('nav.signIn')}</Link>
              <Link to="/signup" onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-xl text-forest-700 bg-forest-50 font-medium"
              >{t('nav.getStarted')}</Link>
            </>
          )}
          <div className="border-t border-beige-100 pt-2 mt-2">
            <p className="text-xs text-earth-400 px-4 mb-2">Language</p>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { switchLanguage(l.code); setOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 w-full text-left text-sm rounded-lg ${currentLang === l.code ? 'text-forest-700 bg-forest-50' : 'text-earth-600 hover:bg-beige-50'}`}
              >{l.nativeLabel}</button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
