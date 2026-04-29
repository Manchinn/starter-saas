<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div>
        <h1 class="page-title">{{ t('templates.title') }}</h1>
        <p class="page-subtitle">{{ t('templates.desc') }}</p>
      </div>

      <!-- Template grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        <button
          v-for="tmpl in templateStore.templates"
          :key="tmpl.slug"
          @click="apply(tmpl.slug)"
          class="group text-left rounded-2xl border-2 overflow-hidden transition-all duration-150
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          :class="templateStore.currentSlug === tmpl.slug
            ? 'border-primary-600 shadow-card-md'
            : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-card'"
        >
          <!-- Preview mockup -->
          <div class="h-36 relative overflow-hidden" :style="{ background: tmpl.preview.content }">

            <!-- Modern layout preview (top nav) -->
            <template v-if="tmpl.slug === 'modern'">
              <!-- Topbar -->
              <div class="absolute inset-x-0 top-0 h-7 flex items-center px-3 gap-2"
                   :style="{ background: tmpl.preview.topbar }">
                <div class="w-12 h-2 rounded" style="background:rgba(255,255,255,0.4)"></div>
                <div class="w-8 h-1.5 rounded" style="background:rgba(255,255,255,0.25)"></div>
                <div class="w-8 h-1.5 rounded" style="background:rgba(255,255,255,0.25)"></div>
                <div class="w-8 h-1.5 rounded" style="background:rgba(255,255,255,0.25)"></div>
                <div class="ml-auto w-4 h-4 rounded-full" style="background:rgba(255,255,255,0.3)"></div>
              </div>
              <!-- Sub-header -->
              <div class="absolute inset-x-0 top-7 h-5 bg-white flex items-center px-3"
                   style="border-bottom:1px solid #e5e7eb">
                <div class="w-16 h-1.5 rounded bg-slate-300"></div>
              </div>
              <!-- Content blocks -->
              <div class="absolute inset-x-0 top-12 bottom-0 p-3 grid grid-cols-3 gap-2">
                <div class="bg-white rounded shadow-sm"></div>
                <div class="bg-white rounded shadow-sm"></div>
                <div class="bg-white rounded shadow-sm"></div>
              </div>
            </template>

            <!-- Sidebar layout preview (default / dark / minimal) -->
            <template v-else>
              <!-- Sidebar -->
              <div class="absolute inset-y-0 left-0 w-16 flex flex-col"
                   :style="{ background: tmpl.preview.sidebar }">
                <div class="h-7 flex items-center justify-center">
                  <div class="w-8 h-1.5 rounded" style="background:rgba(255,255,255,0.4)"></div>
                </div>
                <div class="flex-1 p-2 space-y-1.5">
                  <div class="h-1.5 rounded" :style="{ background: tmpl.slug === 'default' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }"></div>
                  <div class="h-1.5 rounded" :style="{ background: tmpl.slug === 'default' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)' }"></div>
                  <div class="h-1.5 rounded" :style="{ background: tmpl.slug === 'default' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)' }"></div>
                  <div class="h-1.5 rounded w-3/4" :style="{ background: tmpl.slug === 'default' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }"></div>
                </div>
              </div>
              <!-- Main -->
              <div class="absolute inset-y-0 left-16 right-0 flex flex-col">
                <!-- Topbar -->
                <div class="h-7 flex items-center px-3"
                     :style="{ background: tmpl.preview.topbar, borderBottom: '1px solid #e5e7eb' }">
                  <div class="w-14 h-1.5 rounded" :style="{ background: tmpl.preview.topbar === '#ffffff' ? '#d1d5db' : 'rgba(255,255,255,0.3)' }"></div>
                </div>
                <!-- Content blocks -->
                <div class="flex-1 p-2.5 grid grid-cols-2 gap-1.5"
                     :style="{ background: tmpl.preview.content }">
                  <div class="bg-white rounded shadow-sm"></div>
                  <div class="bg-white rounded shadow-sm"></div>
                  <div class="bg-white rounded shadow-sm col-span-2"></div>
                </div>
              </div>
            </template>

            <!-- Active badge -->
            <div
              v-if="templateStore.currentSlug === tmpl.slug"
              class="absolute top-2 right-2 flex items-center gap-1 bg-primary-500 text-white
                     text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              <CheckIcon class="w-3 h-3" />
              {{ t('templates.active') }}
            </div>
          </div>

          <!-- Info -->
          <div class="px-4 py-3"
               :class="templateStore.currentSlug === tmpl.slug ? 'bg-primary-50' : 'bg-white'">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-[#1C2434]">{{ tmpl.name }}</p>
              <div
                class="w-3 h-3 rounded-full border-2 border-white ring-2 flex-shrink-0 transition-all"
                :class="templateStore.currentSlug === tmpl.slug
                  ? 'ring-primary-600 bg-primary-500'
                  : 'ring-slate-300 bg-white group-hover:ring-slate-400'"
              ></div>
            </div>
            <p class="text-xs text-[#637381] mt-0.5">{{ tmpl.description }}</p>
          </div>
        </button>
      </div>

      <!-- Applied notice -->
      <div v-if="applied" class="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50
                                  border border-emerald-200 rounded-lg px-4 py-2.5">
        <CheckCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ t('templates.applied') }}
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useTemplateStore } from '@/stores/template'

const templateStore = useTemplateStore()
const applied       = ref(false)
const { t }         = useI18n()

function apply(slug) {
  if (templateStore.currentSlug === slug) return
  templateStore.apply(slug)
  applied.value = true
  setTimeout(() => { applied.value = false }, 3000)
}
</script>
