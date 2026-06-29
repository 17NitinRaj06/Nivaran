import { motion } from 'framer-motion';
import { HiClipboardList, HiPhotograph, HiLocationMarker, HiChartBar } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const steps = [
  { icon: HiPhotograph, titleKey: 'step1Title', descKey: 'step1Desc' },
  { icon: HiLocationMarker, titleKey: 'step2Title', descKey: 'step2Desc' },
  { icon: HiClipboardList, titleKey: 'step3Title', descKey: 'step3Desc' },
  { icon: HiChartBar, titleKey: 'step4Title', descKey: 'step4Desc' },
];

export default function AwarenessSection() {
  const { t } = useTranslation();

  return (
    <section id="awareness" className="py-24 md:py-32 bg-beige-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-forest-600 font-medium text-sm tracking-widest uppercase">
            {t('awareness.badge')}
          </span>
          <h2 className="section-heading mt-3 mb-6">
            {t('awareness.title1')}{' '}
            <span className="text-forest-500">{t('awareness.title2')}</span>
          </h2>
          <p className="section-subheading mx-auto">
            {t('awareness.subtitle')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-nature-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                <step.icon className="text-white" size={26} />
              </div>
              <h3 className="font-display text-xl text-forest-800 mb-3">
                {t(`awareness.${step.titleKey}`)}
              </h3>
              <p className="text-earth-600">{t(`awareness.${step.descKey}`)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link to="/signup" className="btn-primary text-lg">
            {t('awareness.cta')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
