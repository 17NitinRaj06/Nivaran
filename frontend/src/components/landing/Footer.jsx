import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-earth-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
            <img
              src="/favicon_icon.png"
              alt="Nivaran"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-forest-700"
            />
            <span className="font-display text-2xl">{t('app.name')}</span>
            </div>
            <p className="text-sage-200 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4 text-sage-300">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#about" className="text-sage-200 hover:text-white transition-colors">{t('footer.about')}</a></li>
              <li><a href="#impact" className="text-sage-200 hover:text-white transition-colors">{t('footer.impact')}</a></li>
              <li><a href="#awareness" className="text-sage-200 hover:text-white transition-colors">{t('footer.awareness')}</a></li>
              <li><Link to="/dashboard/leaderboard" className="text-sage-200 hover:text-white transition-colors">{t('footer.leaderboard')}</Link></li>
              <li><Link to="/login" className="text-sage-200 hover:text-white transition-colors">{t('footer.signIn')}</Link></li>
              <li><Link to="/signup" className="text-sage-200 hover:text-white transition-colors">{t('footer.getStarted')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4 text-sage-300">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-sage-200">
                <HiPhone className="text-sage-400 shrink-0" />
                <a href="tel:6200349643" className="hover:text-white transition-colors">6200349643</a>
              </li>
              <li className="flex items-center gap-3 text-sage-200">
                <HiMail className="text-sage-400 shrink-0" />
                <a href="mailto:nitinraj200607@gmail.com" className="hover:text-white transition-colors">nitinraj200607@gmail.com</a>
              </li>
              <li className="flex items-center gap-3 text-sage-200">
                <HiLocationMarker className="text-sage-400 shrink-0" />
                <span>India</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4 text-sage-300">{t('footer.followUs')}</h4>
            <div className="flex gap-4">
              <a href="https://github.com/17NitinRaj06" target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-1"
              ><FaGithub size={20} /></a>
              <a href="https://www.linkedin.com/in/nitin-raj-17d12" target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-1"
              ><FaLinkedin size={20} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-1"
              ><FaTwitter size={20} /></a>
            </div>
            <p className="mt-6 text-sage-300 text-sm">
              {t('footer.builtWith')} ❤️ {t('footer.forCommunities')}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sage-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {t('app.name')}. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
