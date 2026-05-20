<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/admin/organizations" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('org.edit') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('org.editDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-else>

        <!-- Account Details -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('org.details') }}</h2>
            <span class="badge badge-blue text-xs">{{ form.email }}</span>
          </div>
          <div class="px-6 py-5 space-y-5">

            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('org.name') }} <span class="text-red-500">*</span>
              </label>
              <input v-model="form.name" type="text" :placeholder="t('org.namePlaceholder')"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('org.systemRole') }}
              </label>
              <SearchSelect v-model="form.role" :options="ROLE_OPTIONS" :allow-empty="false" />
            </div>

            <div v-if="form.role === 'user'">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('org.defaultPage') }}
              </label>
              <input v-model="form.defaultPage" type="text" :placeholder="t('org.defaultPagePlaceholder')"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <p class="text-xs text-[#9BA7B0] mt-1.5">{{ t('org.defaultPageHint') }}</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('org.parentOrg') }}</label>
              <SearchSelect v-model="form.parentId" :options="parentOrgOptions" :placeholder="t('org.noParent')" />
            </div>

            <div class="flex items-center gap-2.5">
              <input type="checkbox" id="chk-active" v-model="form.isActive" class="rounded border-[#CBD5E1] w-4 h-4" />
              <label for="chk-active" class="text-sm text-[#374151]">{{ t('org.accountActive') }}</label>
            </div>

          </div>
        </div>

        <!-- Company Profile (used on printable documents) -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('org.companyProfile') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('org.companyProfileDesc') }}</p>
          </div>
          <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">

            <!-- Logo column -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('org.logo') }}
              </label>
              <div class="w-[160px] h-[160px] rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F7F9FC]
                          flex items-center justify-center overflow-hidden">
                <img v-if="form.logoPath" :src="logoSrc" :alt="form.companyName || form.name"
                  class="max-w-full max-h-full object-contain" />
                <PhotoIcon v-else class="w-10 h-10 text-[#CBD5E1]" />
              </div>
              <div class="mt-2.5 flex flex-col gap-1.5">
                <input ref="logoFileRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  @change="onLogoSelected" class="hidden" />
                <button type="button" @click="logoFileRef?.click()" :disabled="logoSaving"
                  class="px-3 py-2 text-xs font-semibold rounded-lg border border-primary-200 text-primary-600
                         bg-primary-50 hover:bg-primary-100 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5">
                  <ArrowPathIcon v-if="logoSaving" class="w-3.5 h-3.5 animate-spin" />
                  <ArrowUpTrayIcon v-else class="w-3.5 h-3.5" />
                  {{ form.logoPath ? t('org.replaceLogo') : t('org.uploadLogo') }}
                </button>
                <button v-if="form.logoPath" type="button" @click="removeLogo" :disabled="logoSaving"
                  class="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  {{ t('org.removeLogo') }}
                </button>
              </div>
              <p class="text-[11px] text-[#9BA7B0] mt-1.5 leading-snug">{{ t('org.logoHint') }}</p>
              <p v-if="logoError" class="text-[11px] text-red-600 mt-1">{{ logoError }}</p>
            </div>

            <!-- Profile fields -->
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('org.companyName') }}
                </label>
                <input v-model="form.companyName" type="text" :placeholder="t('org.companyNamePh')"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <p class="text-[11px] text-[#9BA7B0] mt-1">{{ t('org.companyNameHint') }}</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('org.companyAddress') }}
                </label>
                <textarea v-model="form.address" rows="3" :placeholder="t('org.companyAddressPh')"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                    {{ t('org.companyPhone') }}
                  </label>
                  <input v-model="form.phone" type="text" :placeholder="t('org.companyPhonePh')"
                    class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                    {{ t('org.companyTaxId') }}
                  </label>
                  <input v-model="form.taxId" type="text" :placeholder="t('org.companyTaxIdPh')"
                    class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('org.companyWebsite') }}
                </label>
                <input v-model="form.website" type="text" :placeholder="t('org.companyWebsitePh')"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>

          </div>
        </div>

        <!-- Child Organizations -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('org.childOrgs') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div v-if="children.length" class="divide-y divide-[#F1F5F9]">
              <div v-for="child in children" :key="child.id" class="flex items-center justify-between py-2">
                <div>
                  <p class="text-sm font-medium text-[#1C2434]">{{ child.name }}</p>
                  <p class="text-xs text-[#9BA7B0]">{{ child.email }}</p>
                </div>
                <RouterLink :to="`/admin/organizations/${child.id}/edit`" class="text-xs text-primary-500 hover:underline">{{ t('common.edit') }}</RouterLink>
              </div>
            </div>
            <p v-else class="text-sm text-[#9BA7B0] italic">{{ t('org.noChildren') }}</p>
          </div>
        </div>

        <!-- Assigned Roles -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('org.assignedRoles') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('org.assignedRolesDesc') }}</p>
          </div>
          <div class="px-6 py-5">
            <div class="border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0] max-h-64 overflow-y-auto scrollbar-thin">
              <label v-for="role in allRoles" :key="role.id"
                class="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F9FC] cursor-pointer">
                <input type="checkbox" :value="role.id" v-model="form.roleIds" class="rounded border-[#CBD5E1] w-4 h-4" />
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: role.color }" />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-[#1C2434]">{{ role.name }}</span>
                  <span class="ml-2 text-xs text-[#9BA7B0]">{{ role.slug }}</span>
                </div>
                <span class="text-xs text-[#9BA7B0]">{{ role.permissions?.length ?? 0 }} {{ t('common.perms') }}</span>
              </label>
              <div v-if="!allRoles.length" class="px-4 py-3 text-sm text-[#9BA7B0] italic">{{ t('org.noRolesAvailable') }}</div>
            </div>
          </div>
        </div>

        <div v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/admin/organizations"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
            {{ saving ? t('common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon, ArrowUpTrayIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()

const ROLE_OPTIONS = computed(() => [
  { id: 'user',  name: t('org.roleUser')  },
  { id: 'admin', name: t('org.roleAdmin') },
])

const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')
const allRoles = ref([])
const allOrgs  = ref([])
const children = ref([])

const form = reactive({
  id: null, name: '', email: '', role: 'user', isActive: true, defaultPage: '', parentId: '', roleIds: [],
  // Company profile (for printable documents)
  companyName: '', address: '', phone: '', taxId: '', website: '', logoPath: '',
})

// ── Logo upload state ────────────────────────────────────────────────────
const logoFileRef = ref(null)
const logoSaving  = ref(false)
const logoError   = ref('')

// Logos are served from the API origin (e.g. http://localhost:3000/uploads/…),
// not the Vue dev origin. Resolve relative `logoPath` against the API base URL
// configured on the axios instance so the <img src> works in dev and prod.
const apiOrigin = computed(() => {
  const base = api.defaults?.baseURL || ''
  try { return new URL(base, window.location.origin).origin } catch { return window.location.origin }
})
const logoSrc = computed(() => {
  if (!form.logoPath) return ''
  if (/^https?:\/\//i.test(form.logoPath)) return form.logoPath
  return `${apiOrigin.value}${form.logoPath}`
})

const LOGO_ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
const LOGO_MAX_BYTES = 2 * 1024 * 1024

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function onLogoSelected(e) {
  const file = e.target?.files?.[0]
  // Reset the input so picking the same file twice still fires `change`.
  if (e.target) e.target.value = ''
  if (!file) return
  logoError.value = ''
  if (!LOGO_ALLOWED.includes(file.type)) {
    logoError.value = t('org.logoTypeUnsupported')
    return
  }
  if (file.size > LOGO_MAX_BYTES) {
    logoError.value = t('org.logoTooLarge')
    return
  }
  logoSaving.value = true
  try {
    const dataUrl = await fileToBase64(file)
    const { data } = await api.post(`/organizations/${form.id}/logo`, {
      dataBase64:  dataUrl,
      contentType: file.type,
    })
    form.logoPath = data.data.organization.logoPath || ''
  } catch (err) {
    logoError.value = err.response?.data?.message || t('org.logoUploadFailed')
  } finally {
    logoSaving.value = false
  }
}

async function removeLogo() {
  logoError.value = ''
  logoSaving.value = true
  try {
    await api.delete(`/organizations/${form.id}/logo`)
    form.logoPath = ''
  } catch (err) {
    logoError.value = err.response?.data?.message || t('org.logoUploadFailed')
  } finally {
    logoSaving.value = false
  }
}

const parentOrgOptions = computed(() => allOrgs.value.filter(o => o.id !== form.id))

onMounted(async () => {
  try {
    const [orgRes, rolesRes, orgsRes] = await Promise.all([
      api.get(`/organizations/${route.params.id}`),
      api.get('/roles'),
      api.get('/organizations/all'),
    ])
    const u = orgRes.data.data.organization
    allRoles.value = rolesRes.data.data.roles
    allOrgs.value  = orgsRes.data.data.organizations
    children.value = u.children || []
    Object.assign(form, {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      role:        u.role,
      isActive:    u.isActive,
      defaultPage: u.defaultPage || '',
      parentId:    u.parentId    || '',
      roleIds:     (u.roles || []).map(r => r.id),
      // Company profile
      companyName: u.companyName || '',
      address:     u.address     || '',
      phone:       u.phone       || '',
      taxId:       u.taxId       || '',
      website:     u.website     || '',
      logoPath:    u.logoPath    || '',
    })
  } catch {
    router.push('/admin/organizations')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value  = ''
  saving.value = true
  try {
    await api.put(`/organizations/${form.id}`, {
      name:        form.name,
      role:        form.role,
      isActive:    form.isActive,
      defaultPage: form.defaultPage || null,
      parentId:    form.parentId    || null,
      // Company profile
      companyName: form.companyName?.trim() || null,
      address:     form.address?.trim()     || null,
      phone:       form.phone?.trim()       || null,
      taxId:       form.taxId?.trim()       || null,
      website:     form.website?.trim()     || null,
    })
    await api.put(`/organizations/${form.id}/roles`, { roleIds: form.roleIds })
    router.push('/admin/organizations')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.length
      ? d.errors.map(e => e.message).join(', ')
      : (d?.message || t('org.saveFailed'))
  } finally {
    saving.value = false
  }
}
</script>
