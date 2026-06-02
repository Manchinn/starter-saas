// AI tools for the UOM-conversion controller (mirrors
// controllers/uom-conversion.controller.js + services/uom-conversion.service.js).
//
// Aggregated into ai-tools/index.js. A conversion has no name of its own, so it
// is identified by its (fromUom, toUom) pair — both resolved from free text via
// the UOM tools' resolveUom.

const { resolveUom } = require('./uom.ai-tools')

const navTargets = {
  uom_conversions_list:  { path: '/erp/uom-conversion',        label: 'UOM Conversion' },
  uom_conversion_create: { path: '/erp/uom-conversion/create', label: 'New UOM Conversion' },
}

const convSvc = () => require('../services/uom-conversion.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (r) => ({
  id:     r.id,
  from:   r.fromUom?.abbreviation || null,
  to:     r.toUom?.abbreviation || null,
  factor: Number(r.factor),
  notes:  r.notes || null,
})

// Resolve a (fromUom, toUom) pair to one existing conversion row.
async function resolveConversion(fromTerm, toTerm, user) {
  const from = await resolveUom(fromTerm, user)
  if (from.error) return { error: from.error }
  const to = await resolveUom(toTerm, user)
  if (to.error) return { error: to.error }

  const rows = await convSvc().list({ organizationId: orgOf(user) })
  const conv = rows.find((r) => r.fromUomId === from.uom.id && r.toUomId === to.uom.id)
  if (!conv) return { error: `No conversion from ${from.uom.abbreviation} to ${to.uom.abbreviation} exists.` }
  return { conv, from: from.uom, to: to.uom }
}

const tools = [
  {
    name: 'create_uom_conversion',
    kind: 'server',
    description: 'Create a unit-of-measure conversion: how many "to" units one "from" unit equals '
      + '(e.g. from Box to Piece, factor 12). Both units must already exist.',
    parameters: {
      type: 'object',
      properties: {
        fromUom: { type: 'string', description: 'Source unit name or abbreviation (required).' },
        toUom:   { type: 'string', description: 'Target unit name or abbreviation (required).' },
        factor:  { type: 'number', description: 'How many target units equal one source unit (> 0, required).' },
        notes:   { type: 'string' },
      },
      required: ['fromUom', 'toUom', 'factor'],
    },
    async handler(args, { user }) {
      const from = await resolveUom(args.fromUom, user)
      if (from.error) return { result: from.error }
      const to = await resolveUom(args.toUom, user)
      if (to.error) return { result: to.error }

      const created = await convSvc().create({
        fromUomId: from.uom.id,
        toUomId:   to.uom.id,
        factor:    args.factor,
        notes:     args.notes,
        createdBy: user.id,
        organizationId: orgOf(user),
      })
      return {
        result: slim(created),
        action: { type: 'navigate', target: 'uom_conversion_edit', path: `/erp/uom-conversion/${created.id}/edit`, label: `${from.uom.abbreviation} → ${to.uom.abbreviation}` },
      }
    },
  },

  {
    name: 'list_uom_conversions',
    kind: 'server',
    description: 'List all unit-of-measure conversions.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const rows = await convSvc().list({ organizationId: orgOf(user) })
      return {
        result: { total: rows.length, conversions: rows.map(slim) },
        action: { type: 'navigate', target: 'uom_conversions_list', path: '/erp/uom-conversion', label: 'UOM Conversion' },
      }
    },
  },

  {
    name: 'update_uom_conversion',
    kind: 'server',
    description: 'Update an existing conversion, identified by its from/to units. Change the factor and/or notes.',
    parameters: {
      type: 'object',
      properties: {
        fromUom: { type: 'string', description: 'Source unit identifying the conversion (required).' },
        toUom:   { type: 'string', description: 'Target unit identifying the conversion (required).' },
        factor:  { type: 'number', description: 'New factor (> 0).' },
        notes:   { type: 'string' },
      },
      required: ['fromUom', 'toUom'],
    },
    async handler(args, { user }) {
      const { conv, error } = await resolveConversion(args.fromUom, args.toUom, user)
      if (error) return { result: error }
      if (args.factor === undefined && args.notes === undefined) {
        return { result: 'Nothing to update — pass a factor and/or notes.' }
      }
      const updated = await convSvc().update(conv.id, { factor: args.factor, notes: args.notes }, user.id, orgOf(user))
      return {
        result: slim(updated),
        action: { type: 'navigate', target: 'uom_conversion_edit', path: `/erp/uom-conversion/${updated.id}/edit`, label: `${slim(updated).from} → ${slim(updated).to}` },
      }
    },
  },

  {
    name: 'delete_uom_conversion',
    kind: 'server',
    description: 'Delete a conversion, identified by its from/to units.',
    parameters: {
      type: 'object',
      properties: {
        fromUom: { type: 'string', description: 'Source unit identifying the conversion (required).' },
        toUom:   { type: 'string', description: 'Target unit identifying the conversion (required).' },
      },
      required: ['fromUom', 'toUom'],
    },
    async handler(args, { user }) {
      const { conv, from, to, error } = await resolveConversion(args.fromUom, args.toUom, user)
      if (error) return { result: error }
      await convSvc().remove(conv.id, orgOf(user))
      return {
        result: `Deleted conversion ${from.abbreviation} → ${to.abbreviation}.`,
        action: { type: 'navigate', target: 'uom_conversions_list', path: '/erp/uom-conversion', label: 'UOM Conversion' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveConversion, slim }
