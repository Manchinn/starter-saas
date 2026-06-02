<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('org.edit')" :subtitle="t('org.editDesc')" back-to="/admin/organizations" />

      <LoadingSpinner v-if="loading" padding="md" />

      <template v-else>

        <!-- Account Details -->
        <FormCard :title="t('org.details')">
          <template #actions>
            <span class="badge badge-blue text-xs">{{ form.email }}</span>
          </template>
          <div class="space-y-5">

            <FormField
              v-model="form.name"
              name="name"
              :label="t('org.name')"
              :placeholder="t('org.namePlaceholder')"
              required
              :errors="fieldErrors"
            />

            <div>
              <label class="label">{{ t('org.systemRole') }}</label>
              <SearchSelect v-model="form.role" :options="ROLE_OPTIONS" :allow-empty="false" :invalid="!!errorOf('role')" />
              <FieldError name="role" :errors="fieldErrors" />
            </div>

            <FormField
              v-if="form.role === 'user'"
              v-model="form.defaultPage"
              name="defaultPage"
              :label="t('org.defaultPage')"
              :placeholder="t('org.defaultPagePlaceholder')"
              :hint="t('org.defaultPageHint')"
              :errors="fieldErrors"
            />

            <div>
              <label class="label">{{ t('org.parentOrg') }}</label>
              <SearchSelect v-model="form.parentId" :options="parentOrgOptions" :placeholder="t('org.noParent')" :invalid="!!errorOf('parentId')" />
              <FieldError name="parentId" :errors="fieldErrors" />
            </div>

            <div class="flex items-center gap-2.5">
              <input type="checkbox" id="chk-active" v-model="form.isActive" class="border-[#CBD5E1] w-4 h-4" />
              <label for="chk-active" class="text-sm text-[#374151]">{{ t('org.accountActive') }}</label>
            </div>

          </div>
        </FormCard>

        <!-- Company Profile (used on printable documents) -->
        <FormCard :title="t('org.companyProfile')" :subtitle="t('org.companyProfileDesc')">
          <div class="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">

            <!-- Logo column -->
            <div>
              <label class="label">{{ t('org.logo') }}</label>
              <div class="w-[160px] h-[160px] border border-dashed border-[#E2E8F0] bg-[#F7F9FC]
                          flex items-center justify-center overflow-hidden">
                <img v-if="form.logoPath" :src="logoSrc" :alt="form.companyName || form.name"
                  class="max-w-full max-h-full object-contain" />
                <PhotoIcon v-else class="w-10 h-10 text-[#CBD5E1]" />
              </div>
              <div class="mt-2.5 flex flex-col gap-1.5">
                <input ref="logoFileRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  @change="onLogoSelected" class="hidden" />
                <button type="button" @click="logoFileRef?.click()" :disabled="logoSaving"
                  class="px-3 py-2 text-xs font-semibold border border-primary-200 text-primary-600
                         bg-primary-50 hover:bg-primary-100 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5">
                  <ArrowPathIcon v-if="logoSaving" class="w-3.5 h-3.5 animate-spin" />
                  <ArrowUpTrayIcon v-else class="w-3.5 h-3.5" />
                  {{ form.logoPath ? t('org.replaceLogo') : t('org.uploadLogo') }}
                </button>
                <button v-if="form.logoPath" type="button" @click="removeLogo" :disabled="logoSaving"
                  class="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                  {{ t('org.removeLogo') }}
                </button>
              </div>
              <p class="text-[11px] text-[#9BA7B0] mt-1.5 leading-snug">{{ t('org.logoHint') }}</p>
              <p v-if="logoError" class="text-[11px] text-red-600 mt-1">{{ logoError }}</p>
            </div>

            <!-- Profile fields -->
            <div class="space-y-4">
              <FormField
                v-model="form.companyName"
                name="companyName"
                :label="t('org.companyName')"
                :placeholder="t('org.companyNamePh')"
                :hint="t('org.companyNameHint')"
                :errors="fieldErrors"
              />
              <FormField
                v-model="form.address"
                name="address"
                textarea
                :label="t('org.companyAddress')"
                :placeholder="t('org.companyAddressPh')"
                :errors="fieldErrors"
              />
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  v-model="form.phone"
                  name="phone"
                  :label="t('org.companyPhone')"
                  :placeholder="t('org.companyPhonePh')"
                  :errors="fieldErrors"
                />
                <FormField
                  v-model="form.taxId"
                  name="taxId"
                  :label="t('org.companyTaxId')"
                  :placeholder="t('org.companyTaxIdPh')"
                  :errors="fieldErrors"
                />
              </div>
              <FormField
                v-model="form.website"
                name="website"
                :label="t('org.companyWebsite')"
                :placeholder="t('org.companyWebsitePh')"
                :errors="fieldErrors"
              />
            </div>

          </div>
        </FormCard>

        <!-- Child Organizations -->
        <FormCard :title="t('org.childOrgs')">
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
        </FormCard>

        <!-- Subscription Plan -->
        <FormCard :title="t('org.subscriptionPlan')" :subtitle="t('org.subscriptionPlanDesc')">
            <label class="label">{{ t('org.plan') }}</label>
            <SearchSelect v-model="form.planId" :options="planOptions" :placeholder="t('org.planDefaultPlaceholder')" />
            <p v-if="currentPlanName" class="text-xs text-[#9BA7B0] mt-1.5">{{ t('org.currentPlan', { name: currentPlanName }) }}</p>
        </FormCard>

        <!-- Assigned Roles -->
        <FormCard :title="t('org.assignedRoles')" :subtitle="t('org.assignedRolesDesc')">
            <div class="border border-[#E2E8F0] divide-y divide-[#E2E8F0] max-h-64 overflow-y-auto scrollbar-thin">
              <label v-for="role in allRoles" :key="role.id"
                class="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F9FC] cursor-pointer">
                <input type="checkbox" :value="role.id" v-model="form.roleIds" class="border-[#CBD5E1] w-4 h-4" />
                <span class="w-2.5 h-2.5 flex-shrink-0" :style="{ backgroundColor: role.color }" />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-[#1C2434]">{{ role.name }}</span>
                  <span class="ml-2 text-xs text-[#9BA7B0]">{{ role.slug }}</span>
                </div>
                <span class="text-xs text-[#9BA7B0]">{{ role.permissions?.length ?? 0 }} {{ t('common.perms') }}</span>
              </label>
              <div v-if="!allRoles.length" class="px-4 py-3 text-sm text-[#9BA7B0] italic">{{ t('org.noRolesAvailable') }}</div>
            </div>
        </FormCard>

        <ErrorBanner :message="error" />

        <FormFooter
          cancel-to="/admin/organizations"
          :cancel-label="t('common.cancel')"
          :save-label="t('common.saveChanges')"
          :saving-label="t('common.saving')"
          :saving="saving"
          @save="save"
        />

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowUpTrayIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
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
const allPlans = ref([])
const children = ref([])
const currentPlanName = ref('')
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

const planOptions = computed(() => allPlans.value.map((p) => ({ id: p.id, name: planLabel(p) })))

function planLabel(p) {
  const n = Number(p.price)
  const price = n === 0 ? t('billing.freePrice') : `${n.toLocaleString()} ${p.currency}`
  return `${p.name} · ${price}`
}

const form = reactive({
  id: null, name: '', email: '', role: 'user', isActive: true, defaultPage: '', parentId: '', roleIds: [],
  companyName: '', address: '', phone: '', taxId: '', website: '', logoPath: '', planId: '',
})

const logoFileRef = ref(null)
const logoSaving  = ref(false)
const logoError   = ref('')

const logoSrc = computed(() => form.logoPath || '')

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
    const [orgRes, rolesRes, orgsRes, plansRes] = await Promise.all([
      api.get(`/organizations/${route.params.id}`),
      api.get('/roles'),
      api.get('/organizations/all'),
      api.get('/billing/admin/plans'),
    ])
    const u = orgRes.data.data.organization
    allRoles.value = rolesRes.data.data.roles
    allOrgs.value  = orgsRes.data.data.organizations
    allPlans.value = (plansRes.data.data.plans || []).filter((p) => p.isActive)
    children.value = u.children || []
    currentPlanName.value = u.subscription?.plan?.name || ''
    Object.assign(form, {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      role:        u.role,
      isActive:    u.isActive,
      defaultPage: u.defaultPage || '',
      parentId:    u.parentId    || '',
      roleIds:     (u.roles || []).map(r => r.id),
      companyName: u.companyName || '',
      address:     u.address     || '',
      phone:       u.phone       || '',
      taxId:       u.taxId       || '',
      website:     u.website     || '',
      logoPath:    u.logoPath    || '',
      planId:      u.subscription?.planId || '',
    })
  } catch {
    router.push('/admin/organizations')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value  = ''
  resetErrors()
  saving.value = true
  try {
    await api.put(`/organizations/${form.id}`, {
      name:        form.name,
      role:        form.role,
      isActive:    form.isActive,
      defaultPage: form.defaultPage || null,
      parentId:    form.parentId    || null,
      companyName: form.companyName?.trim() || null,
      address:     form.address?.trim()     || null,
      phone:       form.phone?.trim()       || null,
      taxId:       form.taxId?.trim()       || null,
      website:     form.website?.trim()     || null,
      planId:      form.planId               || null,
    })
    await api.put(`/organizations/${form.id}/roles`, { roleIds: form.roleIds })
    router.push('/admin/organizations')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('org.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
