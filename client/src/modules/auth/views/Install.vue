<template>
  <div class="min-h-screen bg-[#F1F5F9] flex flex-col">

    <!-- ── Top bar ───────────────────────────────────────────────────────────── -->
    <header class="flex items-center justify-between px-8 py-5 flex-shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 flex items-center justify-center flex-shrink-0"
          style="background: linear-gradient(135deg, #465fff 0%, #3641f5 100%);">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-[15px] font-bold text-[#1C2434]">Starter SaaS</span>
      </div>
      <RouterLink to="/login"
        class="text-[13px] font-medium text-[#637381] hover:text-primary-600 transition-colors">
        {{ t('auth.signInLink') }} →
      </RouterLink>
    </header>

    <!-- ── Form area ─────────────────────────────────────────────────────────── -->
    <main class="flex-1 px-8 pb-12">

      <!-- Heading -->
      <div class="mb-8">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-3 text-[11px] font-semibold
                     text-primary-700 bg-primary-50 uppercase tracking-wider">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {{ t('auth.setupTitle') }}
        </span>
        <h1 class="text-[26px] font-bold text-[#0F172A] tracking-[-0.5px]">{{ t('auth.createWorkspace') }}</h1>
        <p class="text-[14px] text-[#637381] mt-1">{{ t('auth.setupDesc') }}</p>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm">
        <div class="px-8 py-8">
        <div class="max-w-none">

          <form @submit.prevent="handleInstall" class="space-y-10">

            <!-- ── Alert ────────────────────────────────────────────────────── -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0">
              <ErrorBanner v-if="errors.length" :message="errors[0]" />
            </transition>

            <!-- ── Language ─────────────────────────────────────────────────── -->
            <section>
              <h2 class="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">
                {{ t('auth.defaultLanguage') }}
              </h2>
              <div class="grid grid-cols-4 gap-5">
                <div class="col-span-2">
                  <select v-model="defaultLang" @change="setLang(defaultLang)" class="input">
                    <option v-for="opt in langOptions" :key="opt.code" :value="opt.code">{{ opt.flag }} {{ opt.label }}</option>
                  </select>
                  <p class="mt-1.5 text-[12px] text-[#94A3B8]">{{ t('auth.defaultLanguageHint') }}</p>
                </div>
              </div>
            </section>

            <!-- ── Account ──────────────────────────────────────────────────── -->
            <section>
              <h2 class="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">
                {{ t('auth.orgName') }} &amp; Admin
              </h2>
              <div class="grid grid-cols-4 gap-x-5 gap-y-4">

                <FormField wrapperClass="col-span-2" name="name" v-model="form.name"
                  :label="t('auth.orgName')" :placeholder="t('auth.orgNamePh')"
                  autocomplete="organization" :errors="fieldErrors" />

                <FormField wrapperClass="col-span-2" name="email" v-model="form.email"
                  :label="t('auth.email')" type="email" :placeholder="t('auth.adminEmailPh')"
                  autocomplete="email" :errors="fieldErrors" />

                <FormField wrapperClass="col-span-2" name="password" v-model="form.password"
                  :label="t('auth.password')" :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('auth.passwordMinPh')" autocomplete="new-password" :errors="fieldErrors">
                  <template #suffix>
                    <button type="button" @click="showPassword = !showPassword" tabindex="-1"
                      class="text-[#94A3B8] hover:text-[#64748B] transition-colors">
                      <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </template>
                </FormField>

                <FormField wrapperClass="col-span-2" name="confirmPassword" v-model="form.confirmPassword"
                  :label="t('auth.confirmPassword')" :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('auth.repeatPh')" autocomplete="new-password"
                  :errors="confirmMismatch ? { confirmPassword: t('auth.passwordsNoMatch') } : {}" />

              </div>
            </section>

            <!-- ── Database ─────────────────────────────────────────────────── -->
            <section>
              <h2 class="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">
                {{ t('auth.dbSection') }}
              </h2>
              <div class="space-y-4">

                <div class="grid grid-cols-4 gap-x-5 gap-y-4">
                  <div class="col-span-2">
                    <label class="label">{{ t('auth.dbEngine') }}</label>
                    <select v-model="db.dialect" class="input" @change="dbTestResult = ''">
                      <option v-for="opt in dbDialects" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
                    </select>
                  </div>

                  <FormField v-if="db.dialect === 'sqlite'" wrapperClass="col-span-2"
                    name="storage" v-model="db.storage"
                    :label="t('auth.dbSqlitePath')" :placeholder="DEFAULT_SQLITE_PATH"
                    :hint="t('auth.dbSqlitePathHint')" inputClass="font-mono text-[13px]"
                    spellcheck="false" autocomplete="off" />
                </div>

                <!-- Relational details -->
                <div v-if="db.dialect !== 'sqlite'" class="grid grid-cols-4 gap-x-5 gap-y-4">
                  <FormField wrapperClass="col-span-2" name="dbHost" v-model="db.host"
                    :label="t('auth.dbHost')" placeholder="localhost" />
                  <FormField wrapperClass="col-span-1" name="dbPort" v-model="db.port"
                    :label="t('auth.dbPort')" type="number" :placeholder="String(defaultPort)" />
                  <FormField wrapperClass="col-span-1" name="dbName" v-model="db.database"
                    :label="t('auth.dbName')" placeholder="starter_saas" />
                  <FormField wrapperClass="col-span-2" name="dbUsername" v-model="db.username"
                    :label="t('auth.dbUsername')" autocomplete="off" />
                  <FormField wrapperClass="col-span-2" name="dbPassword" v-model="db.password"
                    :label="t('auth.password')" type="password" autocomplete="new-password" />
                  <div class="col-span-4 flex items-center gap-3">
                    <AppButton variant="secondary" @click="testDb" :loading="dbTesting">
                      {{ dbTesting ? t('auth.dbTesting') : t('auth.dbTest') }}
                    </AppButton>
                    <span v-if="dbTestResult === 'ok'" class="text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                      {{ t('auth.dbConnected') }}
                    </span>
                    <span v-else-if="dbTestResult === 'fail'" class="text-[13px] text-red-600">{{ dbTestError }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- ── Cache (Redis) ────────────────────────────────────────────── -->
            <section>
              <h2 class="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">
                {{ t('auth.cacheSection') }}
              </h2>
              <div class="space-y-4">

                <label class="flex items-start gap-3 cursor-pointer select-none border px-4 py-3.5 transition-all duration-150 hover:border-primary-300"
                  :class="redis.enabled ? 'border-primary-300 bg-primary-50/30' : 'border-[#E2E8F0] bg-white'">
                  <input v-model="redis.enabled" type="checkbox" class="sr-only" @change="redisTestResult = ''" />
                  <span class="mt-0.5 w-4 h-4 border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all"
                    :class="redis.enabled ? 'bg-primary-500 border-primary-500' : 'bg-white border-[#CBD5E1]'">
                    <svg v-if="redis.enabled" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>
                    <span class="block text-[13px] font-semibold text-[#374151] leading-snug">{{ t('auth.redisEnable') }}</span>
                    <span class="block text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed">{{ t('auth.redisEnableHint') }}</span>
                  </span>
                </label>

                <div v-if="redis.enabled" class="grid grid-cols-4 gap-x-5 gap-y-4">
                  <FormField wrapperClass="col-span-2" name="redisHost" v-model="redis.host"
                    :label="t('auth.dbHost')" placeholder="127.0.0.1" />
                  <FormField wrapperClass="col-span-1" name="redisPort" v-model="redis.port"
                    :label="t('auth.dbPort')" type="number" :placeholder="String(REDIS_DEFAULT_PORT)" />
                  <FormField wrapperClass="col-span-1" name="redisDb" v-model="redis.db"
                    :label="t('auth.redisDbIndex')" type="number" placeholder="0" />
                  <FormField wrapperClass="col-span-2" name="redisPassword" v-model="redis.password"
                    :label="t('auth.password')" type="password" autocomplete="new-password" />
                  <div class="col-span-4 flex items-center gap-3">
                    <AppButton variant="secondary" @click="testRedis" :loading="redisTesting">
                      {{ redisTesting ? t('auth.dbTesting') : t('auth.dbTest') }}
                    </AppButton>
                    <span v-if="redisTestResult === 'ok'" class="text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                      {{ t('auth.dbConnected') }}
                    </span>
                    <span v-else-if="redisTestResult === 'fail'" class="text-[13px] text-red-600">{{ redisTestError }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- ── Setup options ─────────────────────────────────────────────── -->
            <section>
              <h2 class="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">
                {{ t('auth.setupOptions') }}
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="flex items-start gap-3 cursor-pointer select-none border px-4 py-3.5 transition-all duration-150 hover:border-primary-300"
                  :class="seedSequences ? 'border-primary-300 bg-primary-50/30' : 'border-[#E2E8F0] bg-white'">
                  <input v-model="seedSequences" type="checkbox" class="sr-only" />
                  <span class="mt-0.5 w-4 h-4 border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all"
                    :class="seedSequences ? 'bg-primary-500 border-primary-500' : 'bg-white border-[#CBD5E1]'">
                    <svg v-if="seedSequences" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>
                    <span class="block text-[13px] font-semibold text-[#374151] leading-snug">{{ t('auth.seedSequencesTitle') }}</span>
                    <span class="block text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed">{{ t('auth.seedSequencesDesc') }}</span>
                  </span>
                </label>

                <label class="flex items-start gap-3 cursor-pointer select-none border px-4 py-3.5 transition-all duration-150 hover:border-primary-300"
                  :class="seedDemo ? 'border-primary-300 bg-primary-50/30' : 'border-[#E2E8F0] bg-white'">
                  <input v-model="seedDemo" type="checkbox" class="sr-only" />
                  <span class="mt-0.5 w-4 h-4 border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all"
                    :class="seedDemo ? 'bg-primary-500 border-primary-500' : 'bg-white border-[#CBD5E1]'">
                    <svg v-if="seedDemo" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>
                    <span class="block text-[13px] font-semibold text-[#374151] leading-snug">{{ t('auth.seedDemoTitle') }}</span>
                    <span class="block text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed">{{ t('auth.seedDemoDesc') }}</span>
                  </span>
                </label>
              </div>
            </section>

            <!-- ── Submit ───────────────────────────────────────────────────── -->
            <AppButton type="submit" :loading="loading" class="w-full py-3 text-[14px]">
              {{ loading ? loadingPhase : t('auth.createAdmin') }}
            </AppButton>

          </form>
        </div>
        </div>
      </div>

      <!-- Trust line -->
      <div class="mt-6 flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>{{ t('auth.setupOnce') }} · {{ t('auth.secureNote') }}</span>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { resetInstallCache } from '@/router'
import api from '@/api'
import { useFieldErrors } from '@/composables/useFieldErrors'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import AppButton  from '@/components/AppButton.vue'
import FormField  from '@/components/form/FormField.vue'

const auth   = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()


// ── Language ───────────────────────────────────────────────────────────────
// The picker doubles as the workspace default: switching it re-labels the form
// live and persists the choice (localStorage 'app-lang' is what the app reads
// on boot), so it survives the configure-induced reload during install.
const langOptions = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'th', flag: '🇹🇭', label: 'ภาษาไทย' },
]
const defaultLang = ref(locale.value)
function setLang(code) {
  defaultLang.value = code
  locale.value = code
  localStorage.setItem('app-lang', code)
}

const form         = ref({ name: '', email: '', password: '', confirmPassword: '' })
const loading      = ref(false)
const loadingPhase = ref('')
const errors       = ref([])
const showPassword = ref(false)
const seedSequences = ref(false)
const seedDemo      = ref(false)
const confirmMismatch = ref(false)
const { fieldErrors, setFromError, reset: resetFieldErrors, errorOf } = useFieldErrors()

// ── Database selection ───────────────────────────────────────────────────────
const DEFAULT_SQLITE_PATH = './data/database.sqlite'
const dbDialects = [
  { value: 'sqlite',   labelKey: 'auth.dbSqlite' },
  { value: 'postgres', labelKey: 'auth.dbPostgres' },
  { value: 'mysql',    labelKey: 'auth.dbMysql' },
  { value: 'mariadb',  labelKey: 'auth.dbMariadb' },
  { value: 'mssql',    labelKey: 'auth.dbMssql' },
]
const DEFAULT_PORTS = { postgres: 5432, mysql: 3306, mariadb: 3306, mssql: 1433 }
const db = ref({
  dialect:  'sqlite',
  storage:  DEFAULT_SQLITE_PATH,
  host:     'localhost',
  port:     '',
  database: 'starter_saas',
  username: '',
  password: '',
})
const dbTesting    = ref(false)
const dbTestResult = ref('')  // '' | 'ok' | 'fail'
const dbTestError  = ref('')
const defaultPort  = computed(() => DEFAULT_PORTS[db.value.dialect] || '')

// A reconfigure + server restart is only needed when the running default
// (sqlite at DEFAULT_SQLITE_PATH) is not what the user wants: any relational
// dialect, or sqlite pointed at a custom path.
const needsDbConfigure = computed(() => {
  const d = db.value
  if (d.dialect !== 'sqlite') return true
  const path = (d.storage || '').trim()
  return path !== '' && path !== DEFAULT_SQLITE_PATH
})

// ── Cache (Redis) ─────────────────────────────────────────────────────────────
const REDIS_DEFAULT_PORT = 6379
const redis = ref({ enabled: false, host: '127.0.0.1', port: '', password: '', db: 0 })
const redisTesting    = ref(false)
const redisTestResult = ref('')  // '' | 'ok' | 'fail'
const redisTestError  = ref('')

// Default is the in-memory cache (disabled); only an explicit opt-in needs to
// be persisted + applied on the server.
const needsRedisConfigure = computed(() => redis.value.enabled === true)

function redisPayload() {
  const r = redis.value
  if (!r.enabled) return { enabled: false }
  return {
    enabled:  true,
    host:     (r.host || '').trim() || '127.0.0.1',
    port:     r.port ? Number(r.port) : REDIS_DEFAULT_PORT,
    password: r.password,
    db:       r.db ? Number(r.db) : 0,
  }
}

async function testRedis() {
  redisTesting.value = true
  redisTestResult.value = ''
  redisTestError.value = ''
  try {
    await api.post('/system/redis/test', redisPayload())
    redisTestResult.value = 'ok'
  } catch (err) {
    redisTestResult.value = 'fail'
    redisTestError.value = err.response?.data?.message || t('auth.dbConnectionFailed')
  } finally {
    redisTesting.value = false
  }
}

async function testDb() {
  dbTesting.value = true
  dbTestResult.value = ''
  dbTestError.value = ''
  try {
    await api.post('/system/db/test', dbPayload())
    dbTestResult.value = 'ok'
  } catch (err) {
    dbTestResult.value = 'fail'
    dbTestError.value = err.response?.data?.message || t('auth.dbConnectionFailed')
  } finally {
    dbTesting.value = false
  }
}

function dbPayload() {
  const d = db.value
  if (d.dialect === 'sqlite') {
    return { dialect: 'sqlite', storage: (d.storage || '').trim() || DEFAULT_SQLITE_PATH }
  }
  return {
    dialect:  d.dialect,
    host:     d.host,
    port:     d.port ? Number(d.port) : DEFAULT_PORTS[d.dialect],
    database: d.database,
    username: d.username,
    password: d.password,
  }
}

// Poll /api/health until the server is back up after the configure-induced
// restart. Resolves on first 200, rejects after the timeout window so we
// don't loop forever on a misconfigured environment.
async function waitForServerReady({ timeoutMs = 30000, intervalMs = 750 } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastErr = null
  while (Date.now() < deadline) {
    try {
      await api.get('/health')
      return
    } catch (err) {
      lastErr = err
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }
  throw lastErr || new Error('Server did not become ready in time')
}

async function handleInstall() {
  errors.value = []
  confirmMismatch.value = false
  resetFieldErrors()
  if (form.value.password !== form.value.confirmPassword) {
    confirmMismatch.value = true
    return
  }
  loading.value = true
  loadingPhase.value = t('auth.installing')
  try {
    // 1. If the running default DB isn't what the user wants, persist the new
    // selection and wait for the server to come back up. The server
    // self-terminates (process.exit(0)) so the process manager — nodemon in
    // dev, pm2/systemd in prod — restarts it under the new .env. We swallow
    // the inevitable connection error from the configure call itself and poll
    // /health instead.
    if (needsDbConfigure.value) {
      loadingPhase.value = t('auth.configuringDb')
      try {
        await api.post('/system/db/configure', dbPayload())
      } catch (err) {
        const msg = err.response?.data?.message
        if (msg) { errors.value = [msg]; return }
        // Network error here usually means the server already started shutting
        // down before sending the response. Continue and let the health poll
        // verify the new boot.
      }
      loadingPhase.value = t('auth.restartingServer')
      try {
        await waitForServerReady()
      } catch {
        errors.value = [t('auth.serverNotBack')]
        return
      }
    }

    // 1b. Apply the cache selection. The backend swaps the cache backend live,
    // so unlike the DB switch there's no restart/poll — it returns immediately.
    if (needsRedisConfigure.value) {
      loadingPhase.value = t('auth.configuringCache')
      try {
        await api.post('/system/redis/configure', redisPayload())
      } catch (err) {
        errors.value = [err.response?.data?.message || t('auth.dbConnectionFailed')]
        return
      }
    }

    // 2. Create the admin / seed defaults against whatever DB the server is
    // now bound to (either the original sqlite, or the freshly-restarted
    // selection from step 1).
    loadingPhase.value = t('auth.installing')
    await auth.install(form.value.name, form.value.email, form.value.password)
    if (seedSequences.value) {
      loadingPhase.value = t('auth.seedingSequences')
      await api.post('/erp/settings/demo-data/seed-sequences')
    }
    if (seedDemo.value) {
      loadingPhase.value = t('auth.seedingDemo')
      await api.post('/erp/settings/demo-data/seed', { lang: defaultLang.value })
    }
    resetInstallCache()
    router.push('/dashboard')
  } catch (err) {
    const had = setFromError(err)
    if (!had) errors.value = [err.response?.data?.message || t('auth.installationFailed')]
  } finally {
    loading.value = false
    loadingPhase.value = ''
  }
}
</script>
