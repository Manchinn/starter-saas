import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  HashtagIcon,
  CircleStackIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/settings/general',
    name: 'erp-settings-general',
    component: () => import('./views/general/GeneralSettings.vue'),
    meta: { requiresAuth: true, title: 'General Settings' },
  },
  {
    path: '/erp/settings/approval-thresholds',
    name: 'erp-settings-approval-thresholds',
    component: () => import('./views/thresholds/ApprovalThresholdsManage.vue'),
    meta: { requiresAuth: true, title: 'Approval Thresholds' },
  },
  {
    path: '/erp/settings/audit-log',
    name: 'erp-settings-audit-log',
    component: () => import('../audit/views/AuditLogList.vue'),
    meta: { requiresAuth: true, title: 'Audit Log' },
  },
  {
    path: '/erp/settings/currencies',
    name: 'erp-settings-currencies',
    component: () => import('./views/currencies/CurrenciesManage.vue'),
    meta: { requiresAuth: true, title: 'Currencies' },
  },
  {
    path: '/erp/settings/sequence',
    name: 'erp-settings-sequence',
    component: () => import('./views/sequences/SequenceList.vue'),
    meta: { requiresAuth: true, title: 'Sequence Numbers' },
  },
  {
    path: '/erp/settings/sequence/create',
    name: 'erp-settings-sequence-create',
    component: () => import('./views/sequences/SequenceEdit.vue'),
    meta: { requiresAuth: true, title: 'New Sequence' },
  },
  {
    path: '/erp/settings/sequence/:id/edit',
    name: 'erp-settings-sequence-edit',
    component: () => import('./views/sequences/SequenceEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Sequence' },
  },
  {
    path: '/erp/settings/master-data',
    name: 'erp-settings-master-data',
    component: () => import('./views/master-data/MasterDataList.vue'),
    meta: { requiresAuth: true, title: 'Master Data' },
  },
  {
    path: '/erp/settings/master-data/create',
    name: 'erp-settings-master-data-create',
    component: () => import('./views/master-data/MasterDataCreate.vue'),
    meta: { requiresAuth: true, title: 'New Master Data Category' },
  },
  {
    path: '/erp/settings/master-data/:id',
    name: 'erp-settings-master-data-edit',
    component: () => import('./views/master-data/MasterDataEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Master Data Category' },
  },
  {
    path: '/erp/settings/demo-data',
    name: 'erp-settings-demo-data',
    component: () => import('./views/demo/DemoData.vue'),
    meta: { requiresAuth: true, title: 'Demo Data' },
  },
]

export const navChildren = [
  { label: 'nav.general',              to: '/erp/settings/general',               icon: CurrencyDollarIcon,         permission: 'erp.settings.view' },
  { label: 'nav.approvalThresholds',   to: '/erp/settings/approval-thresholds',   icon: ShieldCheckIcon,            permission: 'erp.thresholds.list' },
  { label: 'nav.auditLog',             to: '/erp/settings/audit-log',             icon: ClipboardDocumentCheckIcon, permission: 'erp.audit.list' },
  { label: 'nav.currencies',           to: '/erp/settings/currencies',            icon: CurrencyDollarIcon,         permission: 'erp.currencies.list' },
  { label: 'nav.sequenceNumbers',      to: '/erp/settings/sequence',              icon: HashtagIcon,                permission: 'erp.settings.view' },
  { label: 'nav.masterData',           to: '/erp/settings/master-data',           icon: CircleStackIcon,            permission: 'erp.stock.edit' },
  { label: 'nav.demoData',             to: '/erp/settings/demo-data',             icon: SparklesIcon,               permission: 'erp.stock.edit' },
]
