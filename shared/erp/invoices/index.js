import { DocumentTextIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/invoices',
    name: 'erp-invoices',
    component: () => import('./views/InvoicesList.vue'),
    meta: { requiresAuth: true, title: 'Invoices' },
  },
  {
    path: '/erp/invoices/create',
    name: 'erp-invoices-create',
    component: () => import('./views/InvoiceCreate.vue'),
    meta: { requiresAuth: true, title: 'New Invoice' },
  },
  {
    path: '/erp/invoices/:id/edit',
    name: 'erp-invoices-edit',
    component: () => import('./views/InvoiceEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Invoice' },
  },
  {
    path: '/erp/invoices/:id',
    name: 'erp-invoices-detail',
    component: () => import('./views/InvoiceDetail.vue'),
    meta: { requiresAuth: true, title: 'Invoice Detail' },
  },
]

export const navChildren = [
  { label: 'nav.invoices', to: '/erp/invoices', icon: DocumentTextIcon, permission: 'erp.invoices.list' },
]
