# MUN Buddy — Architecture (canonical, supersedes other docs/*.txt planning files)

This is the single source of truth for MUN Buddy's technical architecture and build roadmap.
Other files in `docs/` (Development Roadmap.txt, Frontend Architecture.txt, Project Overview.txt,
System Architecture.txt, etc.) predate the Organization tier and, in the case of
`Frontend Architecture.txt`, describe a Flutter frontend that was never built. Treat this file
and the code itself as ground truth; treat the other `docs/*.txt` files as historical/aspirational
notes only.

The full product specification lives at the user's
`# PRODUCT_SPECIFICATION__MUN_BUDDY.md`. This document is the engineering plan for delivering
that spec's Version 1 (§25.4) against the real codebase.

## Getting started / session handoff

**Where things stand right now**: Phases 0–4 of the Version 1 build (see roadmap below) are done
and verified. Phase 5 (Results & Certificates + Attendance/QR) is next and hasn't been started.
Phase 4's work is verified but **not yet committed** — see Git status below.

### Running the app

Backend (Express + MySQL), from `backend/`:
```bash
npm install   # if needed
npm run dev   # nodemon, http://localhost:5000, health check at /health
```
If port 5000 is already in use from a previous session, find and stop the stray process
(`netstat -ano | grep :5000` then stop that PID) before starting a fresh one — do this rather than
assuming the old one is still the current code.

Frontend (Next.js), from `frontend-next/`:
```bash
npm install   # if needed
npm run dev   # Turbopack dev server, http://localhost:3000
```
`backend/.env` and `frontend-next/.env.local` already exist locally (both gitignored, not in the
repo) with working MySQL credentials and `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api`
respectively — no setup needed on this machine.

There's also a global launch config at `C:\Users\Ronni\.claude\launch.json` (outside the repo, at
the Claude Code session root) with a `mun-buddy-frontend` entry that runs the Next.js dev server on
port 3000 via `preview_start` — use that if driving the app through the Browser pane tool.

### Test accounts (already in the dev database)

| Role | Email | Password | Notes |
|---|---|---|---|
| Organizer | `dana.testdirector@example.com` | `password123` | Owns "Dana Test MUN 2027" (conference id 7, org id 5). Has a DISEC committee (id 8) with Brazil/Germany portfolios, a schedule day with 2 events, 1 published announcement, 1 published resource. `payment_required` is now **on**, with a required "Registration Fee" (INR 50) and optional "Accommodation Fee" (INR 25) — good conference for demoing the Payments tab and the approve-requires-payment gate. |
| Delegate | `henry.delegate@example.com` | `password123` | Approved, assigned to DISEC/Brazil, assignment published. Has a note, a draft position paper, and a submitted resolution — good account for walking the full Delegate Workspace. Payment-wise: submitted a UPI payment that was verified, given a scholarship discount, then refunded (all three states exercised on one delegate) — good account for the Payment page's history view. |
| Delegate | `ivy.delegate@example.com` | `password123` | Approved but unassigned — good for testing the assignment flow / unassigned states. |
| Organizer | `alice.orgowner@example.com` | `password123` | Owns a separate organization (id 3) with 2 conferences (ids 4, 6) and an invited admin member (`carol.eb@example.com`) — used to verify multi-conference-per-org and multi-tenant isolation. |
| Organizer | `bob.otherowner@example.com` | `password123` | Owns another separate organization (id 4) with 1 conference (id 5) — the isolation counterpart to Alice's org. |

### Known environment quirk (not an app bug)

The sandboxed browser preview used for verification throttles `requestAnimationFrame`. Two Base
UI/shadcn components rely on rAF internally: `Select` (opens via a `useClick` interaction gated on
`event: 'mousedown'` + an rAF-scheduled state update) and `Dialog` (unmounts its overlay after an
rAF-driven exit-animation callback). In that specific preview tab, Select dropdowns don't open on
synthetic clicks and closed dialogs can leave an invisible click-blocking backdrop behind — both
traced to source, confirmed via direct DOM/event dispatch, and specific to that rAF-starved tab.
Everything else (buttons, checkboxes, tabs, forms, links) verified working normally. This should not
affect a real, foregrounded browser tab, but is worth a quick manual click-check next time a human
looks at it, particularly the `Select` components (organization switcher, committee/portfolio
pickers, conference role dropdowns).

### Git status

Phases 0–4 are committed to `main` (12 commits, from the initial checkpoint through "docs: mark
Phase 4 complete") and pushed to `origin/main`. Note that `app.py`'s leaked MySQL credential was
purged via `git filter-branch` + a force-push earlier in this project (see Security notes below) —
if this repo has been cloned anywhere else, those clones still have the old history and should be
re-cloned or manually rebased.

### Full plan file

The original phase-by-phase implementation plan (schema designs, reuse guidance per phase) is at
`C:\Users\Ronni\.claude\plans\zany-watching-aurora.md` if more detail than this doc is needed on the
original Phase 4–8 intentions. This `docs/Architecture.md` file is the actively-maintained,
authoritative status tracker, though — update it, not just the plan file, as phases complete.

## Stack

- **Backend**: Node.js + Express 4.18, MySQL via `mysql2/promise` (hand-written SQL, no ORM),
  JWT auth (`jsonwebtoken`), `bcrypt` password hashing, `helmet`/`cors`/`morgan`/`dotenv`,
  `multer` for uploads. Entry point: `backend/src/server.js`. Sole manifest: `backend/package.json`.
- **Frontend**: migrating from static HTML5/Bootstrap5/vanilla JS (`frontend/`) to
  **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui** (`frontend-next/`), with
  `react-hook-form` + `zod` for forms, `@tanstack/react-query` for server state, `recharts` for
  analytics charts. The old `frontend/` pages are used once each as design/content reference,
  then retired page-by-page as their Next.js equivalents ship.
- **Database migrations**: numbered `.sql` files in `database/schema/`, run via
  `backend/scripts/runSchema.js`. No migration framework — keep this pattern for consistency.

## Core architectural change: the Organization tier

The spec models the platform as `Organization → Conference → Committee → Portfolio → Delegate`,
with Organizations as permanent multi-conference tenants. The original schema had no
`organizations` table at all (conferences hung directly off a person, `organizers`). This is
being retrofitted as Phase 1 of the build (see below) — everything else depends on it, so it
lands first.

Key pieces:
- `organizations` + `organization_members` (org-level roles: owner/admin/member).
- `conferences.organization_id` FK (tenancy), `conferences.organizer_id` kept (still means
  "who created this specific conference").
- `organizer_access.role` renamed to reflect the spec's conference-level hierarchy:
  `main_organizer` (was `owner`), `executive_board` (was `conference_manager`),
  `organizing_committee` (was `organizer`), `committee_director` (unchanged).
- `permissions` / `role_permissions` / `organizer_access_permission_overrides` for real
  per-capability RBAC on top of the role check.
- `backend/src/middleware/auth.js` gains `requireOrganizationAccess(...)` and
  `requirePermission(key)`, and existing conference-scoped middleware gains an
  organization-isolation check (multi-tenant data isolation).

## Build phases (Version 1)

0. **Done.** Housekeeping — commit checkpoint, remove vestigial root manifest, purge leaked
   credential, consolidate docs, scaffold `frontend-next/`.
1. **Done.** Organization tier + core auth rework. Backend and UI (register/login/dashboard)
   verified end-to-end in a real browser session against the live backend. One pragmatic
   deviation from the original plan: `organizer_access.role` enum values were **kept as-is**
   (`owner`/`conference_manager`/`organizer`/`committee_director`) rather than renamed to
   `main_organizer`/`executive_board`/etc. — they already map 1:1 onto the spec's hierarchy
   behaviorally, and renaming an enum referenced by role-array checks across ~11 files was a wide,
   purely-cosmetic risk not worth taking under the "ASAP" constraint. New capability tables
   (`permissions`/`role_permissions`/`organizer_access_permission_overrides`) deliver the spec's
   actual modular-RBAC requirement independent of the label question.
2. **Done.** Registration Management + Delegate Assignment. Verified end-to-end via API and
   browser: bulk approve/waitlist/reject, assignment with capacity/conflict validation, history
   logging, org isolation still holds. Known verification gap: shadcn/Base UI `Select` dropdowns
   couldn't be click-tested in the sandboxed browser preview because Base UI's Select defers
   opening through `requestAnimationFrame`, which never fires in that preview tab (likely
   visibility/background throttling) — confirmed via source-level tracing, not an app bug. Worth
   a manual click-check in a real browser tab when convenient.
3. **Done.** Committee Center round-out (committee stats, agenda/portfolio management UI) +
   Schedule Management + full Delegate Workspace (separate delegate auth, sidebar shell, overview/
   committee/schedule/resources/announcements/notes/documents/resolutions/profile). Verified
   end-to-end as a real delegate account. Two real bugs found and fixed (agenda API response key
   mismatch that crashed a page; `asChild`→`render` Base UI mistake repeated). Confirmed the same
   rAF-throttling issue from Phase 2 also causes closed Dialogs to leave an invisible click-blocking
   backdrop in this sandboxed preview tab (Base UI's dialog unmount is rAF-gated and the overlay has
   no `data-closed:pointer-events-none` safety net) — not expected in a normal foregrounded browser.
4. **Done.** Payments & Finance — manual/offline payment recording only (cash, bank transfer, UPI,
   cheque), per spec 18.5: online gateway integration (Razorpay et al.) is an explicit Future
   Enhancement, not V1. New `fee_categories`/`payments`/`refunds`/`discounts` tables plus
   `conferences.payment_required`/`currency`. Backend enforces spec 18.16's business rule
   ("delegates may not be approved until payment verification if payment is mandatory") in
   `delegateService.updateStatus`/`bulkUpdateStatus` — the single-delegate approve route throws a
   400 and the bulk route partitions ids into applied vs. `skippedForPayment`, both exercised
   end-to-end (a pending delegate stayed pending on Approve until a verified payment existed, then
   approved cleanly after). Organizer UI: new Payments tab on the conference nav (Overview/
   Transactions/Fee structure/Refunds & discounts, revenue trend chart via `recharts`). Delegate UI:
   new Payment page in the Delegate Workspace (fee list, submit-payment dialog, payment history).
   Verified end-to-end in a real browser session (organizer: toggle payment-required, add fee
   categories via the actual dialog form, record/verify/refund a payment, apply a discount, confirm
   dashboard math; delegate: viewed fee list, discount, and payment history for a real account) plus
   direct API checks for the parts the sandboxed preview couldn't click-drive. Confirmed, again, that
   this preview tab's rAF throttling (documented below) affects this page's Select/Dialog components
   the same way it did in Phases 2–3 — not a regression, not expected in a real browser tab.
5. Results & Certificates + Attendance/QR. *(next up)*
6. Communication Center (announcements, resources, FAQs, notifications, email broadcasts).
7. Team Center + Public Website / Public Conference Pages.
8. Analytics & Intelligence Center + Security hardening (audit logs, soft deletes, rate
   limiting, session management, file validation, exports) — final pass.

Each phase ends with a demoable, end-to-end increment (backend + wired UI), not a long dark
period of backend-only work. See the session's plan file for full per-phase detail on schema,
endpoints, and reuse guidance for existing controllers/models/middleware.

## Security notes

- A legacy Flask prototype (`app.py`) that hardcoded a plaintext MySQL root password was removed
  from the working tree and purged from git history (`git filter-branch` + force-push) on
  2026-07-15. The actual MySQL password should still be rotated on the live instance regardless,
  since it may be cached in forks/GitHub's own caches — rotation is the only fully reliable fix.
- `backend/.env` is correctly gitignored; only `backend/.env.example` (a placeholder template)
  is tracked.
