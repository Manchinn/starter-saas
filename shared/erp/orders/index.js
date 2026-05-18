import { ShoppingCartIcon, TruckIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/orders',
    name: 'erp-orders',
    component: () => import('./views/order/OrdersList.vue'),
    meta: { requiresAuth: true, title: 'Sales Order' },
  },
  {
    path: '/erp/orders/create',
    name: 'erp-orders-create',
    component: () => import('./views/order/OrderCreate.vue'),
    meta: { requiresAuth: true, title: 'New Order' },
  },
  {
    path: '/erp/orders/:id/edit',
    name: 'erp-orders-edit',
    component: () => import('./views/order/OrderEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Order' },
  },
  {
    path: '/erp/orders/:id',
    name: 'erp-orders-detail',
    component: () => import('./views/order/OrderDetail.vue'),
    meta: { requiresAuth: true, title: 'Order Detail' },
  },
  {
    path: '/erp/delivery-orders',
    name: 'erp-delivery-orders',
    component: () => import('./views/delivery-order/DeliveryOrderList.vue'),
    meta: { requiresAuth: true, title: 'Delivery Orders' },
  },
  {
    path: '/erp/delivery-orders/create',
    name: 'erp-delivery-orders-create',
    component: () => import('./views/delivery-order/DeliveryOrderCreate.vue'),
    meta: { requiresAuth: true, title: 'New Delivery Order' },
  },
  {
    path: '/erp/delivery-orders/:id',
    name: 'erp-delivery-orders-detail',
    component: () => import('./views/delivery-order/DeliveryOrderDetail.vue'),
    meta: { requiresAuth: true, title: 'Delivery Order Detail' },
  },
]

export const navChildren = [
  { label: 'nav.salesOrder',     to: '/erp/orders',          icon: ShoppingCartIcon, permission: 'erp.orders.list' },
  { label: 'nav.deliveryOrders', to: '/erp/delivery-orders', icon: TruckIcon,        permission: 'erp.orders.list' },
]
