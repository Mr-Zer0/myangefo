import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import mm from "./locales/mm.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mm: { translation: mm },
  },
  lng: "mm",
  fallbackLng: "mm",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
