# Stock ledger as the shared stock write path

Stock confirm flows (adjust, issue, return, goods receive, sales order confirm/cancel) used to each update Product stock, optional Store stock, and Stock movement inline. That made the write path shallow, easy to drift, and hard to test as one surface.

We deepened a **Stock ledger** module (`shared/erp/stock/stock-ledger`) with a single interface, **postDelta**: one signed qty, product-level before/after, optional store, required caller transaction, required `organizationId` key (null allowed). Callers keep policy (store locks, insufficient stock, package lines, legacy Item stock). Missing product throws (order no longer soft-skips). **Stock count** and **Stock transfer** stay outside this path until a later decision.

## Status

accepted (issue #1, commit `b95488f`)

## Considered options

- Keep per-document triple writes — rejected: no single test surface; drift across five call sites.
- Ledger opens its own transaction — rejected: nested/partial commits vs document confirm.
- Enforce non-negative balances in the ledger — rejected: policy differs by document (issue checks store stock; order historically allowed go-negative).
- Migrate count and transfer in the same change — deferred: different shapes (set-to-count, dual-store transfer) need their own design pass.

## Consequences

- New stock-affecting document should call `postDelta` unless an ADR says otherwise.
- Demo-data may still seed Stock movement rows directly (not a live write path).
- Behaviour change on sales order: missing product fails the status transaction.
