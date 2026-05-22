<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/admin/organizations" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ $t('org.new') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ $t('org.newDesc') }}</p>
        </div>
      </div>

      <!-- Account Details -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ $t('org.accountDetails') }}</h2>
        </div>
        <div class="px-6 py-5 space-y-5">

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
        </div>
      </div>

      <!-- Configuration -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ $t('org.configuration') }}</h2>
        </div>
        <div class="px-6 py-5 space-y-5">

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
      </div>

      <!-- Assigned Roles -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ $t('org.assignedRoles') }}</h2>
          <p class="text-xs text-[#9BA7B0] mt-0.5">{{ $t('org.assignedRolesDesc') }}</p>
        </div>
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
      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <RouterLink to="/admin/organizations"
          class="px-4 py-2.5 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition text-[#637381]">
          {{ $t('common.cancel') }}
        </RouterLink>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                 bg-primary-500 text-white hover:bg-primary-700
                 disabled:opacity-50 transition shadow-sm">
          {{ saving ? $t('common.saving') : $t('org.create') }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FormField from '@/components/form/FormField.vue'
import FieldError from '@/components/form/FieldError.vue'
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
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

const form = reactive({
  name:        '',
  email:       '',
  password:    '',
  role:        'user',
  defaultPage: '',
  parentId:    '',
  roleIds:     [],
})

onMounted(async () => {
  const [rolesRes, orgsRes] = await Promise.all([
    api.get('/roles'),
    api.get('/organizations/all'),
  ])
  allRoles.value = rolesRes.data.data.roles
  allOrgs.value  = orgsRes.data.data.organizations
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
