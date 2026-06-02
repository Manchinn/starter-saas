// AI tools for the journal controller (mirrors
// controllers/journal.controller.js + services/journal.service.js).
//
// Read-only: list and inspect journal entries. Creating/posting journals is
// deliberately NOT exposed to the AI — entries must be balanced and pass
// tax-period locks, which belongs to the explicit journal pages.

const { orgOf } = require('./chart-of-account.ai-tools')

const navTargets = {
  journals:       { path: '/erp/accounting/journals',        label: 'Journal Entries' },
  journal_create: { path: '/erp/accounting/journals/create', label: 'New Journal Entry' },
}

const journalSvc = () => require('../services/journal.service')

// Compact a journal header for listing.
const slimHeader = (j) => ({
  id:          j.id,
  refNo:       j.refNo,
  date:        j.date,
  description: j.description,
  status:      j.status,
  totalDebit:  Number(j.totalDebit || 0),
})

// Full entry incl. balanced debit/credit lines (account code/name resolved).
const slimFull = (j) => ({
  ...slimHeader(j),
  lines: (j.lines || []).map((l) => ({
    lineNo:      l.lineNo,
    account:     l.account ? `${l.account.code} ${l.account.name}` : null,
    description: l.description,
    debit:       Number(l.debit || 0),
    credit:      Number(l.credit || 0),
  })),
})

// Resolve a free-text term (ref no / description) to one journal entry.
async function resolveJournal(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a journal reference number to identify the entry.' }

  const { journals } = await journalSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!journals.length) return { error: `No journal entry matches "${term}".` }
  if (journals.length === 1) return { journal: journals[0] }

  const lc = term.toLowerCase()
  const exact = journals.filter((j) => j.refNo && String(j.refNo).toLowerCase() === lc)
  if (exact.length === 1) return { journal: exact[0] }

  const refs = journals.map((j) => j.refNo).join(', ')
  return { error: `Multiple journal entries match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_journals',
    kind: 'server',
    description: 'List or search journal entries. Use when the user asks about journal entries, recent postings, or draft entries awaiting posting.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number or description filter.' },
        status: { type: 'string', enum: ['draft', 'posted', 'voided'], description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 20).' },
      },
    },
    async handler(args, { user }) {
      const { journals, total } = await journalSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 20, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, journals: journals.map(slimHeader) },
        action: { type: 'navigate', target: 'journals', path: '/erp/accounting/journals', label: 'Journal Entries' },
      }
    },
  },

  {
    name: 'get_journal',
    kind: 'server',
    description: "Look up a single journal entry's full details (all debit/credit lines) by its reference number.",
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the journal entry.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { journal, error } = await resolveJournal(args.search, user)
      if (error) return { result: error }
      const full = await journalSvc().getById(journal.id)
      return {
        result: slimFull(full),
        action: { type: 'navigate', target: 'journal_detail', path: `/erp/accounting/journals/${journal.id}`, label: journal.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveJournal, slimHeader, slimFull }
