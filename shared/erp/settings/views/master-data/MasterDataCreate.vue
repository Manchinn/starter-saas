<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.masterData.newTitle')" back-to="/erp/settings/master-data"
        :breadcrumb="[
          { label: t('erp.masterData.title'), to: '/erp/settings/master-data' },
          { label: t('erp.masterData.new') },
        ]">
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/settings/master-data"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('common.saving')"
            :save-label="t('common.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <FormCard :title="t('erp.masterData.categoryDetails')" :icon="CircleStackIcon" icon-color="primary">
        <div class="space-y-5">

          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Code (slug) -->
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('common.code') }} <span class="text-red-500 normal-case font-normal">*</span>
                <span class="ml-1 normal-case font-normal text-[#9BA7B0]">{{ t('erp.masterData.slugHint') }}</span>
              </label>
              <input v-model="form.slug" type="text" :placeholder="t('erp.masterData.slugPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm font-mono text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Name -->
            <div>
              <FieldLabel :text="t('common.name')" required />
              <input v-model="form.name" type="text" :placeholder="t('erp.masterData.namePh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Description -->
            <div class="col-span-2">
              <FieldLabel :text="t('common.description')" />
              <input v-model="form.description" type="text" :placeholder="t('erp.masterData.descPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Is System Data -->
            <div class="col-span-2">
              <label class="flex items-start gap-3 cursor-pointer select-none group">
                <div class="mt-0.5 flex-shrink-0">
                  <input type="checkbox" v-model="form.isSystem"
                    class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 accent-primary-500 cursor-pointer" />
                </div>
                <div>
                  <span class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider group-hover:text-[#1C2434] transition-colors">
                    {{ t('erp.masterData.isSystem') }}
                  </span>
                  <span class="block text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.masterData.isSystemHint') }}</span>
                </div>
              </label>
            </div>

          </div>

          <ErrorBanner :message="error" />

        </div>
      </FormCard>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CircleStackIcon,
  CheckIcon, ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useMasterDataStore } from '@/stores/masterData'

const router = useRouter()
const store  = useMasterDataStore()
const { t }  = useI18n()

const form   = ref({ slug: '', name: '', description: '', isSystem: false })
const saving = ref(false)
const error  = ref('')

async function save() {
  error.value = ''
  if (!form.value.slug.trim()) { error.value = t('erp.masterData.slugRequired'); return }
  if (!form.value.name.trim()) { error.value = t('erp.masterData.nameRequired'); return }
  saving.value = true
  try {
    const cat = await store.createCategory(form.value)
    router.push(`/erp/settings/master-data/${cat.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || t('erp.masterData.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
