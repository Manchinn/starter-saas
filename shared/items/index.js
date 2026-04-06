import {
  ClipboardDocumentListIcon,
  ListBulletIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'

export default {
  slug: 'items',
  isCore: false,   // → rendered under "Modules" section in the sidebar
  order: 20,
  routes: [
    {
      path: '/items',
      name: 'items-list',
      component: () => import('./views/ItemsList.vue'),
      meta: { requiresAuth: true, title: 'Items' },
    },
    {
      path: '/items/create',
      name: 'items-create',
      component: () => import('./views/ItemCreate.vue'),
      meta: { requiresAuth: true, title: 'Create Item' },
    },
    {
      path: '/items/:id/edit',
      name: 'items-edit',
      component: () => import('./views/ItemEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Item' },
    },
  ],
  navItem: {
    label: 'items',
    icon: ClipboardDocumentListIcon,
    children: [
      { label: 'View', to: '/items', icon: ListBulletIcon, permission: 'items.list' },
      { label: 'Create', to: '/items/create', icon: PlusCircleIcon, permission: 'items.edit' },
      { label: 'Edit', to: '/items', icon: PencilSquareIcon, permission: 'items.edit' },
    ],
  },
}
