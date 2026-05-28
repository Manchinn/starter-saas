// Unit tests for purchasing/purchase-requisition.service.
//
// Transactional create/update are deliberately not unit-tested (they need a
// fragile sequelize.transaction stand-in). We focus on guards, transitions,
// listOrders, createOrder validation, and generateReorder's grouping logic.

jest.mock('../../../../server/models', () => ({
  PurchaseRequisition:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  PurchaseRequisitionItem: { destroy: jest.fn(), create: jest.fn() },
  PurchaseOrder:           { findAll: jest.fn(), findOne: jest.fn() },
  Product:                 { findAll: jest.fn() },
  Vendor:                  {},
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))
jest.mock('../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'PR-1') }), { virtual: true })
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })
// The PR service does require('./purchase-order.service') from its own
// directory, so jest.mock must use that exact module-resolution path —
// relative-from-the-test-file would create a separate virtual module.
jest.mock('../services/purchase-order.service', () => ({ create: jest.fn() }))

const { Op } = require('sequelize')
const { PurchaseRequisition, PurchaseOrder, Product, PurchaseRequisitionItem } = require('../../../../server/models')
const audit = require('../../audit/audit.service')
const sequelize = require('../../../../server/config/database')
const poSvc = require('../services/purchase-order.service')
const service = require('../services/purchase-requisition.service')

describe('purchase-requisition.list', () => {
  beforeEach(() => {
    PurchaseRequisition.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, distinct, eager-loads vendor', async () => {
    PurchaseRequisition.findAndCountAll.mockResolvedValueOnce({ count: 5, rows: [{ id: 'pr1' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'o' })
    expect(out).toEqual({ total: 5, page: 2, limit: 5, requisitions: [{ id: 'pr1' }] })
    const args = PurchaseRequisition.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'vendor' })
  })

  test('search applies LIKE across refNo / requestedBy / department', async () => {
    await service.list({ search: 'q1', organizationId: 'o' })
    const or = PurchaseRequisition.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or.map(c => Object.keys(c)[0]).sort()).toEqual(['department', 'refNo', 'requestedBy'])
  })
})

describe('purchase-requisition.approve / reject', () => {
  test('approve refuses anything other than draft', async () => {
    PurchaseRequisition.findByPk.mockResolvedValue({ id: 'pr1', status: 'approved' })
    await expect(service.approve('pr1', 'u')).rejects.toEqual({ status: 400, message: 'Only draft requisitions can be approved' })
  })

  test('reject refuses anything other than draft', async () => {
    PurchaseRequisition.findByPk.mockResolvedValue({ id: 'pr1', status: 'rejected' })
    await expect(service.reject('pr1', 'u')).rejects.toEqual({ status: 400, message: 'Only draft requisitions can be rejected' })
  })

  test('approve happy path flips status and emits audit', async () => {
    const pr = { id: 'pr1', status: 'draft', refNo: 'PR-1', update: jest.fn().mockResolvedValue() }
    PurchaseRequisition.findByPk
      .mockResolvedValueOnce(pr)
      .mockResolvedValueOnce({ id: 'pr1' })
    await service.approve('pr1', 'u')
    expect(pr.update).toHaveBeenCalledWith({ status: 'approved', modifiedBy: 'u' })
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'pr.approve' }))
  })

  test('reject happy path flips status and emits audit', async () => {
    const pr = { id: 'pr1', status: 'draft', refNo: 'PR-1', update: jest.fn().mockResolvedValue() }
    PurchaseRequisition.findByPk
      .mockResolvedValueOnce(pr)
      .mockResolvedValueOnce({ id: 'pr1' })
    await service.reject('pr1', 'u')
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'pr.reject' }))
  })
})

describe('purchase-requisition.remove', () => {
  test('refuses approved or rejected requisitions', async () => {
    PurchaseRequisition.findByPk.mockResolvedValue({ id: 'pr1', status: 'approved' })
    await expect(service.remove('pr1'))
      .rejects.toEqual({ status: 400, message: 'Cannot delete an approved or rejected requisition' })
  })

  test('destroys a draft', async () => {
    const pr = { id: 'pr1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    PurchaseRequisition.findByPk.mockResolvedValue(pr)
    await service.remove('pr1')
    expect(pr.destroy).toHaveBeenCalled()
  })
})

describe('purchase-requisition.listOrders', () => {
  test('lists POs scoped to the requisition with vendor join', async () => {
    PurchaseOrder.findAll.mockResolvedValue([{ id: 'po1' }])
    await service.listOrders('pr1')
    expect(PurchaseOrder.findAll).toHaveBeenCalledWith({
      where: { requisitionId: 'pr1' },
      include: [{ model: expect.anything(), as: 'vendor', attributes: ['id', 'name', 'code'] }],
      order: [['createdAt', 'DESC']],
    })
  })
})

describe('purchase-requisition.createOrder', () => {
  test('refuses when requisition is not approved', async () => {
    PurchaseRequisition.findOne.mockResolvedValue({ id: 'pr1', status: 'draft', items: [] })
    await expect(service.createOrder('pr1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Only approved requisitions can be converted to a purchase order' })
  })

  test('refuses approved requisition with no vendor', async () => {
    PurchaseRequisition.findOne.mockResolvedValue({ id: 'pr1', status: 'approved', items: [{ qty: 1 }], vendorId: null })
    await expect(service.createOrder('pr1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Requisition has no vendor — set a vendor before converting' })
  })

  test('refuses approved requisition with no items', async () => {
    PurchaseRequisition.findOne.mockResolvedValue({ id: 'pr1', status: 'approved', items: [], vendorId: 'v' })
    await expect(service.createOrder('pr1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Requisition has no items' })
  })

  test('refuses when a PO already exists, naming it in the error', async () => {
    PurchaseRequisition.findOne.mockResolvedValue({
      id: 'pr1', status: 'approved', vendorId: 'v', refNo: 'PR-1',
      items: [{ qty: 1, productId: 'p' }],
    })
    PurchaseOrder.findOne.mockResolvedValue({ id: 'po-existing', refNo: 'PO-9' })
    await expect(service.createOrder('pr1', 'u', 'o'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('PO-9 already exists') })
    expect(poSvc.create).not.toHaveBeenCalled()
  })

  test('happy path: forwards items to purchase-order.create with unitPrice defaulted to 0', async () => {
    PurchaseRequisition.findOne.mockResolvedValue({
      id: 'pr1', status: 'approved', vendorId: 'v', refNo: 'PR-1',
      items: [
        { qty: 5, productId: 'p1', description: 'A', unitPrice: 12.50, notes: 'priority' },
        { qty: 2, productId: 'p2', description: null, product: { name: 'B' }, unitPrice: null, notes: null },
      ],
    })
    PurchaseOrder.findOne.mockResolvedValue(null)
    poSvc.create.mockResolvedValue({ id: 'po-new' })

    const out = await service.createOrder('pr1', 'u', 'org')
    expect(out).toEqual({ id: 'po-new' })
    const payload = poSvc.create.mock.calls[0][0]
    expect(payload.vendorId).toBe('v')
    expect(payload.requisitionId).toBe('pr1')
    expect(payload.items).toEqual([
      { productId: 'p1', description: 'A', qty: 5, unitPrice: 12.5, notes: 'priority' },
      // description falls back to product.name; unitPrice ?? 0
      { productId: 'p2', description: 'B', qty: 2, unitPrice: 0, notes: null },
    ])
  })
})

describe('purchase-requisition.generateReorder', () => {
  // sequelize.transaction returns { commit, rollback }; we just need it to
  // resolve so the loop can run.
  beforeEach(() => {
    sequelize.transaction.mockResolvedValue({ commit: jest.fn().mockResolvedValue(), rollback: jest.fn().mockResolvedValue() })
    PurchaseRequisition.create.mockResolvedValue({ id: 'pr-x', refNo: 'PR-x' })
  })

  test('returns early when nothing is below the reorder point', async () => {
    Product.findAll.mockResolvedValue([
      { id: 'p1', name: 'A', stock: 100, reorderPoint: 10, vendors: [] },  // healthy
    ])
    const out = await service.generateReorder({ userId: 'u', organizationId: 'org' })
    expect(out.created).toEqual([])
    expect(out.message).toMatch(/No products are below/)
    expect(PurchaseRequisition.create).not.toHaveBeenCalled()
  })

  test('groups low-stock products by primary vendor and creates one PR per group', async () => {
    Product.findAll.mockResolvedValue([
      // Below threshold, vendor A
      { id: 'p1', name: 'A1', stock: 2,  reorderPoint: 5,  reorderQty: 10, cost: 4, vendors: [{ id: 'v-A', name: 'AlphaCo' }] },
      // Below threshold, vendor A again
      { id: 'p2', name: 'A2', stock: 0,  reorderPoint: 3,  reorderQty: 0,  cost: 2, vendors: [{ id: 'v-A', name: 'AlphaCo' }] },
      // Below threshold, vendor B
      { id: 'p3', name: 'B1', stock: 1,  reorderPoint: 4,  reorderQty: 0,  cost: 7, vendors: [{ id: 'v-B', name: 'BetaCo' }] },
      // Below threshold, NO vendor → unassigned bucket
      { id: 'p4', name: 'U1', stock: 0,  reorderPoint: 2,  reorderQty: 5,  cost: 1, vendors: [] },
      // Healthy → filtered out
      { id: 'p5', name: 'OK', stock: 99, reorderPoint: 5,  reorderQty: 0,  cost: 1, vendors: [{ id: 'v-A' }] },
    ])
    const out = await service.generateReorder({ userId: 'u', organizationId: 'org' })

    // 3 groups: AlphaCo (2 products), BetaCo (1), unassigned (1)
    expect(out.created).toHaveLength(3)
    expect(PurchaseRequisition.create).toHaveBeenCalledTimes(3)
    expect(PurchaseRequisitionItem.create).toHaveBeenCalledTimes(4) // sum of items across groups

    // Suggested qty rules: reorderQty when > 0, else max(1, reorderPoint*2 − stock)
    const itemCalls = PurchaseRequisitionItem.create.mock.calls.map(c => c[0])
    const byProduct = Object.fromEntries(itemCalls.map(it => [it.productId, it]))
    expect(byProduct.p1.qty).toBe(10) // reorderQty wins
    expect(byProduct.p2.qty).toBe(Math.max(1, 3 * 2 - 0)) // 6
    expect(byProduct.p3.qty).toBe(Math.max(1, 4 * 2 - 1)) // 7
    expect(byProduct.p4.qty).toBe(5) // reorderQty wins
  })

  test('rolls back the transaction on any PR insertion failure', async () => {
    Product.findAll.mockResolvedValue([
      { id: 'p1', stock: 0, reorderPoint: 1, reorderQty: 0, cost: 1, vendors: [{ id: 'v', name: 'V' }] },
    ])
    const tx = { commit: jest.fn(), rollback: jest.fn().mockResolvedValue() }
    sequelize.transaction.mockResolvedValue(tx)
    PurchaseRequisition.create.mockRejectedValue(new Error('boom'))
    await expect(service.generateReorder({ userId: 'u', organizationId: 'org' })).rejects.toThrow('boom')
    expect(tx.rollback).toHaveBeenCalled()
  })
})
