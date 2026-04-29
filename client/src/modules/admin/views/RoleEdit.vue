<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/admin/roles" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('roles.editTitle') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('roles.editDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-else>

        <!-- Role Details -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('roles.roleDetails') }}</h2>
            <span v-if="form.isSystem" class="badge badge-amber ml-1">{{ t('roles.systemBadge') }}</span>
            <span class="text-xs font-mono text-[#9BA7B0] ml-auto">{{ form.slug }}</span>
          </div>
          <div class="px-6 py-5 space-y-5">
            <div class="grid grid-cols-2 gap-5">

              <!-- Name -->
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('common.name') }} <span class="text-red-500">*</span>
                </label>
                <input v-model="form.name" type="text"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>

              <!-- Description -->
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('common.description') }}
                </label>
                <textarea v-model="form.description" rows="3"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>

              <!-- Color -->
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('common.color') }}
                </label>
                <div class="flex items-center gap-3">
                  <input type="color" v-model="form.color"
                    class="h-9 w-16 border border-[#E2E8F0] rounded-lg cursor-pointer p-0.5" />
                  <span class="text-sm font-mono text-[#637381]">{{ form.color }}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <RouterLink to="/admin/roles"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                   bg-primary-500 text-white rounded-xl hover:bg-primary-700
                   disabled:opacity-50 transition shadow-sm">
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
import { useRolesStore } from '@/stores/roles'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const rolesStore = useRolesStore()

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

const form = reactive({
  id:          null,
  name:        '',
  slug:        '',
  description: '',
  color:       '#6366f1',
  isSystem:    false,
})

onMounted(async () => {
  await rolesStore.fetchAll()
  const role = rolesStore.roles.find((r) => String(r.id) === route.params.id)
  if (!role) { router.push('/admin/roles'); return }
  Object.assign(form, {
    id:          role.id,
    name:        role.name        ?? '',
    slug:        role.slug        ?? '',
    description: role.description ?? '',
    color:       role.color       ?? '#6366f1',
    isSystem:    role.isSystem    ?? false,
  })
  loading.value = false
})

async function save() {
  error.value = ''
  saving.value = true
  try {
    await rolesStore.update(form.id, {
      name:        form.name,
      description: form.description,
      color:       form.color,
    })
    router.push('/admin/roles')
  } catch (err) {
    error.value = err.response?.data?.message || t('roles.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
