import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import hi from './hi';
import bn from './bn';

const savedLang = localStorage.getItem('nivaran-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: { en, hi, bn },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem('nivaran-lang', lang);
  document.documentElement.lang = lang;
}

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'हिन्दी', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা', nativeLabel: 'বাংলা' },
];
