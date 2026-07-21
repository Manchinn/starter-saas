import { CreditCardIcon, RectangleStackIcon, InboxArrowDownIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'billing',
  isCore: true,
  order: 91,
  routes: [
    { path: '/billing', name: 'billing', component: () => import('./views/Billing.vue'), meta: { requiresAuth: true, title: 'billing.title' } },
    // Old plan-picker URL — plans now live on /billing.
    { path: '/billing/plans', redirect: '/billing' },
    { path: '/admin/billing/plans', name: 'admin-billing-plans', component: () => import('./views/admin/PlanList.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.plans' } },
    { path: '/admin/billing/subscriptions', name: 'admin-billing-subscriptions', component: () => import('./views/admin/Subscriptions.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.subscriptions' } },
    {
      path: '/admin/billing/requests',
      name: 'admin-billing-requests',
      component: () => import('./views/admin/PlanRequests.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.planRequests' },
    },
    {
      path: '/admin/billing/subscriptions/:orgId',
      name: 'admin-billing-subscription-detail',
      component: () => import('./views/admin/SubscriptionDetail.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.subscriptionTitle' },
    },
    {
      path: '/admin/billing/subscriptions/:orgId/edit',
      name: 'admin-billing-subscription-edit',
      component: () => import('./views/admin/SubscriptionEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.editSubscription' },
    },
  ],
  navItem: { label: 'billing.title', to: '/billing', icon: CreditCardIcon },
  adminNavItem: {
    label: 'billing.admin', icon: CreditCardIcon,
    children: [
      { label: 'billing.plans', to: '/admin/billing/plans', icon: RectangleStackIcon, permission: 'billing.manage' },
      { label: 'billing.subscriptions', to: '/admin/billing/subscriptions', icon: CreditCardIcon, permission: 'billing.manage' },
      { label: 'billing.planRequests', to: '/admin/billing/requests', icon: InboxArrowDownIcon, permission: 'billing.manage' },
    ],
  },
}
