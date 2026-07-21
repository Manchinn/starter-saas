import { CreditCardIcon, RectangleStackIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'billing',
  isCore: true,
  order: 91,
  routes: [
    { path: '/billing', name: 'billing', component: () => import('./views/Billing.vue'), meta: { requiresAuth: true, title: 'billing.title' } },
    { path: '/billing/plans', name: 'billing-plans', component: () => import('./views/Plans.vue'), meta: { requiresAuth: true, title: 'billing.plans' } },
    { path: '/admin/billing/plans', name: 'admin-billing-plans', component: () => import('./views/admin/PlanList.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.plans' } },
    { path: '/admin/billing/subscriptions', name: 'admin-billing-subscriptions', component: () => import('./views/admin/Subscriptions.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.subscriptions' } },
  ],
  navItem: { label: 'billing.title', to: '/billing', icon: CreditCardIcon },
  adminNavItem: {
    label: 'billing.admin', icon: CreditCardIcon,
    children: [
      { label: 'billing.plans', to: '/admin/billing/plans', icon: RectangleStackIcon, permission: 'billing.manage' },
      { label: 'billing.subscriptions', to: '/admin/billing/subscriptions', icon: CreditCardIcon, permission: 'billing.manage' },
    ],
  },
}
