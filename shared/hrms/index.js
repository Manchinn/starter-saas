import { IdentificationIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/vue/24/outline'

const routes = [
  {
    path: '/hrms/employees',
    name: 'hrms-employees',
    component: () => import('./views/employees/EmployeesList.vue'),
    meta: { requiresAuth: true, title: 'Employees' },
  },
  {
    path: '/hrms/employees/create',
    name: 'hrms-employees-create',
    component: () => import('./views/employees/EmployeeCreate.vue'),
    meta: { requiresAuth: true, title: 'New Employee' },
  },
  {
    path: '/hrms/employees/:id/edit',
    name: 'hrms-employees-edit',
    component: () => import('./views/employees/EmployeeEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Employee' },
  },
  {
    path: '/hrms/departments',
    name: 'hrms-departments',
    component: () => import('./views/departments/DepartmentsList.vue'),
    meta: { requiresAuth: true, title: 'Departments' },
  },
  {
    path: '/hrms/departments/create',
    name: 'hrms-departments-create',
    component: () => import('./views/departments/DepartmentCreate.vue'),
    meta: { requiresAuth: true, title: 'New Department' },
  },
  {
    path: '/hrms/departments/:id/edit',
    name: 'hrms-departments-edit',
    component: () => import('./views/departments/DepartmentEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Department' },
  },
  {
    path: '/hrms/roles',
    name: 'hrms-roles',
    component: () => import('./views/roles/RolesList.vue'),
    meta: { requiresAuth: true, title: 'Roles' },
  },
  {
    path: '/hrms/roles/create',
    name: 'hrms-roles-create',
    component: () => import('./views/roles/RoleCreate.vue'),
    meta: { requiresAuth: true, title: 'New Role' },
  },
  {
    path: '/hrms/roles/:id/edit',
    name: 'hrms-roles-edit',
    component: () => import('./views/roles/RoleEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Role' },
  },
  {
    path: '/hrms/roles/:id/permissions',
    name: 'hrms-roles-permissions',
    component: () => import('./views/roles/RolePermissions.vue'),
    meta: { requiresAuth: true, title: 'Role Permissions' },
  },
  {
    path: '/hrms/permissions',
    name: 'hrms-permissions',
    component: () => import('./views/permissions/PermissionsList.vue'),
    meta: { requiresAuth: true, title: 'Permissions' },
  },
]

export default {
  slug: 'hrms',
  isCore: false,
  order: 35,
  routes,
  navItem: {
    label: 'nav.hrms',
    icon: UserGroupIcon,
    children: [
      { label: 'nav.employees',   to: '/hrms/employees',   icon: IdentificationIcon, permission: 'hrms.employees.list' },
      { label: 'nav.departments', to: '/hrms/departments', icon: UserGroupIcon,      permission: 'hrms.departments.list' },
      { label: 'nav.roles',       to: '/hrms/roles',       icon: ShieldCheckIcon,    permission: 'hrms.roles.list' },
      { label: 'nav.permissions', to: '/hrms/permissions', icon: KeyIcon,            permission: 'hrms.roles.list' },
    ],
  },
}
