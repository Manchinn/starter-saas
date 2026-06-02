<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="$t('org.new')" :subtitle="$t('org.newDesc')" back-to="/admin/organizations" />

      <!-- Account Details -->
      <FormCard :title="$t('org.accountDetails')">
          <div class="grid grid-cols-2 gap-5">

            <FormField
              v-model="form.name"
              name="name"
              :label="$t('org.name')"
              :placeholder="$t('org.namePlaceholder')"
              required
              :errors="fieldErrors"
              wrapper-class="col-span-2"
            />

            <FormField
              v-model="form.email"
              name="email"
              type="email"
              :label="$t('org.email')"
              :placeholder="$t('org.emailPlaceholder')"
              required
              :errors="fieldErrors"
            />

            <FormField
              v-model="form.password"
              name="password"
              type="password"
              :label="$t('org.password')"
              :placeholder="$t('org.passwordPlaceholder')"
              required
              :errors="fieldErrors"
            />

          </div>
      </FormCard>

      <!-- Configuration -->
      <FormCard :title="$t('org.configuration')">
        <div class="space-y-5">

          <!-- Parent Organization -->
          <div>
            <label class="label">{{ $t('org.parentOrg') }}</label>
            <SearchSelect v-model="form.parentId" :options="allOrgs" :placeholder="$t('org.noParent')" :invalid="!!errorOf('parentId')" />
            <FieldError name="parentId" :errors="fieldErrors" />
          </div>

          <!-- System Role -->
          <div>
            <label class="label">{{ $t('org.systemRole') }}</label>
            <SearchSelect v-model="form.role" :options="ROLE_OPTIONS" :allow-empty="false" :invalid="!!errorOf('role')" />
            <FieldError name="role" :errors="fieldErrors" />
          </div>

          <!-- Default Page (user role only) -->
          <FormField
            v-if="form.role === 'user'"
            v-model="form.defaultPage"
            name="defaultPage"
            :label="$t('org.defaultPage')"
            :placeholder="$t('org.defaultPagePlaceholder')"
            :hint="$t('org.defaultPageHint')"
            :errors="fieldErrors"
          />

        </div>
      </FormCard>

      <!-- Subscription Plan -->
      <FormCard :title="$t('org.subscriptionPlan')" :subtitle="$t('org.subscriptionPlanDesc')">
        <label class="label">{{ $t('org.plan') }}</label>
        <SearchSelect v-model="form.planId" :options="planOptions" :placeholder="$t('org.planDefaultPlaceholder')" />
      </FormCard>

      <!-- Assigned Roles -->
      <FormCard :title="$t('org.assignedRoles')" :subtitle="$t('org.assignedRolesDesc')" :padded="false">
        <div class="divide-y divide-[#E2E8F0]">
          <label v-for="role in allRoles" :key="role.id"
            class="flex items-center gap-3 px-6 py-3 hover:bg-[#F7F9FC] cursor-pointer">
            <input type="checkbox" :value="role.id" v-model="form.roleIds"
              class="border-[#CBD5E1] w-4 h-4" />
            <span class="w-2.5 h-2.5 flex-shrink-0" :style="{ backgroundColor: role.color }" />
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-[#1C2434]">{{ role.name }}</span>
              <span class="ml-2 text-xs text-[#9BA7B0]">{{ role.slug }}</span>
            </div>
            <span class="text-xs text-[#9BA7B0]">{{ role.permissions?.length ?? 0 }} {{ $t('common.perms') }}</span>
          </label>
          <div v-if="!allRoles.length" class="px-6 py-4 text-sm text-[#9BA7B0] italic">
            {{ $t('org.noRolesAvailable') }}
          </div>
        </div>
      </FormCard>

      <ErrorBanner :message="error" />

      <FormFooter
        cancel-to="/admin/organizations"
        :cancel-label="$t('common.cancel')"
        :save-label="$t('org.create')"
        :saving-label="$t('common.saving')"
        :saving="saving"
        @save="save"
      />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'

const router = useRouter()
const { t } = useI18n()

const ROLE_OPTIONS = computed(() => [
  { id: 'user',  name: t('org.roleUser')  },
  { id: 'admin', name: t('org.roleAdmin') },
])

const allRoles = ref([])
const allOrgs  = ref([])
const allPlans = ref([])
const error    = ref('')
const saving   = ref(false)

const planOptions = computed(() => allPlans.value.map((p) => ({ id: p.id, name: planLabel(p) })))

function planLabel(p) {
  const n = Number(p.price)
  const price = n === 0 ? t('billing.freePrice') : `${n.toLocaleString()} ${p.currency}`
  return `${p.name} · ${price}`
}
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

const form = reactive({
  name:        '',
  email:       '',
  password:    '',
  role:        'user',
  defaultPage: '',
  parentId:    '',
  roleIds:     [],
  planId:      '',
})

onMounted(async () => {
  const [rolesRes, orgsRes, plansRes] = await Promise.all([
    api.get('/roles'),
    api.get('/organizations/all'),
    api.get('/billing/admin/plans'),
  ])
  allRoles.value = rolesRes.data.data.roles
  allOrgs.value  = orgsRes.data.data.organizations
  allPlans.value = (plansRes.data.data.plans || []).filter((p) => p.isActive)
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await api.post('/organizations', {
      name:        form.name,
      email:       form.email,
      password:    form.password,
      role:        form.role,
      defaultPage: form.defaultPage || null,
      parentId:    form.parentId    || null,
      roleIds:     form.roleIds,
      planId:      form.planId       || null,
    })
    router.push('/admin/organizations')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || 'Failed to create organization'
  } finally {
    saving.value = false
  }
}
</script>
