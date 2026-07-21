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

Organization-admin employee drill-down is implemented: platform admins can open
an organization and manage that org's HR employees (`/hrms/employees?organizationId=…`)
while keeping organization-scoped employee, department, user-account, and central
RBAC models. Remaining HRMS product work can extend access-history detail and
read-only employee shells as needed.
