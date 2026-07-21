# LINE module ownership + Customer notify port

LINE on this fork was split across `server/modules/line` (HTTP, crypto, LIFF orchestration) and `shared/erp/line-integration` (models, connection/user/message/notify, Vue), with shared requiring server crypto (inverted dependency) and Sales/Accounting hard-requiring `line-notification.service` after commit.

We deepen **one LINE module** under `shared/erp/line-integration`: LINE connection (incl. credential crypto), LINE user mapping, webhook handling, LIFF auth helpers, LIFF catalog composition, LIFF order orchestration (create → confirm + compensate; not a Sales API), and outbound LINE messaging. `server/modules/line` stays a thin HTTP + `register` adapter (routes/controller, inject notify on boot).

ERP outbound messaging uses a separate **Customer notify** port at `shared/erp/notifications/customer-notify.js`: interface `notifyCustomer({ organizationId, customerId, text })`, default no-op, best-effort outside the business transaction. Orders and receive-payment compose plain text and call only this port. LINE’s `register` installs the LINE push implementation. Post-LIFF “order received” push stays inside the LINE module (direct messaging), not via the port.

## Status

accepted and implemented (issues #2, #3)

## Considered options

- Notify-only deepen — rejected: leaves dual shallow packages and crypto inversion.
- Event-shaped callbacks (`onOrderStatusChanged`) or multi-channel `CustomerChannel` — deferred: only LINE exists; ERP already owns message text.
- Optional `require` of line-notification from orders — rejected: path still couples Sales to LINE.
- Pass `notify` into every service call — rejected: too many call sites on this tree.
- `createAndConfirm` on Sales for LIFF — deferred to Sales lifecycle deepen; LIFF keeps orchestrating create + confirm for now.
- In-app **alert** module as notify home — rejected: different domain (ERP announcements).
- Crypto stays on server with per-call injection — rejected: noise; shared already depends on server config/models.

## Consequences

- New ERP code must not `require` LINE notification services; use Customer notify only.
- New LINE behaviour belongs under `shared/erp/line-integration` unless it is pure HTTP wiring.
- Do not merge Customer notify into `shared/erp/alert`.
- Do not expand LINE into bot/broadcast/payment without a new decision.
- When Sales gains a single place-confirmed-order interface, LIFF orchestration should thin to that call without moving notify ownership.
