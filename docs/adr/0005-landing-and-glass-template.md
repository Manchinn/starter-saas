# ADR-0005: Landing redesign and the `glass` template strategy

- Status: Accepted (2026-09-07)
- Decided in: PR #20 (landing), PR #21 (template), critique runs 1–3 (impeccable), issues #18/#19 (superseded), #22 (inherited debt)
- Related: `docs/FORK.md` (deployment status), `client/src/core/TemplateEngine.js`, `client/src/assets/main.css`

## Context

The public landing page and the authenticated app shell had drifted apart visually
(generic gray admin vs. the MaeKade brand). The owner wanted a modern, warm design
without introducing dark mode. The app already ships a runtime template switcher
(`TemplateEngine` + `useTemplateStore`, localStorage `app-template`) with four
templates sharing one composable (`useAppLayout`).

Landing copy makes product claims (what the system can do). Claims must match the
codebase (LINE OA entry, per-branch stock auto-hide, real role names from the seed) —
no invented features, no invented numbers ("5 minutes", "free").

## Decisions

1. **Landing = dark bento glass** (PR #20, mockup `sketches/landing-glass/003b-bento-glass-full`).
   Anuphan (Thai geometric font) for the landing only; app shell keeps Outfit.
   LINE CTA on the landing routes to `/login` (unchanged behavior — LINE OAuth
   starts there).

2. **Glass theming is a new selectable template, not a retheme of Default**
   (PR #21). `AppLayoutGlass.vue` copies `AppLayoutDefault.vue`'s structure and
   composable 1:1 (behavioral parity — switching templates never retrains muscle
   memory) and changes only surfaces: translucent sidebar/topbar, warm cream
   canvas, light-glass nav.

3. **Blur only where content scrolls beneath.** Cards, tables and secondary buttons
   sit on a static canvas, so they use precomputed rgba gradients (no composited
   backdrop-filter layers, honest figure-ground). Sidebar/topbar/menus keep real
   blur. `prefers-reduced-transparency` swaps all chrome to solid `#FDFCF9`.

4. **Glass skin is scoped under `.template-glass` in `main.css`.** No selector
   outside that block may target glass surfaces; other templates are untouched.

5. **Contrast targets.** Text on glass must meet AA (4.5:1 body / 3:1 large+icons).
   Dark-surface grays (`#8D9BB4`, `#9BA7B0`) must not be reused on light surfaces;
   within glass scope, text is `#3F4A5A`/`#55637A`/`#5B6B7C` and accents
   `#C24A1E` (primary-700-class) — `.btn-primary` white-on-`#FF7847` (~2.6:1,
   all templates) is tracked separately in #22.

6. **Accessibility floor for shell menus**: `aria-haspopup`/`aria-expanded`/
   `role=menu`/`role=menuitem`, Escape closes and restores focus to the trigger,
   focus moves to the first menuitem on open, Arrow/Home/End roving, Tab closes.
   **Focus logic lives in `<script setup>`, never inline template expressions** —
   Vue compiles bare `document` in template expressions to `_ctx.document`
   (undefined on the render proxy), which throws silently on every click
   (found by critique run 3, fixed in `ccb9029`).

7. **Canvas/backgrounds in plain CSS, not Tailwind arbitrary values.** A
   `bg-[radial-gradient(...),...]` arbitrary class compiled to an EMPTY CSS rule
   (verified in CSSOM — the whole canvas silently failed to render). Multi-stop
   backgrounds go in the `.template-glass` block as real CSS.

## Verification discipline (what we learned)

Three critique rounds (dual-agent: design review vs. detector/browser evidence)
caught three classes of miss that source review alone did not:

- CSS that compiles but matches/loses cascade (empty rule; scoped-SFC beats
  media-query override) — must verify in CSSOM with computed styles, not source.
- Keyboard focus behavior — must be exercised with real key events (CDP), not
  read from attributes.
- Claims/scores from a single reviewer anchor; isolated assessments catch more.

Critique snapshots: `.impeccable/critique/2026-09-06T18-46-15Z` (run 1),
`2026-09-06T21-08-10Z` (run 2). Run 3/3b were targeted fix-checks
(canvas rgb(250,246,239) live; fallback wins cascade under emulated media;
menu keyboard flow passes with zero unhandled rejections).

## Consequences

- Templates are additive: new looks should follow the same pattern
  (copy Default's skeleton, scope CSS under `.template-<slug>`).
- Inherited debt (shared by Default/Modern/Minimal: AlertBell as a third
  dropdown contract, hex spread, `.btn-primary` contrast, ~330-line layout
  duplication → future `AppShell.vue` + named tokens) is tracked in issue #22,
  not blocking.
- Landing i18n keys (`landing.*`) were fully rewritten (th/en); old keys not in
  the new layout were dropped — restore from git history (`37f31af`/`3d99bf5`)
  if ever needed.
