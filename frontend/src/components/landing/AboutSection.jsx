import { motion } from 'framer-motion';
import { HiShieldCheck, HiMap, HiLightBulb, HiUserGroup } from 'react-icons/hi';
import { useTranslation } from '../../hooks/useTranslation';

const features = [
  { icon: HiMap, titleKey: 'feature1Title', descKey: 'feature1Desc', color: 'bg-forest-100 text-forest-700' },
  { icon: HiShieldCheck, titleKey: 'feature2Title', descKey: 'feature2Desc', color: 'bg-sage-100 text-sage-700' },
  { icon: HiUserGroup, titleKey: 'feature3Title', descKey: 'feature3Desc', color: 'bg-beige-100 text-beige-700' },
  { icon: HiLightBulb, titleKey: 'feature4Title', descKey: 'feature4Desc', color: 'bg-forest-100 text-forest-700' },
];

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-forest-600 font-medium text-sm tracking-widest uppercase">
            {t('about.badge')}
          </span>
          <h2 className="section-heading mt-3 mb-6">
            {t('about.title1')}{' '}
            <span className="text-forest-500">{t('about.title2')}</span>
          </h2>
          <p className="section-subheading mx-auto">
            {t('about.subtitle')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1 }}
              className="card group hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
              >
                <feature.icon size={24} />
              </div>
              <h3 className="font-display text-xl text-forest-800 mb-3">
                {t(`about.${feature.titleKey}`)}
              </h3>
              <p className="text-earth-600 leading-relaxed">
                {t(`about.${feature.descKey}`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
