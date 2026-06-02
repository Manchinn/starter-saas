export default {
  billing: {
    // Nav / entry points
    nav: 'Billing',
    adminNav: 'Billing',

    // Self-service dashboard
    title: 'Billing',
    subtitle: 'Your plan, usage and invoices.',
    changePlan: 'Change plan',
    usage: 'Usage this period',
    unlimited: 'Unlimited',
    unlimitedOf: 'Unlimited {name}',
    renewsOn: 'Renews on',
    endsOn: 'Ends on',
    cancelPlan: 'Cancel subscription',
    cancelNotice: 'Your subscription is set to cancel at the end of the current period.',
    confirmCancel: 'Cancel your subscription? You will keep access until the end of the period.',
    freePrice: 'Free',

    invoices: 'Billing history',
    noInvoices: 'No invoices yet.',
    colDate: 'Date',
    colPlan: 'Plan',
    colAmount: 'Amount',
    colStatus: 'Status',

    // Pricing / plan picker
    choosePlan: 'Choose a plan',
    choosePlanDesc: 'Pick the plan that fits your team.',
    current: 'Current',
    selectPlan: 'Select plan',
    startTrial: 'Start {n}-day trial',
    subscribeFailed: 'Could not change the plan. Please try again.',

    // Admin — plans
    adminPlans: 'Plans',
    adminPlansDesc: 'Define the subscription tiers customers can choose.',
    newPlan: 'New plan',
    newPlanDesc: 'Create a subscription tier with its price, limits and features.',
    createPlan: 'Create plan',
    editPlan: 'Edit plan',
    editPlanDesc: 'Update this plan’s price, limits and features.',
    planDetails: 'Plan details',
    price: 'Price',
    currency: 'Currency',
    intervalLabel: 'Billing interval',
    trialDays: 'Trial days',
    active: 'Active',
    inactive: 'Inactive',
    public: 'Public',
    visibility: 'Visibility',
    limitsAndFeatures: 'Limits & features',
    jsonHint: 'JSON objects. Limits use -1 for unlimited; features map a key to true/false.',
    limits: 'Limits',
    features: 'Features',
    invalidLimits: 'Limits must be valid JSON.',
    invalidFeatures: 'Features must be valid JSON.',
    nameSlugRequired: 'Name and slug are required.',
    noPlans: 'No plans yet.',
    confirmDeletePlan: 'Delete the “{name}” plan?',
    deleteFailed: 'Could not delete the plan.',
    saveFailed: 'Could not save. Please check your input.',
    apply: 'Apply',

    // Admin — subscriptions
    adminSubscriptions: 'Subscriptions',
    adminSubscriptionsDesc: 'Review and override every organization’s subscription.',
    colOrg: 'Organization',
    renews: 'Renews',
    override: 'Override',
    noSubscriptions: 'No subscriptions yet.',

    interval: { month: 'month', year: 'year' },
    status: {
      none: 'No plan', trialing: 'Trial', active: 'Active',
      past_due: 'Past due', canceled: 'Canceled', expired: 'Expired',
    },
    invStatus: { open: 'Open', paid: 'Paid', void: 'Void' },

    // Metric / feature labels. Dotted keys (erp.invoices.monthly) are nested so
    // vue-i18n resolves them by path.
    metric: {
      seats: 'Team members',
      storageMb: 'Storage (MB)',
      erp: { invoices: { monthly: 'Invoices / month' } },
    },
    feature: {
      'ai-agent': 'AI assistant',
      erp: { invoices: 'Invoicing', purchasing: 'Purchasing' },
    },
  },
}
