<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.accounting.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">
            <template v-if="!loading">{{ total.toLocaleString() }} {{ total !== 1 ? t('erp.accounting.accounts') : t('erp.accounting.account') }}</template>
            <template v-else>{{ t('common.loading') }}</template>
          </p>
        </div>
        <RouterLink v-can="'erp.accounting.edit'" to="/erp/accounting/chart-of-accounts/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.accounting.new') }}
        </RouterLink>
      </div>

      <!-- Toolbar: search · show inactive · expand toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="relative flex-1 sm:max-w-md">
          <MagnifyingGlassIcon class="w-4 h-4 text-[#9BA7B0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input v-model="search" type="text" class="input pl-9" :placeholder="t('erp.accounting.searchPh')" />
        </div>
        <div class="flex items-center gap-4 sm:ml-auto">
          <label class="flex items-center gap-2 text-sm text-[#637381] cursor-pointer select-none">
            <input v-model="showInactive" type="checkbox" class="w-4 h-4 accent-primary-500 cursor-pointer" />
            {{ t('erp.accounting.showInactive') }}
          </label>
          <button v-if="!search.trim()" type="button" @click="allOpen ? collapseAll() : expandAll()"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">
            {{ allOpen ? t('erp.accounting.collapseAll') : t('erp.accounting.expandAll') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white border border-[#E2E8F0] shadow-sm p-10 flex items-center justify-center">
        <svg class="w-5 h-5 animate-spin text-[#9BA7B0]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <!-- Empty (no accounts at all) -->
      <div v-else-if="!accounts.length" class="bg-white border border-[#E2E8F0] shadow-sm">
        <div class="flex flex-col items-center gap-3 py-12">
          <div class="w-12 h-12 bg-[#F1F5F9] flex items-center justify-center">
            <BookOpenIcon class="w-6 h-6 text-[#9BA7B0]" />
          </div>
          <p class="text-sm font-medium text-[#637381]">{{ t('erp.accounting.noFound') }}</p>
          <RouterLink v-can="'erp.accounting.edit'" to="/erp/accounting/chart-of-accounts/create" class="btn-primary mt-1">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.accounting.new') }}
          </RouterLink>
        </div>
      </div>

      <!-- No search match -->
      <div v-else-if="!sections.length" class="bg-white border border-[#E2E8F0] shadow-sm">
        <div class="flex flex-col items-center gap-3 py-12">
          <div class="w-12 h-12 bg-[#F1F5F9] flex items-center justify-center">
            <MagnifyingGlassIcon class="w-6 h-6 text-[#9BA7B0]" />
          </div>
          <p class="text-sm font-medium text-[#637381]">{{ t('erp.accounting.searchNoMatch') }}</p>
        </div>
      </div>

      <!-- Grouped type sections -->
      <div v-else class="space-y-3">
        <div v-for="s in sections" :key="s.code" class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">

          <!-- Section header -->
          <button type="button" @click="toggleType(s.code)"
            class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
            <ChevronRightIcon class="w-4 h-4 text-[#9BA7B0] transition-transform duration-150 shrink-0" :class="s.expanded && 'rotate-90'" />
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="s.meta.dot" />
            <span class="font-semibold" :class="s.meta.text">{{ s.name }}</span>
            <span class="ml-auto text-xs font-medium text-[#9BA7B0] shrink-0">
              {{ s.count }} {{ s.count !== 1 ? t('erp.accounting.accounts') : t('erp.accounting.account') }}
            </span>
          </button>

          <!-- Account rows -->
          <div v-if="s.expanded" class="border-t border-[#F1F5F9] divide-y divide-[#F8FAFC]">
            <div v-for="r in s.rows" :key="r.id"
              class="group flex items-center gap-2.5 pr-3 py-2 hover:bg-primary-50/40 transition-colors"
              :style="{ paddingLeft: (16 + r.depth * 22) + 'px' }">

              <!-- Expand toggle (or spacer to keep alignment) -->
              <button v-if="r.hasChildren" type="button" @click="toggleNode(r.id)"
                class="p-0.5 -ml-1 text-[#9BA7B0] hover:text-primary-500 transition-colors shrink-0">
                <ChevronRightIcon class="w-3.5 h-3.5 transition-transform duration-150" :class="r.expanded && 'rotate-90'" />
              </button>
              <span v-else class="w-3.5 shrink-0" aria-hidden="true" />

              <span class="font-mono text-xs text-[#9BA7B0] w-16 shrink-0">{{ r.account.code }}</span>
              <span class="text-sm font-medium text-[#1C2434] truncate">{{ r.account.name }}</span>
              <span v-if="r.account.status === 'inactive'"
                class="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#F1F5F9] text-[#9BA7B0] shrink-0">
                {{ t('common.inactive') }}
              </span>

              <span class="ml-auto text-xs text-[#637381] shrink-0">{{ balanceLabel(r.account.normalBalance) }}</span>

              <!-- Hover actions -->
              <div class="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <RouterLink v-if="auth.hasPermission('erp.accounting.edit')"
                  :to="`/erp/accounting/chart-of-accounts/${r.account.id}/edit`"
                  class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors" :title="t('common.edit')">
                  <PencilIcon class="w-4 h-4" />
                </RouterLink>
                <button v-if="auth.hasPermission('erp.accounting.delete')" type="button" @click="confirmDelete(r.account)"
                  class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors" :title="t('common.delete')">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, PencilIcon, TrashIcon,
  ChevronRightIcon, MagnifyingGlassIcon, BookOpenIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const { t } = useI18n()
const auth = useAuthStore()

// Standard accounting presentation order; any custom types are appended after.
const TYPE_ORDER = ['asset', 'liability', 'equity', 'revenue', 'expense']
const TYPE_META = {
  asset:     { dot: 'bg-blue-500',   text: 'text-blue-700' },
  liability: { dot: 'bg-orange-500', text: 'text-orange-700' },
  equity:    { dot: 'bg-purple-500', text: 'text-purple-700' },
  revenue:   { dot: 'bg-green-500',  text: 'text-green-700' },
  expense:   { dot: 'bg-red-500',    text: 'text-red-700' },
}
const TYPE_FALLBACK = { dot: 'bg-slate-400', text: 'text-slate-600' }

const accounts           = ref([])
const accountTypeOptions = ref([])
const loading            = ref(false)
const search             = ref('')
const showInactive       = ref(false)
const collapsedTypes     = ref(new Set())
const collapsedNodes     = ref(new Set())

const total = computed(() => accounts.value.length)
const typeName = (code) => accountTypeOptions.value.find(v => v.code === code)?.name
  || (code ? code.charAt(0).toUpperCase() + code.slice(1) : code)
const balanceLabel = (b) => b === 'credit' ? t('erp.accounting.credit') : t('erp.accounting.debit')
const matches = (a, q) => !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)

// Link accounts into a parent→child tree, scoped to a single type. A parent in
// a different type (or hidden by the inactive filter) is absent from the set,
// so the orphan surfaces as a root rather than disappearing.
function buildTree(list) {
  const byId = new Map(list.map(a => [a.id, { ...a, children: [] }]))
  const roots = []
  for (const node of byId.values()) {
    const parent = node.parentId && byId.get(node.parentId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code))
    nodes.forEach(n => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

// Depth-first flatten into render rows. When a search is active we ignore the
// collapsed state and surface every match together with its ancestor chain so
// the hierarchy stays readable.
function flatten(nodes, depth, q, out) {
  for (const n of nodes) {
    const childRows = []
    flatten(n.children, depth + 1, q, childRows)
    if (q) {
      if (matches(n, q) || childRows.length) {
        out.push({ id: n.id, account: n, depth, hasChildren: childRows.length > 0, expanded: true })
        out.push(...childRows)
      }
    } else {
      const expanded = !collapsedNodes.value.has(n.id)
      out.push({ id: n.id, account: n, depth, hasChildren: n.children.length > 0, expanded })
      if (expanded) out.push(...childRows)
    }
  }
}

const sections = computed(() => {
  const q = search.value.trim().toLowerCase()
  const pool = showInactive.value ? accounts.value : accounts.value.filter(a => a.status === 'active')

  const order = [...TYPE_ORDER]
  for (const a of pool) if (!order.includes(a.accountType)) order.push(a.accountType)

  const out = []
  for (const code of order) {
    const typeAccounts = pool.filter(a => a.accountType === code)
    if (!typeAccounts.length) continue
    const expanded = q ? true : !collapsedTypes.value.has(code)
    const rows = expanded ? [] : null
    if (expanded) flatten(buildTree(typeAccounts), 0, q, rows)
    if (q && expanded && !rows.length) continue // hide non-matching sections while searching
    out.push({ code, name: typeName(code), meta: TYPE_META[code] || TYPE_FALLBACK, count: typeAccounts.length, expanded, rows: rows || [] })
  }
  return out
})

const allOpen = computed(() => collapsedTypes.value.size === 0)

function toggleType(code) {
  const next = new Set(collapsedTypes.value)
  next.has(code) ? next.delete(code) : next.add(code)
  collapsedTypes.value = next
}
function toggleNode(id) {
  const next = new Set(collapsedNodes.value)
  next.has(id) ? next.delete(id) : next.add(id)
  collapsedNodes.value = next
}
function expandAll()   { collapsedTypes.value = new Set(); collapsedNodes.value = new Set() }
function collapseAll() { collapsedTypes.value = new Set(sections.value.map(s => s.code)) }

async function fetch() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/accounting/chart-of-accounts', { params: { page: 1, limit: 1000 } })
    accounts.value = data.data.accounts
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const { data } = await api.get('/erp/master-data/by-name/Account Types')
  accountTypeOptions.value = data.data.values || []
  fetch()
})

async function confirmDelete(account) {
  if (!confirm(`Delete "${account.code} — ${account.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/accounting/chart-of-accounts/${account.id}`)
    fetch()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
