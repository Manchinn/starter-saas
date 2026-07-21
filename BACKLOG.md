# Backlog

Work intentionally deferred from completed implementation slices. Entries here
are actionable product work; `CHANGELOG.md` records shipped behavior.

## Billing

### Paid plan change and payment workflow

- Let an organization submit a request to change plan.
- Provide platform administrators an approval or rejection workflow.
- Integrate a payment provider with authenticated, idempotent webhooks.
- Activate a paid subscription only after verified payment or explicit
  administrative approval.
- Add focused tests for request state transitions and payment webhook handling.

## HRMS

### Staff Management

Continue with an organization-admin drill-down into employee management while
preserving the existing organization-scoped employee, department, user-account,
and central RBAC models.
