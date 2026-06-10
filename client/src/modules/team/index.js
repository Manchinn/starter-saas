export default {
  slug: 'team',
  isCore: true,
  order: 11,
  routes: [
    {
      path: '/team',
      name: 'team',
      component: () => import('./views/Team.vue'),
      meta: { requiresAuth: true, requiresTeamManager: true, title: 'team.title' },
    },
    {
      path: '/team/create',
      name: 'team-create',
      component: () => import('./views/TeamCreate.vue'),
      meta: { requiresAuth: true, requiresTeamManager: true, title: 'team.createTitle' },
    },
    {
      path: '/team/:id/edit',
      name: 'team-edit',
      component: () => import('./views/TeamEdit.vue'),
      meta: { requiresAuth: true, requiresTeamManager: true, title: 'team.editTitle' },
    },
  ],
  // No sidebar navItem — like Billing/Profile, the entry point is the topbar
  // user menu (gated by auth.canManageTeam), since the sidebar's non-admin
  // section only lists assigned ERP modules.
}
