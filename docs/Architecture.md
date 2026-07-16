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

**Where things stand right now**: All 9 phases of the Version 1 build (see roadmap below) are done
and verified end-to-end (backend + browser) and committed to `main`. V1 is feature-complete per spec
§25.4. Phase 8 (Analytics & Intelligence Center + Security hardening) was the final pass — see its
entry below for what shipped. Nothing is queued next; the natural continuation from here is Version 2
(spec §25.5, AI/Intelligence features) or the two known follow-ups noted below (the pre-existing
`Select` label bug in a handful of not-yet-touched pages, and rotating the MySQL password per the
Security notes).

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
respectively — no setup needed on this machine. Phase 6 added optional `SMTP_HOST`/`SMTP_PORT`/
`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` vars (see `backend/.env.example`) for real email
broadcast delivery; none are set locally, so `emailService` runs in log-only mode (every "send" is
logged and recorded as delivered without a real network call) — this is expected, not a bug.

There's also a global launch config at `C:\Users\Ronni\.claude\launch.json` (outside the repo, at
the Claude Code session root) with a `mun-buddy-frontend` entry that runs the Next.js dev server on
port 3000 via `preview_start` — use that if driving the app through the Browser pane tool.

### Test accounts (already in the dev database)

| Role | Email | Password | Notes |
|---|---|---|---|
| Organizer | `dana.testdirector@example.com` | `password123` | Owns "Dana Test MUN 2027" (conference id 7, org id 5, now **published** and publicly listed — visible at `/discover` and `/discover/dana-test-mun-2027-g07ro`). Has a DISEC committee (id 8) with Brazil/Germany portfolios, a schedule day with 2 events, 2 published announcements (one urgent, untargeted), 1 published resource with 1 version. `payment_required` is on (INR 50 required + INR 25 optional fee) — good for the Payments tab / approve-requires-payment gate. Also has: 1 published FAQ (asked by Henry, answered by Dana), 1 sent email broadcast + 1 draft committee-scoped broadcast, 1 "Logistics" department, and a second (unclaimed) invited team member in that department — good conference for demoing Communication and Team tabs end to end. |
| Delegate | `henry.delegate@example.com` | `password123` | Approved, assigned to DISEC/Brazil, assignment published. Has a note, a draft position paper, and a submitted resolution — good account for walking the full Delegate Workspace. Payment-wise: submitted a UPI payment that was verified, given a scholarship discount, then refunded (all three states exercised on one delegate) — good account for the Payment page's history view. Also has a "Best Delegate" award, two issued certificates (one participation, one award-linked), and is checked into both schedule events (one via manual check-in, DISEC Session I) — good account for Results/Certificates/attendance history. Conference results are published. |
| Delegate | `ivy.delegate@example.com` | `password123` | Approved but unassigned — good for testing the assignment flow / unassigned states. Checked into the Opening Ceremony via QR token (not manual click) — good account for confirming `method: 'qr_token'` on an attendance record. |
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

A second, distinct tooling quirk showed up during Phase 5: partway through a long session in the
same preview tab, synthetic `left_click` (coordinate- and ref-based both) stopped reaching real page
elements, even though `getBoundingClientRect`/`elementFromPoint` confirmed the target was exactly
where clicked. Dispatching a real `.click()` on the element via `javascript_tool` worked every time
and confirmed the underlying app logic (form submission, button handlers) was correct — this is a
synthetic-input-dispatch issue in the preview tooling itself, not the app. If this recurs, the
workaround is `document.querySelector(...).click()` via the JS console rather than the click tool.

### Git status

All phases (0–8) are committed to `main` and pushed to `origin/main`
(github.com/Ronthom24/MUN_Buddy). Note that `app.py`'s leaked MySQL credential was purged via
`git filter-branch` + a force-push earlier in this project (see Security notes below) — if this repo
has been cloned anywhere else, those clones still have the old history and should be re-cloned or
manually rebased.

### Also worth a follow-up

The pre-existing `Select` label bug described above (raw value shown instead of label on the closed
trigger) affects every `Select` usage that predates the Phase 4 fix — Registrations' status filter,
Committees, Schedule, organizer-access role pickers, etc. Only the `Select`s touched in Phases 4-7
were fixed (Payments, Results, Attendance, Communication, Team). Worth a dedicated pass to add
`items` maps everywhere else, since it's a real, visible text-correctness bug across a good chunk of
the app.

A real, pre-existing data-model quirk surfaced and was worked around in Phase 7 rather than fixed at
the root: a conference owner's own `organizer_access` row never gets a `password_hash` (their login
credential lives in the separate `organizers` table set at registration) — only invited staff rows
are "claimed" via `password_hash`. Anything that treats `password_hash IS NOT NULL` as "this
organizer_access row can act" would silently exclude every conference owner. Fixed for the Team
dashboard's member/invitation counts and for organizer-side notification recipient resolution (added
`organizerAccessModel.listByEmail`, which is claim-status-agnostic, alongside the older
`listClaimedByEmail`) — but any *other* future code that filters organizer_access by `password_hash`
should use the same pattern instead of re-deriving "is this a real member" from claim status.

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
5. **Done.** Results & Certificates + Attendance/QR. Spec Ch.19 (Results, Awards & Certificate
   Center) plus 25.4's V1 Attendance bullets (there's no dedicated Attendance chapter — earlier
   chapters list "Attendance" only as a Future Enhancement, but 25.4's V1 checklist is what counts).
   New tables: `awards`, `certificate_templates` (organization-scoped, reusable across that org's
   conferences per spec 19.8), `certificates` (PDF generated on demand from the row + template,
   never stored as a file — `certificate_number` doubles as the public verification id), `checkin_tokens`,
   `attendance_records`. New npm deps `pdfkit` (certificate PDF layout) and `qrcode` (check-in QR
   images) — genuinely new capability, not scope creep. New `manage_attendance` permission (owner/
   conference_manager/organizer; no committee_director grant since attendance routes are
   conference-scoped like schedule management, not committee-scoped, so that role could never reach
   them). Scoping decisions: certificates are delegate-facing only in V1 (spec 19.7 also lists
   organizer/EB/volunteer/sponsor types, which would need unifying delegate and organizer_access
   identity — out of scope); QR check-in is a persistent per-delegate token rendered as a QR image,
   redeemed either by clicking a name in the roster (manual) or by scanning/typing the token (what a
   real handheld QR/barcode scanner emits is keyboard input into a text field) — no camera-based
   scanning UI, since that needs hardware this environment can't verify. Organizer UI: new Results
   tab (Awards/Certificate templates/Issued certificates, with bulk certificate issuance) and new
   Attendance tab (per-session roster + check-in) on the conference nav. Delegate UI: new Results and
   Certificates pages, plus a "My check-in code" card added to Profile. New public, unauthenticated
   `/verify/[certificateNumber]` page (spec 19.12/25.4's "Certificate Verification Foundation").
   Verified end-to-end in a real browser session: organizer created a certificate template and
   issued certificates individually and in bulk through the actual dialogs, checked delegates into
   sessions both by clicking their name and by pasting a real QR token, watched attendance rates
   recompute live; delegate viewed their own award, downloaded their certificate PDF, and saw their
   QR code render; the public verify page correctly confirmed a real certificate and rejected a bogus
   number. Three real bugs found via this testing and fixed, not just the usual preview-tab quirks:
   (1) the certificate number format was long enough to wrap in the PDF footer and collide with the
   line below it — shortened the format and made the layout measure text height dynamically instead
   of using a fixed line gap; (2) `components/ui/dialog.tsx`'s `DialogContent` had no `max-h`/
   `overflow-y-auto`, so a tall form's submit button was completely unreachable on a short viewport —
   fixed with `max-h-[85vh] overflow-y-auto` on the shared component, which benefits every dialog in
   the app; (3) `Select` (`components/ui/select.tsx`, wrapping Base UI) needs an `items` value→label
   map passed to `Select.Root` or its closed trigger displays the raw value instead of the label —
   confirmed this is pre-existing and affects already-shipped Selects too (e.g. the Registrations
   page's status filter shows `approved` not `Approved` after selection); fixed it in every `Select`
   touched this session (Payments and Results/Attendance pages) by passing a memoized `items` map,
   but the pre-existing ones elsewhere (Registrations, Committees, Schedule, organizer-access role
   pickers, etc.) are still broken and worth a dedicated follow-up pass. Also hit a new tooling quirk
   distinct from the documented rAF one: this preview tab's synthetic `left_click` (both coordinate-
   and ref-based) stopped reaching real elements partway through the session — confirmed via
   `getBoundingClientRect`/`elementFromPoint` that the target element was exactly where clicked, and
   confirmed the underlying app logic was correct by dispatching a real `.click()` via
   `javascript_tool` instead, which worked every time. Not an app bug; worth a quick manual
   click-check like the other documented quirks.
6. **Done.** Communication Center. Extended the existing Announcements (added committee/portfolio-
   level targeting on top of the coarse `target_audience` enum, lazy scheduled-auto-publish via
   `publishDueAnnouncements` — no cron worker in this stack, so it flips due `scheduled` rows to
   `published` the next time a conference's announcements are read — and per-delegate read tracking
   via a new `announcement_reads` table) and Resources (portfolio scoping alongside the existing
   committee scoping, `tags`, search/category/tag query params, and real version history via a new
   `resource_versions` table + `POST /resources/:id/versions` upload endpoint) modules, both of which
   already existed from earlier phases but had no organizer-facing management UI at all before this
   session. Built three entirely new modules: FAQs (`faqs` table — delegate ask, organizer
   answer/pin/publish/archive, category filtering, a public/unauthenticated "published" list reused by
   both the delegate workspace and the public conference page), in-app Notifications (`notifications` +
   `notification_preferences` tables, a `notificationService.notify()`/`notifyMany()` helper wired into
   registration approval/rejection, payment verification, certificate issuance, assignment publishing,
   announcement publishing, and FAQ answers — both delegate- and organizer-facing, with a shared
   `NotificationBell` popover component mounted in both the organizer conference layout and delegate
   workspace layout), and Email Broadcasts (`email_broadcasts`/`email_broadcast_recipients` tables,
   `email_templates` organization-scoped reusable templates, a new `backend/src/services/emailService.js`
   built on `nodemailer` that sends real mail only if `SMTP_HOST` is configured in `.env` and otherwise
   logs a "would send" line and marks delivery as sent — the same pragmatic manual/offline-first
   precedent Phase 4 set for payments, since no real SMTP credentials exist in this environment).
   New `answer_faqs`/`send_broadcasts` permission keys layered onto the existing RBAC tables. Organizer
   UI: new Communication tab on the conference nav (Announcements/Resources/FAQs/Email Broadcasts
   sub-tabs). Delegate UI: new FAQs page, read-tracking wired into the existing Announcements page.
   Verified end-to-end in a real browser session: created/edited a targeted, prioritized announcement
   and confirmed delegate-side read-count incremented on view; uploaded a resource, tagged it, uploaded
   a second version; asked a question as a delegate, saw the organizer get notified, answered and
   published it, confirmed it appeared on both the delegate FAQ page and the public conference page;
   created and sent an email broadcast (log-only mode, delivery tracking recorded as sent per
   recipient); confirmed the notification bell renders and "mark all read" works for both an organizer
   and a delegate account. One real bug found and fixed: `resourceModel.listByConference`'s new
   `LEFT JOIN`s to committees/portfolios made the existing `conference_id` column reference ambiguous,
   500ing the endpoint — qualified every column in that query with the `r.` alias.
7. **Done.** Team Center + Public Website / Public Conference Pages. Team Center: new `departments`
   table (conference-scoped) plus `organizer_access.department_id`/`position_title` columns wired into
   the existing invite-then-claim flow; a lightweight `team_activity` table + `teamActivityService.log()`
   helper called from committee creation, registration status changes, department CRUD, and
   member invites (explicitly *not* the full compliance audit log from spec 16.12/22.16 — that's
   Phase 8's `audit_logs` with before/after value diffs across every model; this is just the
   team-visible activity feed from spec 16.11). Upgraded the existing organizer-access
   list/invite/update/remove routes from a hardcoded `OWNER_ONLY` role gate to
   `OPERATIONAL + requirePermission("manage_team")`, since `manage_team` already existed as a
   permission key from Phase 1 and already defaults to owner+conference_manager — a real accuracy
   improvement (Executive Board can now manage the team, not just the Main Organizer) with no
   behavior change for existing accounts. Public Website: new `is_publicly_listed` boolean on both
   `organizations` and `conferences` (opt-out, defaults true) and a new `slug` column on `conferences`
   (organizations already had one from Phase 1) for pretty public URLs, backfilled from
   `conference_code` for existing rows. New unauthenticated `/api/public/*` routes (organizations
   directory + detail, conferences directory + detail, and a public resource-download endpoint distinct
   from the authenticated one, since a true visitor has no `req.user` at all) that only ever surface
   `status='published'` conferences under publicly-listed organizations. Frontend: new Team tab on the
   conference nav (members/departments/activity, mirroring the Communication tab's structure); reworked
   the previously-bare homepage (`app/page.tsx`) into a real public homepage (hero, upcoming
   conferences, featured organizations, shared `PublicNav`/`PublicFooter`); new `/organizations`,
   `/organizations/[slug]`, `/discover`, and `/discover/[slug]` public routes — deliberately *not*
   `/conferences` for the public directory, since `/conferences/[id]` is already the auth-gated
   organizer workspace route (numeric id) and a slug-based public route can't share that same dynamic
   segment. Verified end-to-end in a real browser session: published a conference via the existing
   conference-settings PUT, confirmed it appeared on the public homepage, `/discover`, and its own
   `/discover/[slug]` landing page (committees, public resources, published FAQ all rendered
   correctly); confirmed `/organizations` and `/organizations/[slug]` list and aggregate conference
   counts correctly; created a department and invited a member with a department/position assignment
   and confirmed both showed up correctly in the Team tab and the team activity feed. Two real bugs
   found and fixed: (1) the conference-owner `organizer_access.password_hash` quirk described above,
   which double-counted owners as "pending invitations" on the Team dashboard and mislabeled them
   "Invited" in the member table; (2) the public organization detail page showed blank conference
   counts because `organizationModel.findPublicBySlug` (a plain lookup) doesn't carry the aggregate
   `conference_count`/`upcoming_conference_count` fields that only `listPublic`'s aggregate query
   computes — fixed by deriving both counts client-side from the conferences array the page already
   fetches, rather than duplicating the aggregate subqueries onto the single-row lookup.
8. **Done.** Analytics & Intelligence Center + Security hardening — the final V1 pass. New
   `audit_logs` table (immutable, `previous_value`/`new_value` JSON diffs, spec 22.16) distinct from
   Phase 7's human-readable `team_activity` feed — both are written at the same call sites (a new
   `auditLogService.log()` wired into committee/portfolio create-update-remove, registration
   approval/bulk-approval, organizer-access invite/update/remove, payment verify/refund, conference
   settings updates, announcement publish, certificate issue/bulk-issue, assignment, and trash
   restores). New `login_history` table (spec 22.17) populated on every organizer/delegate login
   attempt, success or failure — on failure the account is still looked up by email so repeated-
   failure monitoring (spec 22.18) can attribute attempts to a real account, not just an anonymous
   miss; a new `GET /api/auth/me/login-history` endpoint lets either role view their own history.
   Session management itself deliberately stays short-lived-JWT-only (the Phase 1 "always-fresh
   authorization" design) rather than adding a parallel session-store table — `login_history` is the
   audit trail spec 22.17 actually asks for, not a session store, so this satisfies the spec bullet
   without contradicting the existing architecture. Soft deletes rolled out to `conferences`,
   `committees`, `portfolios`, `resources`, and `announcements` (organizations already had
   `deleted_at` from Phase 1) — every model's `remove()` now sets `deleted_at` instead of deleting,
   `findById`/list queries filter it out, and a new `restore()` + `listTrashed()` pair per model
   backs a new Trash view. Deliberately excluded from soft-delete: certificates (immutable
   verification records with no existing delete path — spec 19.17) and delegates (the existing
   `status` enum, including `withdrawn`, already models "no longer active" without a second
   mechanism). New `express-rate-limit` dependency: a general 600-req/15-min limiter on all `/api`
   routes plus a stricter 20-req/15-min limiter on every auth route (login/register/claim/password-
   reset), addressing spec 22.13. File upload hardening (spec 22.15): `middleware/upload.js` gained
   an extension allowlist (`fileFilter`, checked against the actual filename extension rather than
   the spoofable browser-supplied MIME type) rejecting anything outside common document/image/archive
   types. New consolidated `analyticsService.js` (`GET /conferences/:id/analytics/overview`) filling
   the two analytics domains that didn't already exist from earlier phases — committee
   occupancy/capacity-utilization/popularity, and communication stats (announcement read rate,
   resource downloads, FAQ resolution time, notification/broadcast delivery) — and folding them
   together with the registration/assignment/financial/attendance analytics that already existed
   per-module since Phases 2–5, so the frontend has one call instead of six. New report-export
   pipeline (spec 17.12/17.13): a shared `utils/tableExport.js` (`toCsv`/`toExcel`/`toPdf`, the last
   two via the already-present `pdfkit` and a new `exceljs` dependency) driven by a `reportService.js`
   that reduces six report types (registrations/committees/assignments/financial/attendance/
   certificates) to one common `{title, columns, rows}` shape, so the export/format code never has to
   change per report type. Organizer UI: new Analytics tab on the conference nav (stat cards,
   registration-trend and committee-occupancy charts, a report-type selector, and PDF/Excel/CSV export
   buttons that trigger real file downloads via a new `downloadBlob()` helper, since the existing
   `openBlob()` opens in a new tab rather than forcing a save — wrong behavior for an
   `attachment`-disposition CSV/XLSX response). Team Center gained two new tabs: Audit Log (read-only
   table of every audit entry) and Trash (per-type restore buttons, gated behind
   `requirePermission("manage_team")` like the rest of Team Center). Verified end-to-end via both API
   and a real browser session: created/deleted/restored a committee and confirmed all three actions
   appear in the Audit Log with the right before/after values and the item correctly leaves/re-enters
   the Trash list; triggered a failed login and confirmed it's recorded and attributed to the right
   account; uploaded a disallowed file extension and confirmed a clean 400 rejection, then confirmed a
   legitimate PDF upload still succeeds; loaded the Analytics tab and confirmed real registration/
   committee/financial/communication numbers render, then exported and downloaded actual PDF, Excel,
   and CSV files through the real UI buttons (not just direct API calls) and confirmed each file opens
   correctly. No new bugs found this session beyond one cosmetic text-node spacing issue in the
   Analytics page (a number and an adjacent Badge component rendered without a text-node gap between
   them) fixed on sight.

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
