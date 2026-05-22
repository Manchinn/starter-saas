<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- ─ Page header ──────────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('templates.title') }}</h1>
          <p class="page-subtitle">{{ t('templates.desc') }}</p>
        </div>
      </div>

      <!-- ─ Active template hero ─────────────────────────────────────────── -->
      <section class="border border-[#E2E8F0] bg-gradient-to-br from-primary-50 via-white to-violet-50 shadow-card p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm flex-shrink-0">
              <SparklesIcon class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p class="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">{{ t('templates.currentlyActive') }}</p>
              <p class="text-lg font-bold text-[#1C2434] leading-tight mt-0.5">{{ activeTemplate.name }}</p>
              <p class="text-[13px] text-[#637381]">{{ activeTemplate.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-green">
              <span class="w-1.5 h-1.5 bg-emerald-500"></span>
              {{ t('templates.active') }}
            </span>
            <button
              v-if="!activeTemplate.isDefault"
              @click="apply('default')"
              class="btn-secondary text-[12.5px]"
            >
              <ArrowPathIcon class="w-4 h-4" />
              {{ t('templates.resetDefault') }}
            </button>
          </div>
        </div>
      </section>

      <!-- ─ Filter chips ─────────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mr-1">{{ t('common.filters') }}</span>
        <button
          v-for="f in filters" :key="f.id"
          @click="filter = f.id"
          :class="[
            'px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5',
            filter === f.id
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC]'
          ]"
        >
          <component v-if="f.icon" :is="f.icon" class="w-3.5 h-3.5" />
          {{ t(f.labelKey) }}
          <span class="text-[#9BA7B0] tabular">{{ f.count }}</span>
        </button>
      </div>

      <!-- ─ Template grid ────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <article
          v-for="tmpl in filtered" :key="tmpl.slug"
          class="group border bg-white overflow-hidden flex flex-col transition-all duration-150"
          :class="isActive(tmpl) ? 'border-primary-500 shadow-card-md ring-1 ring-primary-200' : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-card'"
        >
          <!-- Preview mockup -->
          <div class="aspect-[16/10] relative overflow-hidden border-b border-[#E2E8F0]"
               :style="{ background: tmpl.preview.content }">

            <!-- Modern (top nav) layout preview -->
            <template v-if="tmpl.tags?.nav === 'topNav'">
              <div class="absolute inset-x-0 top-0 h-8 flex items-center px-4 gap-3"
                   :style="{ background: tmpl.preview.topbar }">
                <div class="w-14 h-2" style="background:rgba(255,255,255,0.45)"></div>
                <div class="w-9 h-1.5" style="background:rgba(255,255,255,0.25)"></div>
                <div class="w-9 h-1.5" style="background:rgba(255,255,255,0.25)"></div>
                <div class="w-9 h-1.5" style="background:rgba(255,255,255,0.25)"></div>
                <div class="ml-auto flex items-center gap-2">
                  <div class="w-12 h-1.5" style="background:rgba(255,255,255,0.2)"></div>
                  <div class="w-4 h-4" style="background:rgba(255,255,255,0.35)"></div>
                </div>
              </div>
              <div class="absolute inset-x-0 top-8 h-5 bg-white border-b border-slate-200 flex items-center px-4">
                <div class="w-20 h-1.5 bg-slate-300"></div>
              </div>
              <div class="absolute inset-x-0 top-14 bottom-0 p-3 space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <div class="h-7 bg-white shadow-sm"></div>
                  <div class="h-7 bg-white shadow-sm"></div>
                  <div class="h-7 bg-white shadow-sm"></div>
                </div>
                <div class="h-12 bg-white shadow-sm"></div>
                <div class="grid grid-cols-2 gap-2">
                  <div class="h-8 bg-white shadow-sm"></div>
                  <div class="h-8 bg-white shadow-sm"></div>
                </div>
              </div>
            </template>

            <!-- Sidebar layout preview -->
            <template v-else>
              <div class="absolute inset-y-0 left-0 w-20 flex flex-col"
                   :style="{ background: tmpl.preview.sidebar }">
                <div class="h-8 flex items-center justify-center">
                  <div class="w-10 h-2" style="background:rgba(255,255,255,0.45)"></div>
                </div>
                <div class="flex-1 p-2.5 space-y-1.5">
                  <div class="h-2" :style="{ background: tmpl.tags?.theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.45)' }"></div>
                  <div class="h-2" :style="{ background: tmpl.tags?.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)' }"></div>
                  <div class="h-2" :style="{ background: tmpl.tags?.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)' }"></div>
                  <div class="h-2 w-3/4" :style="{ background: tmpl.tags?.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.22)' }"></div>
                  <div class="h-2 w-2/3" :style="{ background: tmpl.tags?.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.22)' }"></div>
                </div>
              </div>
              <div class="absolute inset-y-0 left-20 right-0 flex flex-col">
                <div class="h-8 flex items-center px-3 border-b border-slate-200"
                     :style="{ background: tmpl.preview.topbar }">
                  <div class="w-16 h-1.5"
                       :style="{ background: tmpl.preview.topbar === '#ffffff' ? '#cbd5e1' : 'rgba(255,255,255,0.35)' }"></div>
                  <div class="ml-auto w-4 h-4"
                       :style="{ background: tmpl.preview.topbar === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }"></div>
                </div>
                <div class="flex-1 p-3 space-y-2"
                     :style="{ background: tmpl.preview.content }">
                  <div class="grid grid-cols-3 gap-2">
                    <div class="h-6 shadow-sm" :class="cardClass(tmpl)"></div>
                    <div class="h-6 shadow-sm" :class="cardClass(tmpl)"></div>
                    <div class="h-6 shadow-sm" :class="cardClass(tmpl)"></div>
                  </div>
                  <div class="h-12 shadow-sm" :class="cardClass(tmpl)"></div>
                  <div class="h-7 shadow-sm" :class="cardClass(tmpl)"></div>
                </div>
              </div>
            </template>

            <!-- Active corner badge -->
            <div
              v-if="isActive(tmpl)"
              class="absolute top-2 right-2 flex items-center gap-1 bg-primary-600 text-white text-[10.5px] font-semibold px-2 py-1 shadow-sm"
            >
              <CheckIcon class="w-3 h-3" />
              {{ t('templates.active') }}
            </div>
          </div>

          <!-- Info / actions -->
          <div class="p-4 flex-1 flex flex-col">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[14px] font-semibold text-[#1C2434] truncate">{{ tmpl.name }}</p>
                <p class="text-[12.5px] text-[#637381] mt-0.5 line-clamp-2">{{ tmpl.description }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 mt-3">
              <span :class="navBadgeClass(tmpl)" class="badge text-[11px]">
                <component :is="navIcon(tmpl)" class="w-3 h-3" />
                {{ t(`templates.nav.${tmpl.tags?.nav || 'sidebar'}`) }}
              </span>
              <span :class="themeBadgeClass(tmpl)" class="badge text-[11px]">
                <component :is="themeIcon(tmpl)" class="w-3 h-3" />
                {{ t(`templates.theme.${tmpl.tags?.theme || 'light'}`) }}
              </span>
              <span v-if="tmpl.isDefault" class="badge bg-[#F1F5F9] text-[#637381] text-[11px]">
                {{ t('templates.defaultBadge') }}
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
              <span class="text-[11px] font-mono text-[#9BA7B0] truncate">{{ tmpl.slug }}</span>
              <button
                v-if="!isActive(tmpl)"
                @click="apply(tmpl.slug)"
                class="btn-primary text-[12.5px] py-1.5"
              >
                {{ t('templates.applyTheme') }}
              </button>
              <span v-else class="text-[12px] font-medium text-emerald-700 inline-flex items-center gap-1">
                <CheckCircleIcon class="w-4 h-4" />
                {{ t('templates.inUse') }}
              </span>
            </div>
          </div>
        </article>

        <div v-if="!filtered.length" class="md:col-span-2 xl:col-span-3 text-center py-14 bg-white border border-[#E2E8F0]">
          <SparklesIcon class="w-8 h-8 mx-auto text-[#CBD5E1]" />
          <p class="text-sm text-[#9BA7B0] mt-2">{{ t('templates.noMatch') }}</p>
        </div>
      </div>

      <!-- ─ Applied toast ───────────────────────────────────────────────── -->
      <Transition name="toast">
        <div
          v-if="applied"
          class="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1C2434] text-white text-sm px-4 py-3 shadow-lg"
        >
          <CheckCircleIcon class="w-5 h-5 text-emerald-400" />
          <span>{{ t('templates.appliedToast', { name: activeTemplate.name }) }}</span>
        </div>
      </Transition>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CheckIcon, CheckCircleIcon, SparklesIcon, ArrowPathIcon,
  Squares2X2Icon, ViewColumnsIcon, SunIcon, MoonIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useTemplateStore } from '@/stores/template'

const templateStore = useTemplateStore()
const applied       = ref(false)
const filter        = ref('all')
const { t }         = useI18n()

const activeTemplate = computed(() => templateStore.current)

const filters = computed(() => {
  const all = templateStore.templates
  return [
    { id: 'all',     labelKey: 'common.all',          count: all.length,                                            icon: null },
    { id: 'sidebar', labelKey: 'templates.nav.sidebar', count: all.filter(t => t.tags?.nav === 'sidebar').length,   icon: ViewColumnsIcon },
    { id: 'topNav',  labelKey: 'templates.nav.topNav',  count: all.filter(t => t.tags?.nav === 'topNav').length,    icon: Squares2X2Icon },
    { id: 'light',   labelKey: 'templates.theme.light', count: all.filter(t => t.tags?.theme === 'light').length,   icon: SunIcon },
    { id: 'dark',    labelKey: 'templates.theme.dark',  count: all.filter(t => t.tags?.theme === 'dark').length,    icon: MoonIcon },
  ]
})

const filtered = computed(() => {
  const f = filter.value
  if (f === 'all')     return templateStore.templates
  if (f === 'sidebar') return templateStore.templates.filter(t => t.tags?.nav === 'sidebar')
  if (f === 'topNav')  return templateStore.templates.filter(t => t.tags?.nav === 'topNav')
  if (f === 'light')   return templateStore.templates.filter(t => t.tags?.theme === 'light')
  if (f === 'dark')    return templateStore.templates.filter(t => t.tags?.theme === 'dark')
  return templateStore.templates
})

function isActive(tmpl) { return templateStore.currentSlug === tmpl.slug }

function apply(slug) {
  if (templateStore.currentSlug === slug) return
  templateStore.apply(slug)
  applied.value = true
  setTimeout(() => { applied.value = false }, 2400)
}

function navIcon(t)   { return t.tags?.nav === 'topNav' ? Squares2X2Icon : ViewColumnsIcon }
function themeIcon(t) { return t.tags?.theme === 'dark' ? MoonIcon : SunIcon }

function navBadgeClass(t)   { return t.tags?.nav === 'topNav' ? 'bg-violet-50 text-violet-700' : 'bg-primary-50 text-primary-700' }
function themeBadgeClass(t) { return t.tags?.theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-amber-50 text-amber-700' }

function cardClass(tmpl) {
  return tmpl.tags?.theme === 'dark' ? 'bg-slate-700/40' : 'bg-white'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
