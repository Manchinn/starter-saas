# LINE Rich Menu API passthrough

LINE on this fork currently manages LIFF ordering and outbound push messaging,
but has no rich menu capability. Rich menus are the persistent tappable menu
strip at the bottom of a LINE chat — used for quick actions (ordering, account,
help) and multi-level navigation via `richmenuswitch`.

We add a **rich menu API passthrough** under `shared/erp/line-integration` that
exposes CRUD, image management, default/user linking, and alias operations
through the existing Messaging API client. The service is a thin wrapper over
`@line/bot-sdk` rich-menu methods with raw image upload to `api-data.line.me`
(separate host). No local persistence — the LINE platform is the source of
truth.

## Status

accepted and implemented (issue #9)

## Considered options

- Local cache of rich menus in a `line_rich_menus` table — rejected: adds sync
  complexity with no read-side benefit since the admin UI queries the API live;
  LINE already stores the objects and images.
- Separate permission `erp.line-integration.rich-menu.manage` — rejected: rich
  menu management is the same admin surface as connection settings; the existing
  `erp.line-integration.manage` is sufficient.
- Batch / bulk / insight endpoints — deferred: these are optimisation and
  analytics, not needed for a working rich menu admin flow; they can be added
  when the UI scales.
- Admin UI (Slice 2) — deferred: backend-only first; a visual rich menu editor
  can be layered on after the API is stable.
- Serve rich menu images through the API (proxy/mirror) — rejected: images are
  uploaded directly to LINE's `api-data.line.me` CDN; download is read-through
  for preview but not proxied.

## Consequences

- Rich menu operations are idempotent passthrough calls to the LINE platform.
- Image upload accepts base64-encoded body via the standard JSON parser so that
  it works without raw-body routing carve-outs.
- Image download returns the raw binary with LINE's `Content-Type` so the client
  can display it directly.
- Alias support is included from the start because `richmenuswitch` actions
  require aliases for multi-level menu navigation.
- Admin routes mount under the existing `/admin` prefix and inherit
  `authenticate` + `requirePermission('erp.line-integration.manage')`.
- Do not add batch/bulk/insight endpoints without a new decision.
