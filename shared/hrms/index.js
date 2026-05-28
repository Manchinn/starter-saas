import { IdentificationIcon, UserGroupIcon } from '@heroicons/vue/24/outline'

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
    ],
  },
}
