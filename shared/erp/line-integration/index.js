import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

export const routes = [{
  path: '/erp/settings/line',
  name: 'erp-settings-line',
  component: () => import('./views/LineConnectionSettings.vue'),
  meta: { requiresAuth: true, title: 'LINE Integration' },
}, {
  path: '/liff/:organizationId',
  name: 'line-liff-ordering',
  component: () => import('./views/LiffOrdering.vue'),
  meta: { requiresAuth: false, title: 'LINE Order' },
}]

export const navChildren = [
  { label: 'nav.lineIntegration', to: '/erp/settings/line', icon: ChatBubbleLeftRightIcon, permission: 'erp.line-integration.manage' },
]
