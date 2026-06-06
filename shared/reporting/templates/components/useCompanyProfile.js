import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Company / organisation profile used by every printable ERP document header.
 *
 * Centralises the `auth.user.organization` field plucking and logo-path
 * normalisation that was previously copy-pasted into all report templates.
 * A bare relative `logoPath` is prefixed with `/` so it resolves from the app
 * root; absolute URLs and root-relative paths are passed through unchanged.
 */
export function useCompanyProfile() {
  const auth = useAuthStore()

  const org            = computed(() => auth.user?.organization || {})
  const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
  const companyAddress = computed(() => org.value.address || '')
  const companyPhone   = computed(() => org.value.phone   || '')
  const companyEmail   = computed(() => org.value.email   || '')
  const companyTaxId   = computed(() => org.value.taxId   || '')
  const companyWebsite = computed(() => org.value.website || '')
  const companyLogoSrc = computed(() => {
    const p = org.value.logoPath
    if (!p) return ''
    if (/^https?:\/\//i.test(p)) return p
    return p.startsWith('/') ? p : `/${p}`
  })

  return {
    org,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    companyTaxId,
    companyWebsite,
    companyLogoSrc,
  }
}
