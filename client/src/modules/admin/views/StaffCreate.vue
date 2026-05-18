<template>
  <AppLayout>
    <div class="w-full space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <button @click="router.back()" class="btn-secondary px-2.5 py-2" :title="t('common.back')">
            <ArrowLeftIcon class="w-4 h-4" />
          </button>
          <div>
            <h1 class="page-title">{{ t('staff.createTitle') }}</h1>
            <p class="page-subtitle">{{ t('staff.createDesc') }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button @click="router.back()" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button @click="save" :disabled="saving" class="btn-primary">
            {{ saving ? t('staff.creating') : t('staff.create') }}
          </button>
        </div>
      </div>

      <!-- Form card -->
      <div class="card overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary-50">
            <UserPlusIcon class="w-4 h-4 text-primary-500" />
          </div>
          <h3 class="text-[13px] font-semibold text-[#374151]">{{ t('staff.accountInfo') }}</h3>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Left column — identity -->
            <section class="space-y-4">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('staff.sectionIdentity') }}</p>

              <div>
                <label class="label">{{ t('staff.fullName') }} <span class="text-red-500">{{ t('common.required') }}</span></label>
                <input v-model="form.name" type="text" class="input" :placeholder="t('staff.fullNamePh')" />
              </div>

              <div>
                <label class="label">{{ t('staff.emailUser') }} <span class="text-red-500">{{ t('common.required') }}</span></label>
                <input v-model="form.email" type="email" class="input" :placeholder="t('staff.emailPh')" />
              </div>

              <div>
                <label class="label">{{ t('auth.password') }} <span class="text-red-500">{{ t('common.required') }}</span></label>
                <input v-model="form.password" type="password" class="input" :placeholder="t('staff.passwordPh')" />
                <p class="mt-1 text-[11.5px] text-[#9BA7B0]">{{ t('staff.passwordHint') }}</p>
              </div>
            </section>

            <!-- Right column — access -->
            <section class="space-y-4">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('staff.sectionAccess') }}</p>

              <div v-if="!organizationId">
                <label class="label">{{ t('staff.orgLabel') }} <span class="text-red-500">{{ t('common.required') }}</span></label>
                <SearchSelect v-model="form.organizationId" :options="organizations" :allow-empty="false" :placeholder="t('staff.orgPh')" />
              </div>
              <div v-else>
                <label class="label">{{ t('staff.orgLabel') }}</label>
                <input :value="organizationLabel" type="text" disabled class="input bg-[#F7F9FC] text-[#637381]" />
              </div>

              <div>
                <label class="label">{{ t('staff.roleLabel') }}</label>
                <SearchSelect v-model="form.role" :options="ROLE_OPTIONS" :allow-empty="false" />
              </div>

              <div>
                <label class="label">{{ t('staff.statusLabel') }}</label>
                <SearchSelect v-model="form.isActive" :options="STATUS_OPTIONS" :allow-empty="false" />
              </div>
            </section>
          </div>

          <div v-if="error"
               class="mt-6 px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
            {{ error }}
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const route          = useRoute()
const router         = useRouter()
const { t }          = useI18n()
const organizationId = computed(() => route.query.organizationId)

const ROLE_OPTIONS = computed(() => [
  { id: 'user',  name: t('staff.roleUser') },
  { id: 'admin', name: t('staff.roleAdmin') },
])
const STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('common.active') },
  { id: false, name: t('common.inactive') },
])

const organizations = ref([])
const error         = ref('')
const saving        = ref(false)

const form = ref({
  name:           '',
  email:          '',
  password:       '',
  role:           'user',
  isActive:       true,
  organizationId: organizationId.value || '',
})

const organizationLabel = computed(() => {
  if (!organizationId.value) return ''
  const org = organizations.value.find((o) => o.id === organizationId.value)
  return org ? `${org.name} — ${org.email}` : organizationId.value
})

onMounted(async () => {
  const { data } = await api.get('/organizations', { params: { limit: 1000 } })
  organizations.value = data.data.organizations
})

async function save() {
  error.value = ''
  if (!form.value.name.trim())      { error.value = t('staff.nameRequired'); return }
  if (!form.value.email.trim())     { error.value = t('staff.emailRequired'); return }
  if (!form.value.organizationId)   { error.value = t('staff.orgRequired'); return }
  if (!form.value.password)         { error.value = t('staff.passwordRequired'); return }
  if (form.value.password.length < 8) { error.value = t('staff.passwordMinLength'); return }

  saving.value = true
  try {
    await api.post('/organizations', form.value)
    router.back()
  } catch (err) {
    error.value = err.response?.data?.message || t('staff.creationFailed')
  } finally {
    saving.value = false
  }
}
</script>
