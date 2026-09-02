const appName = import.meta.env.VITE_APP_NAME?.trim() || 'MaeKade'

export const brand = Object.freeze({
  name: appName,
  logoUrl: '/brand/logo.svg',
  logoMarkUrl: '/brand/logo-mark.svg',
  faviconUrl: '/favicon.svg',
})
