import { SparklesIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/ai/chat',
    name: 'ai-chat',
    component: () => import('./views/AiChat.vue'),
    meta: { requiresAuth: true, title: 'AI Assistant' },
  },
  {
    path: '/ai/dashboard',
    name: 'ai-dashboard',
    component: () => import('./views/AiDashboard.vue'),
    meta: { requiresAuth: true, title: 'AI Usage Dashboard' },
  },
  {
    path: '/ai/settings',
    name: 'ai-settings',
    component: () => import('./views/AiSettings.vue'),
    meta: { requiresAuth: true, title: 'AI Assistant Settings' },
  },
]

export default {
  slug: 'ai-agent',
  isCore: false,
  order: 45,
  routes,
  navItem: {
    label: 'nav.aiAgent',
    icon: SparklesIcon,
    children: [
      { label: 'nav.aiChat',      to: '/ai/chat',      icon: ChatBubbleLeftRightIcon, permission: 'ai-agent.use' },
      { label: 'nav.aiDashboard', to: '/ai/dashboard', icon: ChartBarIcon,            permission: 'ai-agent.use' },
      { label: 'nav.aiSettings',  to: '/ai/settings',  icon: Cog6ToothIcon,           permission: 'ai-agent.settings' },
    ],
  },
}
