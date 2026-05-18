import { UsersIcon, TagIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/customers',
    name: 'erp-customers',
    component: () => import('./views/customers/CustomersList.vue'),
    meta: { requiresAuth: true, title: 'Customers' },
  },
  {
    path: '/erp/customers/create',
    name: 'erp-customers-create',
    component: () => import('./views/customers/CustomerCreate.vue'),
    meta: { requiresAuth: true, title: 'New Customer' },
  },
  {
    path: '/erp/customers/:id/edit',
    name: 'erp-customers-edit',
    component: () => import('./views/customers/CustomerEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Customer' },
  },
  {
    path: '/erp/customer-groups',
    name: 'erp-customer-groups',
    component: () => import('./views/groups/CustomerGroupsList.vue'),
    meta: { requiresAuth: true, title: 'Customer Groups' },
  },
  {
    path: '/erp/customer-groups/create',
    name: 'erp-customer-groups-create',
    component: () => import('./views/groups/CustomerGroupCreate.vue'),
    meta: { requiresAuth: true, title: 'New Customer Group' },
  },
  {
    path: '/erp/customer-groups/:id/edit',
    name: 'erp-customer-groups-edit',
    component: () => import('./views/groups/CustomerGroupEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Customer Group' },
  },
]

export const navChildren = [
  {
    label: 'nav.customers',
    icon: UsersIcon,
    children: [
      { label: 'nav.customers',      to: '/erp/customers',       icon: UsersIcon, permission: 'erp.customers.list' },
      { label: 'nav.customerGroups', to: '/erp/customer-groups', icon: TagIcon,   permission: 'erp.customer-groups.list' },
    ],
  },
]
