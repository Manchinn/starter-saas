<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- ── Header ──────────────────────────────────────────────────────────── -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('reporting.erpSummary.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('reporting.erpSummary.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="lastUpdated" class="hidden sm:block text-xs text-[#9BA7B0] text-right leading-5">
            {{ todayLabel }}<br />
            <span class="text-[#CBD5E1]">{{ t('reporting.erpSummary.updated') }} {{ lastUpdated }}</span>
          </span>
          <button @click="load" :disabled="loading"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#637381]
                   bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors
                   disabled:opacity-50">
            <ArrowPathIcon class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
            {{ t('reporting.erpSummary.refresh') }}
          </button>
        </div>
      </div>

      <!-- ── Date range filter ───────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-3 bg-white border border-[#E2E8F0] shadow-sm px-4 py-3">
        <span class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">
          {{ t('reporting.erpSummary.filter.period') }}
        </span>
        <div class="flex items-center gap-1">
          <button v-for="p in presets" :key="p.days" @click="applyPreset(p.days)"
            class="px-2.5 py-1 text-xs font-medium border transition-colors"
            :class="activeDays === p.days
              ? 'bg-primary-50 text-primary-600 border-primary-200'
              : 'text-[#637381] border-[#E2E8F0] hover:bg-[#F7F9FC]'">
            {{ p.label }}
          </button>
        </div>
        <div class="h-5 w-px bg-[#E2E8F0]" />
        <div class="flex items-center gap-2">
          <input type="date" v-model="from" :max="to" @change="onDateChange"
            class="px-2 py-1 text-xs text-[#374151] border border-[#E2E8F0] focus:border-primary-300 focus:outline-none" />
          <span class="text-xs text-[#9BA7B0]">–</span>
          <input type="date" v-model="to" :min="from" :max="todayInput" @change="onDateChange"
            class="px-2 py-1 text-xs text-[#374151] border border-[#E2E8F0] focus:border-primary-300 focus:outline-none" />
          <button @click="load" :disabled="loading"
            class="px-3 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {{ t('reporting.erpSummary.filter.apply') }}
          </button>
        </div>
      </div>

      <!-- ── KPI Row ─────────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <div v-for="kpi in kpiCards" :key="kpi.key"
          class="bg-white border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-3">
          <div class="w-10 h-10 flex items-center justify-center flex-shrink-0" :class="kpi.iconBg">
            <component :is="kpi.icon" class="w-5 h-5" :class="kpi.iconColor" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ kpi.label }}</p>
            <div v-if="loading" class="mt-1 h-7 w-20 bg-[#F1F5F9] animate-pulse" />
            <p v-else class="text-xl font-extrabold text-[#1C2434] leading-none mt-1 tabular-nums">{{ kpi.value }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1 truncate">{{ kpi.desc }}</p>
          </div>
        </div>
      </div>

      <!-- ── Charts Row A: trend + invoice status ────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <ChartCard class="lg:col-span-2"
          :title="t('reporting.erpSummary.charts.salesTrend')"
          :desc="t('reporting.erpSummary.charts.salesTrendDesc')"
          :icon="PresentationChartLineIcon" icon-bg="bg-indigo-50" icon-color="text-indigo-600"
          :loading="loading" :empty="!hasSalesTrend">
          <Line :data="salesTrendData" :options="lineOpts" />
        </ChartCard>

        <ChartCard
          :title="t('reporting.erpSummary.charts.invoiceStatus')"
          :desc="t('reporting.erpSummary.charts.invoiceStatusDesc')"
          :icon="DocumentTextIcon" icon-bg="bg-blue-50" icon-color="text-blue-600"
          :loading="loading" :empty="!hasInvoiceStatus">
          <Doughnut :data="invoiceStatusData" :options="doughnutOpts" />
        </ChartCard>
      </div>

      <!-- ── Charts Row B: pipeline + AR aging + AR vs AP ────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <ChartCard
          :title="t('reporting.erpSummary.charts.pipeline')"
          :desc="t('reporting.erpSummary.charts.pipelineDesc')"
          :icon="FunnelIcon" icon-bg="bg-violet-50" icon-color="text-violet-600"
          :loading="loading" :empty="!hasPipeline">
          <Bar :data="pipelineData" :options="countBarOpts" />
        </ChartCard>

        <ChartCard
          :title="t('reporting.erpSummary.charts.arAging')"
          :desc="t('reporting.erpSummary.charts.arAgingDesc')"
          :icon="ClockIcon" icon-bg="bg-amber-50" icon-color="text-amber-600"
          :loading="loading" :empty="!hasArAging">
          <Bar :data="arAgingData" :options="moneyBarOpts" />
        </ChartCard>

        <ChartCard
          :title="t('reporting.erpSummary.charts.arVsAp')"
          :desc="t('reporting.erpSummary.charts.arVsApDesc')"
          :icon="ScaleIcon" icon-bg="bg-emerald-50" icon-color="text-emerald-600"
          :loading="loading" :empty="!hasArVsAp">
          <Doughnut :data="arVsApData" :options="moneyDoughnutOpts" />
        </ChartCard>
      </div>

      <!-- ── Charts Row C: stock by store (full width) ───────────────────────── -->
      <ChartCard
        :title="t('reporting.erpSummary.charts.stockByStore')"
        :desc="t('reporting.erpSummary.charts.stockByStoreDesc')"
        :icon="BuildingStorefrontIcon" icon-bg="bg-teal-50" icon-color="text-teal-600"
        :loading="loading" :empty="!hasStockByStore" body-class="h-72">
        <Bar :data="stockByStoreData" :options="horizontalBarOpts" />
      </ChartCard>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtNumber } from '@/utils/fmt'
import {
  ArrowPathIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, BanknotesIcon,
  CubeIcon, ArchiveBoxIcon, DocumentTextIcon, PresentationChartLineIcon,
  FunnelIcon, ClockIcon, ScaleIcon, BuildingStorefrontIcon, ChartBarIcon,
} from '@heroicons/vue/24/outline'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend, Filler,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale,
} from 'chart.js'

ChartJS.register(
  Title, Tooltip, Legend, Filler,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale,
)

// Defaults that match the app's Inter typeface and slate palette.
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif"
ChartJS.defaults.color = '#637381'

const { t } = useI18n()
const summary = ref(null)
const loading = ref(true)
const lastUpdated = ref('')

// ── Date range filter (defaults to the last 30 days) ───────────────────────
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d) }

const todayInput = ymd(new Date())
const from = ref(daysAgo(29))
const to = ref(todayInput)
const activeDays = ref(30)
const presets = [
  { days: 7,  label: t('reporting.erpSummary.filter.last7') },
  { days: 30, label: t('reporting.erpSummary.filter.last30') },
  { days: 90, label: t('reporting.erpSummary.filter.last90') },
]

function applyPreset(days) {
  activeDays.value = days
  to.value = todayInput
  from.value = daysAgo(days - 1)
  load()
}
function onDateChange() { activeDays.value = null }

const C = {
  indigo: '#6366f1', emerald: '#10b981', amber: '#f59e0b', blue: '#3b82f6',
  violet: '#8b5cf6', red: '#ef4444', orange: '#fb923c', teal: '#14b8a6',
  slate: '#64748b', rose: '#f43f5e', sky: '#0ea5e9',
}

const todayLabel = new Date().toLocaleDateString()

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/reporting/summary/erp', { params: { from: from.value, to: to.value } })
    summary.value = data.data
    lastUpdated.value = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch (err) {
    console.error('Failed to load ERP summary:', err.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── KPI cards ─────────────────────────────────────────────────────────────
const kpiCards = computed(() => {
  const k = summary.value?.kpis || {}
  return [
    { key: 'salesInPeriod', label: t('reporting.erpSummary.kpis.salesInPeriod'), desc: t('reporting.erpSummary.kpis.salesInPeriodDesc'),
      value: fmtMoney(k.salesInPeriod || 0), icon: ArrowTrendingUpIcon, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { key: 'invoicesInPeriod', label: t('reporting.erpSummary.kpis.invoicesInPeriod'), desc: t('reporting.erpSummary.kpis.invoicesInPeriodDesc'),
      value: fmtNumber(k.invoicesInPeriod || 0, 0), icon: DocumentTextIcon, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { key: 'ar', label: t('reporting.erpSummary.kpis.outstandingAR'), desc: t('reporting.erpSummary.kpis.arDesc'),
      value: fmtMoney(k.arOutstanding || 0), icon: CurrencyDollarIcon, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'ap', label: t('reporting.erpSummary.kpis.outstandingAP'), desc: t('reporting.erpSummary.kpis.apDesc'),
      value: fmtMoney(k.apOutstanding || 0), icon: BanknotesIcon, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { key: 'products', label: t('reporting.erpSummary.kpis.activeProducts'), desc: t('reporting.erpSummary.kpis.activeProductsDesc'),
      value: fmtNumber(k.activeProducts || 0, 0), icon: CubeIcon, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { key: 'stock', label: t('reporting.erpSummary.kpis.stockOnHand'), desc: t('reporting.erpSummary.kpis.stockOnHandDesc'),
      value: fmtNumber(k.totalStock || 0, 0), icon: ArchiveBoxIcon, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
  ]
})

// ── Helpers ─────────────────────────────────────────────────────────────
const sum = (arr) => arr.reduce((s, n) => s + (Number(n) || 0), 0)
// Trend keys are 'YYYY-MM-DD' for daily ranges and 'YYYY-MM' for monthly ones.
function trendLabel(key) {
  if (summary.value?.salesTrend?.granularity === 'day') {
    return new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  }
  const [y, m] = String(key).split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'short' })
}
function fmtCompact(n) {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(v))
}

// ── Chart datasets ─────────────────────────────────────────────────────────
const salesTrendData = computed(() => {
  const tr = summary.value?.salesTrend || { labels: [], data: [] }
  return {
    labels: tr.labels.map(trendLabel),
    datasets: [{
      label: t('reporting.erpSummary.legend.revenue'),
      data: tr.data,
      borderColor: C.indigo,
      backgroundColor: 'rgba(99,102,241,0.12)',
      pointBackgroundColor: C.indigo,
      pointRadius: 3, pointHoverRadius: 5,
      borderWidth: 2, tension: 0.35, fill: true,
    }],
  }
})
const hasSalesTrend = computed(() => sum(summary.value?.salesTrend?.data || []) > 0)

const invoiceStatusData = computed(() => {
  const s = summary.value?.invoiceStatus || {}
  return {
    labels: [
      t('reporting.erpSummary.status.draft'), t('reporting.erpSummary.status.sent'),
      t('reporting.erpSummary.status.paid'), t('reporting.erpSummary.status.cancelled'),
    ],
    datasets: [{
      data: [s.draft || 0, s.sent || 0, s.paid || 0, s.cancelled || 0],
      backgroundColor: [C.slate, C.blue, C.emerald, C.rose],
      borderWidth: 2, borderColor: '#fff',
    }],
  }
})
const hasInvoiceStatus = computed(() => {
  const s = summary.value?.invoiceStatus || {}
  return sum([s.draft, s.sent, s.paid, s.cancelled]) > 0
})

const pipelineData = computed(() => {
  const p = summary.value?.pipeline || {}
  return {
    labels: [
      t('reporting.erpSummary.pipeline.quotations'), t('reporting.erpSummary.pipeline.orders'),
      t('reporting.erpSummary.pipeline.deliveries'), t('reporting.erpSummary.pipeline.invoices'),
    ],
    datasets: [{
      data: [p.quotations || 0, p.orders || 0, p.deliveries || 0, p.invoices || 0],
      backgroundColor: [C.violet, C.emerald, C.amber, C.blue],
      borderRadius: 4, maxBarThickness: 48,
    }],
  }
})
const hasPipeline = computed(() => {
  const p = summary.value?.pipeline || {}
  return sum([p.quotations, p.orders, p.deliveries, p.invoices]) > 0
})

const arAgingData = computed(() => {
  const a = summary.value?.arAging || {}
  return {
    labels: [
      t('reporting.erpSummary.aging.current'), t('reporting.erpSummary.aging.d1_30'),
      t('reporting.erpSummary.aging.d31_60'), t('reporting.erpSummary.aging.d60plus'),
    ],
    datasets: [{
      data: [a.current || 0, a.d1_30 || 0, a.d31_60 || 0, a.d60plus || 0],
      backgroundColor: [C.emerald, C.amber, C.orange, C.red],
      borderRadius: 4, maxBarThickness: 48,
    }],
  }
})
const hasArAging = computed(() => {
  const a = summary.value?.arAging || {}
  return sum([a.current, a.d1_30, a.d31_60, a.d60plus]) > 0
})

const arVsApData = computed(() => {
  const v = summary.value?.arVsAp || {}
  return {
    labels: [t('reporting.erpSummary.legend.receivable'), t('reporting.erpSummary.legend.payable')],
    datasets: [{
      data: [v.ar || 0, v.ap || 0],
      backgroundColor: [C.blue, C.amber],
      borderWidth: 2, borderColor: '#fff',
    }],
  }
})
const hasArVsAp = computed(() => {
  const v = summary.value?.arVsAp || {}
  return sum([v.ar, v.ap]) > 0
})

const stockByStoreData = computed(() => {
  const rows = summary.value?.stockByStore || []
  return {
    labels: rows.map((r) => r.store?.name || t('reporting.erpSummary.unassigned')),
    datasets: [{
      label: t('reporting.erpSummary.kpis.stockOnHand'),
      data: rows.map((r) => r.totalStock),
      backgroundColor: C.teal,
      borderRadius: 4, maxBarThickness: 28,
    }],
  }
})
const hasStockByStore = computed(() => (summary.value?.stockByStore || []).length > 0)

// ── Chart options ───────────────────────────────────────────────────────────
const gridY = { grid: { color: '#F1F5F9' }, ticks: { color: '#9BA7B0', font: { size: 11 } }, beginAtZero: true }
const noGridX = { grid: { display: false }, ticks: { color: '#9BA7B0', font: { size: 11 } } }

const lineOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (c) => fmtMoney(c.parsed.y) } },
  },
  scales: {
    x: { ...noGridX, ticks: { ...noGridX.ticks, autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
    y: { ...gridY, ticks: { ...gridY.ticks, callback: (v) => fmtCompact(v) } },
  },
}

const countBarOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: noGridX, y: { ...gridY, ticks: { ...gridY.ticks, precision: 0 } } },
}

const moneyBarOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (c) => fmtMoney(c.parsed.y) } },
  },
  scales: { x: noGridX, y: { ...gridY, ticks: { ...gridY.ticks, callback: (v) => fmtCompact(v) } } },
}

const horizontalBarOpts = {
  indexAxis: 'y',
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#F1F5F9' }, ticks: { color: '#9BA7B0', font: { size: 11 }, callback: (v) => fmtCompact(v) }, beginAtZero: true },
    y: noGridX,
  },
}

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, cutout: '62%',
  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14, color: '#637381', font: { size: 12 } } } },
}

const moneyDoughnutOpts = {
  ...doughnutOpts,
  plugins: {
    ...doughnutOpts.plugins,
    tooltip: { callbacks: { label: (c) => `${c.label}: ${fmtMoney(c.parsed)}` } },
  },
}

// ── Local chart-card wrapper (header + skeleton + empty state) ───────────────
const ChartCard = {
  props: {
    title: String, desc: String, icon: Object,
    iconBg: { type: String, default: 'bg-slate-50' },
    iconColor: { type: String, default: 'text-slate-600' },
    loading: Boolean, empty: Boolean,
    bodyClass: { type: String, default: 'h-64' },
  },
  setup(props, { slots }) {
    return () => h('div', { class: 'bg-white border border-[#E2E8F0] shadow-sm overflow-hidden' }, [
      h('div', { class: 'px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5' }, [
        h('div', { class: `w-7 h-7 flex items-center justify-center ${props.iconBg}` },
          props.icon ? [h(props.icon, { class: `w-4 h-4 ${props.iconColor}` })] : []),
        h('div', {}, [
          h('h2', { class: 'text-sm font-semibold text-[#1C2434]' }, props.title),
          props.desc ? h('p', { class: 'text-xs text-[#9BA7B0]' }, props.desc) : null,
        ]),
      ]),
      h('div', { class: `p-4 ${props.bodyClass}` }, [
        props.loading
          ? h('div', { class: 'w-full h-full bg-[#F8FAFC] animate-pulse' })
          : props.empty
            ? h('div', { class: 'w-full h-full flex flex-col items-center justify-center text-center' }, [
                h(ChartBarIcon, { class: 'w-9 h-9 text-slate-200 mb-2' }),
                h('p', { class: 'text-sm font-medium text-[#9BA7B0]' }, t('reporting.erpSummary.noData')),
              ])
            : slots.default?.(),
      ]),
    ])
  },
}
</script>
