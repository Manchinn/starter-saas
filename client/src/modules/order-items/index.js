import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'order-items',
  isCore: false,
  order: 50,
  routes: [
    {
      path: '/erp/order-items',
      name: 'order-items',
      component: () => import('./views/OrderItems.vue'),
      meta: { requiresAuth: true, title: 'Order Items' },
    },
    {
      path: '/erp/order-items/new',
      name: 'order-items-new',
      component: () => import('./views/NewOrderItem.vue'),
      meta: { requiresAuth: true, title: 'New Order Item' },
    },
    {
      path: '/erp/order-items/:id/edit',
      name: 'order-items-edit',
      component: () => import('./views/OrderItemEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Order Item' },
    },
  ],
}
