import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function HeroSection() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-nature-gradient-light"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-sage-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-forest-200/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-forest-50 rounded-full text-forest-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
              {t('hero.badge')}
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-forest-900 leading-tight mb-6 text-balance">
              {t('hero.title1')}
              <span className="text-forest-500"> {t('hero.title2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-earth-600 mb-8 max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Link to="/dashboard" className="btn-primary group text-lg">
                  {t('hero.goDashboard')}
                  <HiArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-primary group text-lg">
                    {t('hero.getStarted')}
                    <HiArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg">
                    {t('hero.signIn')}
                  </Link>
                </>
              )}
            </div>
            <div className="mt-12 flex items-center gap-8 text-earth-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-sage-200 border-2 border-white flex items-center justify-center text-forest-700 font-medium text-sm"
                  >
                    {['A', 'M', 'K', 'R'][i - 1]}
                  </div>
                ))}
              </div>
              <p className="text-sm">
                <span className="text-forest-700 font-semibold">2,000+</span>{' '}
                {t('hero.community')}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-nature-gradient rounded-[3rem] rotate-6 opacity-10" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 bg-white rounded-[2rem] shadow-card animate-float">
                    <div className="p-8 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-forest-800">{t('hero.card1')}</p>
                          <p className="text-sm text-earth-500">{t('hero.card1loc')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-forest-800">{t('hero.card2')} ✓</p>
                          <p className="text-sm text-earth-500">{t('hero.card2detail')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-beige-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-beige-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-forest-800">{t('hero.card3')}</p>
                          <p className="text-sm text-earth-500">{t('hero.card3detail')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-forest-500 rounded-2xl rotate-12 flex items-center justify-center text-white font-bold text-lg shadow-card">
                    {t('hero.cardBadge')}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
