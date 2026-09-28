# Known issues

A short list of real, outstanding bugs worth fixing — kept here instead of buried in commit
history so they aren't lost.

- **`Select` shows the raw value instead of its label on some pages.** `components/ui/select.tsx`
  (wrapping Base UI) needs an `items` value→label map passed to `Select.Root`, or its closed
  trigger displays the raw enum value (e.g. `approved` instead of `Approved`). Already fixed on
  Payments, Results, and Attendance; still affects the Registrations status filter, Committees,
  Schedule, and the organizer-access role pickers.
- **A conference owner's `organizer_access` row never gets a `password_hash`** — their login
  credential lives in the separate `organizers`/`profiles` table set at registration, so only
  invited staff rows are "claimed" via `password_hash`. Any code that filters
  `organizer_access` by `password_hash IS NOT NULL` to mean "this row can act" will silently
  exclude every conference owner. Use `organizerAccessModel.listByEmail` (claim-status-agnostic)
  instead of `listClaimedByEmail` in new code.
- **`/delegate/committee` gets stuck on its loading skeleton indefinitely**, even though its
  underlying API calls (`/committees/:id`, `/committees/:id/agenda`, `/committees/:id/portfolios`,
  `/delegates/me/committee-roster`) all return `200 OK`. Reproduced on both desktop and mobile
  viewports, so it's a client-side rendering bug in `app/delegate/(workspace)/committee/page.tsx`,
  not a data or layout issue. Not yet root-caused.
