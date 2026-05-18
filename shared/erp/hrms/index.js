import { IdentificationIcon, UserGroupIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/hrms/employees',
    name: 'erp-hrms-employees',
    component: () => import('./views/employees/EmployeesList.vue'),
    meta: { requiresAuth: true, title: 'Employees' },
  },
  {
    path: '/erp/hrms/employees/create',
    name: 'erp-hrms-employees-create',
    component: () => import('./views/employees/EmployeeCreate.vue'),
    meta: { requiresAuth: true, title: 'New Employee' },
  },
  {
    path: '/erp/hrms/employees/:id/edit',
    name: 'erp-hrms-employees-edit',
    component: () => import('./views/employees/EmployeeEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Employee' },
  },
  {
    path: '/erp/hrms/departments',
    name: 'erp-hrms-departments',
    component: () => import('./views/departments/DepartmentsList.vue'),
    meta: { requiresAuth: true, title: 'Departments' },
  },
  {
    path: '/erp/hrms/departments/create',
    name: 'erp-hrms-departments-create',
    component: () => import('./views/departments/DepartmentCreate.vue'),
    meta: { requiresAuth: true, title: 'New Department' },
  },
  {
    path: '/erp/hrms/departments/:id/edit',
    name: 'erp-hrms-departments-edit',
    component: () => import('./views/departments/DepartmentEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Department' },
  },
]

export const navChildren = [
  {
    label: 'nav.hrms',
    icon: UserGroupIcon,
    children: [
      { label: 'nav.employees',   to: '/erp/hrms/employees',   icon: IdentificationIcon, permission: 'erp.hrms.list' },
      { label: 'nav.departments', to: '/erp/hrms/departments', icon: UserGroupIcon,      permission: 'erp.departments.list' },
    ],
  },
]
