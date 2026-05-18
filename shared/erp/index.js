import {
  BuildingOffice2Icon,
  CubeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'

import { routes as dashboardRoutes, navChildren as dashboardNav }           from './dashboard/index.js'
import { routes as customerRoutes, navChildren as customersNav }            from './customers/index.js'
import { routes as vendorRoutes, navChildren as vendorsNav }                from './vendors/index.js'
import { routes as productRoutes, navChildren as productsNav }              from './products/index.js'
import { routes as inventoryRoutes, navChildren as inventoryDomainNav }    from './inventory/index.js'
import { routes as stockRoutes, inventoryNavChildren as stockInventoryNav, goodReceiveNavItem } from './stock/index.js'
import { routes as saleRoutes, navChildren as saleNav }                     from './sale/index.js'
import { routes as pricingRoutes, navChildren as pricingNav }               from './pricing/index.js'
import { routes as quotationRoutes, navChildren as quotationsNav }          from './quotations/index.js'
import { routes as orderRoutes, navChildren as ordersNav }                  from './orders/index.js'
import { routes as invoiceRoutes, navChildren as invoicesNav }              from './invoices/index.js'
import { routes as receiptRoutes, navChildren as receiptsNav }              from './receipts/index.js'
import { routes as accountingRoutes, receivePaymentsNavItem, billingDocNavChildren, navChildren as accountingNav, vendorBillsNavItem } from './accounting/index.js'
import { routes as purchasingRoutes, navChildren as purchasingNav }         from './purchasing/index.js'
import { routes as hrmsRoutes, navChildren as hrmsNav }                     from './hrms/index.js'
import { routes as settingsRoutes, navChildren as settingsNav }             from './settings/index.js'

export default {
  slug: 'erp',
  isCore: false,
  order: 30,
  routes: [
    ...dashboardRoutes,
    ...customerRoutes,
    ...vendorRoutes,
    ...productRoutes,
    ...inventoryRoutes,
    ...stockRoutes,
    ...saleRoutes,
    ...pricingRoutes,
    ...quotationRoutes,
    ...orderRoutes,
    ...invoiceRoutes,
    ...receiptRoutes,
    ...accountingRoutes,
    ...purchasingRoutes,
    ...hrmsRoutes,
    ...settingsRoutes,
  ],
  navItem: {
    label: 'nav.erp',
    icon: BuildingOffice2Icon,
    children: [
      ...dashboardNav,
      ...customersNav,
      ...vendorsNav,
      {
        label: 'nav.inventory',
        icon: CubeIcon,
        children: [
          ...productsNav,
          ...inventoryDomainNav,
          ...stockInventoryNav,
        ],
      },
      {
        label: 'nav.sales',
        icon: ShoppingCartIcon,
        children: [
          ...saleNav,
          ...pricingNav,
          ...quotationsNav,
          ...ordersNav,
        ],
      },
      {
        label: 'nav.billing',
        icon: CreditCardIcon,
        children: [
          receivePaymentsNavItem,
          ...invoicesNav,
          ...receiptsNav,
          ...billingDocNavChildren,
        ],
      },
      {
        label: 'nav.accounting',
        icon: BookOpenIcon,
        children: [
          ...accountingNav,
        ],
      },
      {
        label: 'nav.purchasing',
        icon: ShoppingBagIcon,
        children: [
          goodReceiveNavItem,
          ...purchasingNav,
          vendorBillsNavItem,
        ],
      },
      ...hrmsNav,
      {
        label: 'nav.settings',
        icon: Cog6ToothIcon,
        children: [
          ...settingsNav,
        ],
      },
    ],
  },
}
