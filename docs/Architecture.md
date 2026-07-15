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
3. Committee Center + Delegate Workspace wiring. *(next up)*
3. Committee Center + Delegate Workspace wiring.
4. Payments & Finance.
5. Results & Certificates + Attendance/QR.
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
