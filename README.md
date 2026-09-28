# MUN Buddy

![Frontend](https://img.shields.io/badge/frontend-Next.js%20%2B%20TypeScript-blue?style=flat-square)
![Backend](https://img.shields.io/badge/backend-node%2Fexpress-orange?style=flat-square)
![Database](https://img.shields.io/badge/database-postgres%20(supabase)-3ecf8e?style=flat-square)

MUN Buddy is a web-based platform for managing Model United Nations conferences — organizers run
the event end to end (registration, committees, payments, communication, results/certificates,
attendance, analytics), and delegates get a single workspace for their committee, assignments,
notes, and conference resources.

## What the app is

- **Organizations** are the top-level tenant: an organization can run multiple conferences over
  time, with its own team, branding, and members.
- **Conference organizers** manage committees, agendas, registrations, delegate assignments,
  payments, communication (announcements/resources/FAQs/email broadcasts), team members, results
  and certificates, attendance/QR check-in, and analytics/reporting for their conference.
- **Delegates** register for a conference, get assigned a committee/country, and use their
  workspace to view schedule, resources, announcements, notes, resolutions, payments, and their
  certificates.
- **Platform administrators** get a separate super-admin view across all organizations: suspend
  accounts, view-as-organizer, audit logs, and platform-wide analytics.
- A public, unauthenticated site (`/discover`, `/organizations`, `/verify/[certificateNumber]`)
  lets anyone browse publicly-listed conferences/organizations and verify an issued certificate.

## Technology stack

### Frontend (`frontend-next/`)
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (Base UI)
- `react-hook-form` + `zod` for forms
- `@supabase/supabase-js` for the Supabase-direct password-reset flow (everything else goes
  through the backend API, see below)

### Backend (`backend/`)
- Node.js + Express
- **Postgres via Supabase**, accessed through `pg` (hand-written SQL, no ORM)
- **Supabase Auth** for credentials — the backend is still the login/register gateway (not
  frontend-direct), so login-attempt history and lockout enforcement keep working; Supabase just
  owns password storage/verification and issues the JWTs
- **Supabase Storage** (S3-compatible) for file uploads
- `helmet` / `cors` / `morgan` / `express-rate-limit` / `dotenv`, `multer` for upload handling,
  `pdfkit` + `qrcode` for certificate/check-in generation, `exceljs` for report exports

### Project structure
```text
backend/
  src/
    app.js
    server.js
    config/         # pg pool (Supabase)
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/          # Supabase Auth JWKS verification, Supabase clients, etc.
    validations/
  scripts/          # runSchemaSupabase.js, seedPlatformAdmin.js, ...
frontend-next/
  app/              # Next.js App Router pages (organizer, delegate, platform, public)
  components/
  lib/              # API clients, auth contexts, Supabase browser client
database/
  schema-postgres/  # current Postgres schema, applied via backend/scripts/runSchemaSupabase.js
  schema-mysql-archive/  # retired MySQL schema, kept for reference only
```

## Running the project locally

### Prerequisites
- Node.js 18 or newer
- npm
- A Supabase project (Postgres + Auth + Storage) — no local database needed

### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend-next && npm install
```

### 2. Configure environment variables
Copy `backend/.env.example` to `backend/.env` and fill in your Supabase project's URL, database
connection string, and API keys (`SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`), plus `JWT_SECRET` and, if you want file uploads working, the `S3_*`
Storage config (see the comments in `.env.example` for exact values). Copy
`frontend-next/.env.local.example` to `frontend-next/.env.local` similarly.

### 3. Apply the database schema
```bash
cd backend
npm run db:migrate   # runs database/schema-postgres/*.sql against your Supabase project
```

### 4. Start both apps
```bash
# backend, from backend/
npm run dev   # http://localhost:5000

# frontend, from frontend-next/
npm run dev   # http://localhost:3000
```

### 5. (Optional) Seed a platform administrator
```bash
cd backend
npm run seed:production   # creates/updates the account from SUPER_ADMIN_* env vars
```

## Demo content

Optional one-off scripts under `backend/scripts/` seed a full demo organization/conference
(`seedDemoOrg.js`), a roster of assigned demo delegates (`seedDemoDelegates.js`), and a multi-day
schedule (`seedDemoSchedule.js`) — useful for showing the app end to end without registering real
data. Run them with `node scripts/<name>.js` from `backend/` after the schema is applied.

## License

This project is licensed under the [MIT License](LICENSE).
