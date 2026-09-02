import { ref } from 'vue'
import liff from '@line/liff'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

// Public LIFF channel ID — the only LINE value the client ever sees. The
// idToken is never persisted; it is exchanged server-side for a session.
const LIFF_ID = import.meta.env.VITE_LIFF_ORG_ID

/**
 * LINE (LIFF) login flow, shared by the landing page and the login page.
 *
 * Per the /api/auth/line contract:
 *   liff.init({ liffId }) → liff.getIDToken() → POST /auth/line { idToken }
 *   → store accessToken in the auth store → redirect to the app.
 *
 * Failure is non-fatal: on a 501 ("LINE not configured") or any LIFF error we
 * set a friendly `lineError` and return false, so the caller's email form stays
 * usable and the client is never stuck on a dead button.
 */
export function useLineAuth() {
  const auth = useAuthStore()
  const router = useRouter()
  const { t } = useI18n()

  const lineLoading = ref(false)
  const lineError = ref('')

  async function loginWithLine() {
    lineLoading.value = true
    lineError.value = ''
    try {
      if (!LIFF_ID) {
        const err = new Error('LIFF_NOT_CONFIGURED')
        err.code = 'LIFF_NOT_CONFIGURED'
        throw err
      }

      await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: false })

      // Not signed in on LINE yet — bounce to the LINE consent screen. The
      // flow resumes right here on return. Returning false keeps the UI calm.
      if (!liff.isLoggedIn()) {
        liff.login()
        return false
      }

      const idToken = liff.getIDToken()
      if (!idToken) {
        const err = new Error('NO_ID_TOKEN')
        err.code = 'NO_ID_TOKEN'
        throw err
      }

      await auth.loginWithLine(idToken)
      router.push(auth.homeRoute())
      return true
    } catch (err) {
      // 501 = the server has no LINE/LIFF credentials configured. Surface a
      // friendly notice; the email form below is the fallback.
      if (err.code === 'LIFF_NOT_CONFIGURED' || err.response?.status === 501) {
        lineError.value = t('auth.lineNotConfigured')
      } else {
        lineError.value = t('auth.lineLoginFailed')
      }
      return false
    } finally {
      lineLoading.value = false
    }
  }

  return { lineLoading, lineError, loginWithLine }
}
