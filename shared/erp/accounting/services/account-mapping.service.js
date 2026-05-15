const { ChartOfAccount } = require('../../../../server/models')

/**
 * Map well-known accounting roles to ChartOfAccount records by code.
 * Codes match the seed in shared/erp/settings/demo-data.service.js.
 *
 * If a required account is missing, throws an error so the caller knows
 * to seed the chart of accounts before posting.
 */

const ROLE_TO_CODE = {
  AR:         '1130', // Accounts Receivable
  AP:         '2110', // Accounts Payable
  CASH:       '1110', // Cash
  BANK:       '1120', // Bank Account
  REVENUE:    '4110', // Product Sales
  INVENTORY:  '1140', // Inventory
  OUTPUT_TAX: '2140', // Output Tax (VAT) - on sales
  INPUT_TAX:  '1160', // Input Tax (VAT)  - on purchases
  COGS:       '5110', // Cost of Goods Sold
}

const cache = new Map() // key: `${orgId || 'null'}:${code}` → account record

const getByCode = async (code, organizationId) => {
  const key = `${organizationId || 'null'}:${code}`
  if (cache.has(key)) return cache.get(key)
  const acc = await ChartOfAccount.findOne({
    where: { code, organizationId: organizationId || null, status: 'active' },
  })
  if (acc) cache.set(key, acc)
  return acc
}

const getByRole = async (role, organizationId) => {
  const code = ROLE_TO_CODE[role]
  if (!code) throw new Error(`Unknown account role: ${role}`)
  const acc = await getByCode(code, organizationId)
  if (!acc) {
    throw {
      status: 400,
      message: `Missing chart of accounts entry "${code}" (${role}). Seed the chart of accounts or create this account before posting.`,
    }
  }
  return acc
}

// Pick cash vs bank account based on the receipt's payment method
const accountForPaymentMethod = async (paymentMethod, organizationId) => {
  switch ((paymentMethod || 'cash').toLowerCase()) {
    case 'bank_transfer':
    case 'cheque':
    case 'credit_card':
      return getByRole('BANK', organizationId)
    case 'cash':
    case 'other':
    default:
      return getByRole('CASH', organizationId)
  }
}

const clearCache = () => cache.clear()

module.exports = { ROLE_TO_CODE, getByCode, getByRole, accountForPaymentMethod, clearCache }
