import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import th from './locales/th.js'

const savedLang = localStorage.getItem('app-lang') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages: { en, th },
})

export default i18n
