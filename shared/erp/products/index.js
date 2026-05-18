import { CubeIcon, TagIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/item-master',
    name: 'erp-item-master',
    component: () => import('./views/products/ProductsList.vue'),
    meta: { requiresAuth: true, title: 'Product Master' },
  },
  {
    path: '/erp/item-master/create',
    name: 'erp-item-master-create',
    component: () => import('./views/products/ProductCreate.vue'),
    meta: { requiresAuth: true, title: 'New Product Master' },
  },
  {
    path: '/erp/item-master/:id/edit',
    name: 'erp-item-master-edit',
    component: () => import('./views/products/ProductEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Product Master' },
  },
  {
    path: '/erp/product-categories',
    name: 'erp-product-categories',
    component: () => import('./views/categories/ProductCategoriesList.vue'),
    meta: { requiresAuth: true, title: 'Product Category' },
  },
  {
    path: '/erp/product-categories/create',
    name: 'erp-product-categories-create',
    component: () => import('./views/categories/ProductCategoryCreate.vue'),
    meta: { requiresAuth: true, title: 'New Category' },
  },
  {
    path: '/erp/product-categories/:id/edit',
    name: 'erp-product-categories-edit',
    component: () => import('./views/categories/ProductCategoryEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Category' },
  },
]

export const navChildren = [
  { label: 'nav.productCategory', to: '/erp/product-categories', icon: TagIcon,  permission: 'erp.products.list' },
  { label: 'nav.productMaster',   to: '/erp/item-master',        icon: CubeIcon, permission: 'erp.products.list' },
]
