import { DocumentTextIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/quotations',
    name: 'erp-quotations',
    component: () => import('./views/QuotationsList.vue'),
    meta: { requiresAuth: true, title: 'Quotations' },
  },
  {
    path: '/erp/quotations/create',
    name: 'erp-quotations-create',
    component: () => import('./views/QuotationCreate.vue'),
    meta: { requiresAuth: true, title: 'New Quotation' },
  },
  {
    path: '/erp/quotations/:id/edit',
    name: 'erp-quotations-edit',
    component: () => import('./views/QuotationEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Quotation' },
  },
  {
    path: '/erp/quotations/:id',
    name: 'erp-quotations-detail',
    component: () => import('./views/QuotationDetail.vue'),
    meta: { requiresAuth: true, title: 'Quotation Detail' },
  },
]

export const navChildren = [
  { label: 'nav.quotations', to: '/erp/quotations', icon: DocumentTextIcon, permission: 'erp.quotations.list' },
]
