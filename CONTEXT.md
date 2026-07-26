# SaaS (ERP)

Multi-tenant ERP on the fork base (`upstream` + LINE LIFF). Domain language for agents and humans working this tree. Implementation detail does not belong here — see `docs/adr/` for decisions and the code for behaviour.

## Stock

**Stock ledger**:
The single shared write path that applies a signed quantity delta to product (and optional store) balances and records one Stock movement. Callers own policy (locks, insufficient stock, package lines, legacy Item stock); the ledger only applies the delta.
_Avoid_: inventory service, stock helper, stock writer, stock util

**postDelta**:
The ledger’s one-line interface: one signed qty, one movement type, under the caller’s transaction.
_Avoid_: applyStock, adjustStock, mutateStock, writeMovement

**Stock movement**:
An immutable audit row for one balance change (type, signed qty, product-level stock before/after, optional store and document refs).
_Avoid_: stock log, inventory event, ledger entry (accounting sense)

**Product stock**:
The product-level on-hand quantity (`Product.stock`) that the ledger always updates.
_Avoid_: global stock, master stock, catalog qty

**Store stock**:
Per-store on-hand quantity (`StoreStock`) updated only when a store is in scope for the delta.
_Avoid_: warehouse qty, bin stock (unless a bin model is introduced)

**Stock count**:
Physical count / variance process. Intentionally **outside** the Stock ledger write path for now.
_Avoid_: inventory audit as synonym for ledger

**Stock transfer** (stock request):
Move quantity between stores (transfer out / transfer in). Intentionally **outside** the Stock ledger write path for now.
_Avoid_: stock move as synonym for ledger postDelta

## Documents that touch stock

**Stock adjust**:
Document that confirms arbitrary signed quantity changes through the Stock ledger (`type: adjust`).

**Stock issue**:
Document that issues stock out; insufficient-store policy stays on the issue module, then the ledger posts a negative delta (`type: issue`).

**Stock return**:
Document that returns stock (customer return increases; vendor return decreases) through the Stock ledger.

**Good receive**:
Inbound receipt that increases stock through the Stock ledger (`type: receive`).

**Sales order** (stock path):
Confirm cuts stock (`type: sale`); cancel restore posts (`type: sale_cancel`). Missing product on this path fails the whole transaction.

## Related non-stock (pointers only)

**Item stock**:
Legacy quantity on the Item master. Not owned by the Stock ledger; order flows may still touch it separately.
_Avoid_: conflating Item stock with Product stock

**Organization**:
Tenant boundary. Stock movements carry `organizationId` (explicit null allowed where the caller has no org).

## LINE (customer messaging + LIFF)

**LINE connection**:
Per-organization Messaging API + LIFF credentials and default store for ordering. Secrets stay encrypted; redacted views never expose them.
_Avoid_: LINE config, bot settings (when meaning the org connection record)

**LINE user mapping**:
Link from a LINE user id to one Customer within an organization (via a LINE connection).
_Avoid_: LINE account, social login as synonym for this mapping

**LIFF order**:
Customer-placed Sales order through LINE LIFF for the connection’s organization and default store; commercial fields are resolved server-side, not trusted from the client. The LINE module orchestrates create → confirm (and compensates a failed confirm); Sales order does not know about LIFF.
_Avoid_: chat order, bot order (unless a separate bot flow exists)

**Customer notify**:
Outbound best-effort message to a Customer by organization + customer id and plain text. Delivery channel is outside the Sales/Accounting transaction; absence of a channel is a no-op.
_Avoid_: LINE notify as the ERP-facing name, push notification (generic mobile), email notify

**Rich menu**:
The persistent tappable menu strip at the bottom of a LINE chat, managed through the Messaging API. The service is a passthrough — no local persistence; LINE is the source of truth. Each menu has areas (tap regions with actions), an image (JPEG/PNG), and optional aliases for `richmenuswitch` multi-level navigation.
_Avoid_: LINE menu, chat menu, bot menu (unless referring to the same LINE platform feature)

**Rich menu alias**:
A lowercase alphanumeric short name (max 32 chars) that points to a rich menu ID. Used by `richmenuswitch` actions to navigate between menus; aliases can be remapped at any time without changing the rich menu itself.
_Avoid_: aliasId, menu alias ID (when meaning the platform's `richMenuAliasId`)
