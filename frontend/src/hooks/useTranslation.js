import { useTranslation as useI18nTranslation, getI18n } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '../i18n';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  const switchLanguage = (langCode) => {
    changeLanguage(langCode);
  };

  const currentLang = i18n.language;
  const currentLangInfo = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return {
    t,
    i18n,
    currentLang,
    currentLangInfo,
    switchLanguage,
    languages: LANGUAGES,
    isRTL: false,
  };
}
