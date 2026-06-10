import { CreditCardIcon, RectangleStackIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'billing',
  isCore: true,
  order: 92,
  routes: [
    // ── Self-service (any authenticated user; entry point is the user menu) ──
    {
      path: '/billing',
      name: 'billing',
      component: () => import('./views/Billing.vue'),
      meta: { requiresAuth: true, title: 'billing.title' },
    },
    {
      path: '/billing/plans',
      name: 'billing-plans',
      component: () => import('./views/Plans.vue'),
      meta: { requiresAuth: true, title: 'billing.choosePlan' },
    },

    // ── Admin: plan catalog + subscription oversight ─────────────────────────
    {
      path: '/admin/billing/plans',
      name: 'admin-billing-plans',
      component: () => import('./views/admin/PlanList.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.adminPlans' },
    },
    {
      path: '/admin/billing/plans/create',
      name: 'admin-billing-plan-create',
      component: () => import('./views/admin/PlanCreate.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.newPlan' },
    },
    {
      path: '/admin/billing/plans/:id/edit',
      name: 'admin-billing-plan-edit',
      component: () => import('./views/admin/PlanEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.editPlan' },
    },
    {
      path: '/admin/billing/subscriptions',
      name: 'admin-billing-subscriptions',
      component: () => import('./views/admin/Subscriptions.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'billing.adminSubscriptions' },
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

  // Admin management group — rendered in the Core "Admin" section for admins.
  adminNavItem: {
    label: 'billing.adminNav',
    icon: CreditCardIcon,
    children: [
      { label: 'billing.adminPlans',         to: '/admin/billing/plans',         icon: RectangleStackIcon, permission: 'billing.manage' },
      { label: 'billing.adminSubscriptions', to: '/admin/billing/subscriptions', icon: CreditCardIcon,     permission: 'billing.manage' },
    ],
  },
}
