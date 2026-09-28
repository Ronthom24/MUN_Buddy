# About MUN Buddy

MUN Buddy is a conference management platform for Model United Nations conferences, built to
replace the spreadsheet-and-email chaos most student-run MUN conferences run on today. It gives
organizers a single workspace for registration, committee and portfolio assignment, payments,
attendance, results, and certificates — and gives delegates a single place to see their assignment,
schedule, resources, and certificates, instead of scattered forms and emails.

## What it does

- **Organizations & conferences** — an organization can run multiple conferences over time, each
  with its own committees, agenda, and team.
- **Registration & assignment** — custom registration forms, waitlists, bulk delegate review, and
  conflict-checked committee/country assignment.
- **Payments** *(under development)* — fee structures, manual payment verification, refunds, and
  a live financial dashboard.
- **Attendance & certificates** — QR-code-based check-in, on-demand certificate generation, and
  public certificate verification.
- **Communication** — announcements, resources, FAQs, and email broadcasts in one place.
- **Analytics & audit** — live registration/committee/financial analytics and an audit trail of
  organizer actions.
- **Platform administration** — a separate super-admin view across organizations.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express, hand-written SQL via `pg` (no ORM)
- **Database / Auth / Storage:** Supabase (Postgres, Supabase Auth, Supabase Storage)
- **Deployment:** frontend on Vercel, backend on Render

## Project status

This is an actively developed, single-developer project — not a finished, production-hardened
product. There is no automated test suite yet, and it has not been run at a real conference at
scale. Treat it as a working prototype that's further along than most: the core organizer and
delegate flows work end-to-end against a live Supabase backend, but it should be evaluated (and
tested with real users) before being trusted for a live, high-stakes conference.

---

Built by an ISE (Information Science & Engineering) student at MSRIT (M S Ramaiah Institute of
Technology). Still under active development.
