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
              <select v-model="form.role"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="user">{{ t('org.roleUser') }}</option>
                <option value="admin">{{ t('org.roleAdmin') }}</option>
              </select>
            </div>

            <div v-if="form.role === 'user'">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('org.defaultPage') }}
              </label>
              <input v-model="form.defaultPage" type="text" :placeholder="t('org.defaultPagePlaceholder')"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <p class="text-xs text-[#9BA7B0] mt-1.5">{{ t('org.defaultPageHint') }}</p>
            </div>

            <div class="flex items-center gap-2.5">
              <input type="checkbox" id="chk-active" v-model="form.isActive" class="rounded border-[#CBD5E1] w-4 h-4" />
              <label for="chk-active" class="text-sm text-[#374151]">{{ t('org.accountActive') }}</label>
            </div>

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
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()

const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')
const allRoles = ref([])

const form = reactive({
  id: null, name: '', email: '', role: 'user', isActive: true, defaultPage: '', roleIds: [],
})

onMounted(async () => {
  try {
    const [orgRes, rolesRes] = await Promise.all([
      api.get(`/organizations/${route.params.id}`),
      api.get('/roles'),
    ])
    const u = orgRes.data.data.organization
    allRoles.value = rolesRes.data.data.roles
    Object.assign(form, {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      role:        u.role,
      isActive:    u.isActive,
      defaultPage: u.defaultPage || '',
      roleIds:     (u.roles || []).map(r => r.id),
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
