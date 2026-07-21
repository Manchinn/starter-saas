import { createI18n } from 'vue-i18n'
import baseEn from './locales/en.js'
import baseTh from './locales/th.js'

// Auto-discover per-module locale files:
//   client/src/modules/<module>/i18n/{en,th}.js
//   shared/<area>/<module>/i18n/{en,th}.js  (any depth)
const clientModuleLocales = import.meta.glob('../modules/**/i18n/*.js', { eager: true })
const sharedModuleLocales = import.meta.glob('../../../shared/**/i18n/*.js', { eager: true })

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    const sv = source[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {}
      deepMerge(target[key], sv)
    } else {
      target[key] = sv
    }
  }
  return target
}

function buildMessages() {
  const messages = { en: { ...baseEn }, th: { ...baseTh } }

  const merge = (path, mod) => {
    // Vite may give POSIX or Windows separators depending on OS/plugin version.
    const m = path.replace(/\\/g, '/').match(/\/i18n\/([a-z]{2})\.js$/i)
    if (!m) return
    const locale = m[1]
    if (!messages[locale]) messages[locale] = {}
    deepMerge(messages[locale], mod.default || mod)
  }

  for (const [path, mod] of Object.entries(clientModuleLocales)) merge(path, mod)
  for (const [path, mod] of Object.entries(sharedModuleLocales)) merge(path, mod)

  return messages
}

const savedLang = localStorage.getItem('app-lang') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages: buildMessages(),
})

export default i18n
