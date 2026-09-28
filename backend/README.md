# MUN Buddy Backend

Node.js + Express API for MUN Buddy, backed by Postgres via Supabase. See the
[root README](../README.md) for the full setup guide (environment variables, schema migration,
running both apps together); this file only covers what's specific to this directory.

## Installation

```bash
npm install
```

## Available scripts

- `npm start` — start the API in production mode.
- `npm run dev` — start with `nodemon` for local development (`http://localhost:5000`).
- `npm run db:migrate` — apply `database/schema-postgres/*.sql` to the configured Supabase project.
- `npm run seed:production` — create/update the platform administrator account from the
  `SUPER_ADMIN_*` env vars.

## Environment

Copy `.env.example` to `.env` and fill in your Supabase project's values (see the comments in that
file for exactly what each one is and where to find it).

## Project structure

- `src/` — application source (`config`, `controllers`, `middleware`, `models`, `routes`,
  `services`, `utils`, `validations`)
- `scripts/` — one-off/maintenance scripts (schema migration, admin seeding, demo content seeding)
- `.env.example` — template for local environment variables (`.env` itself is gitignored)
