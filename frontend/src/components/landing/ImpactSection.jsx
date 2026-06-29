import { motion } from 'framer-motion';
import { HiTrendingUp, HiBadgeCheck, HiGlobe, HiHeart } from 'react-icons/hi';
import { useTranslation } from '../../hooks/useTranslation';

const stats = [
  { icon: HiBadgeCheck, value: '2,340+', labelKey: 'stat1Label' },
  { icon: HiTrendingUp, value: '89%', labelKey: 'stat2Label' },
  { icon: HiGlobe, value: '12', labelKey: 'stat3Label' },
  { icon: HiHeart, value: '4,500+', labelKey: 'stat4Label' },
];

export default function ImpactSection() {
  const { t } = useTranslation();

  return (
    <section id="impact" className="py-24 md:py-32 bg-nature-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sage-300 font-medium text-sm tracking-widest uppercase">
            {t('impact.badge')}
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white mt-3 mb-6">
            {t('impact.title1')}{' '}
            <span className="text-sage-300">{t('impact.title2')}</span>
          </h2>
          <p className="text-sage-200 text-lg max-w-2xl mx-auto">
            {t('impact.subtitle')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                <stat.icon className="text-sage-300" size={28} />
              </div>
              <p className="font-display text-4xl md:text-5xl text-white font-bold mb-2">
                {stat.value}
              </p>
              <p className="text-sage-200 text-lg">{t(`impact.${stat.labelKey}`)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full text-sage-200">
            <span className="w-2 h-2 rounded-full bg-sage-400" />
            {t('impact.footer')}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
