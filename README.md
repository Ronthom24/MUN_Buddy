# MUN Buddy App

A Model United Nations companion application with a Flask backend and a structured frontend.

## Current project layout

- `backend/`
  - `app/` — Flask application package with blueprints, models, services, and extensions.
  - `migrations/` — database migration files.
  - `tests/` — backend test files.
  - `run.py` — backend startup entrypoint.
  - `requirements.txt` — backend Python dependencies.
  - `docker-compose.yml` and `Dockerfile` — container setup for the backend.

- `frontend/`
  - `index.html` — main frontend landing page.
  - `login.html` — login screen.
  - `delegate/` — delegate-facing pages:
    - `dashboard.html`
    - `country.html`
    - `committee.html`
    - `resolutions.html`
    - `notes.html`
  - `organizer/` — organizer-facing pages:
    - `dashboard.html`
    - `delegates.html`
    - `countries.html`
    - `committees.html`
    - `resolutions.html`
    - `feedback.html`
  - `assets/`
    - `css/style.css` — shared frontend stylesheet.
    - `js/login.js`
    - `js/delegate/` — delegate page scripts.
    - `js/organizer/` — organizer page scripts.
    - `images/` — image assets placeholder directory.

## Notes on recent changes

- The backend was moved from the original `mun_buddy_backend/` location into `backend/` and preserved without deleting backend files.
- The frontend structure was expanded to include login, delegate, and organizer pages and matching JS script folders.
- Extra legacy frontend files that did not match the requested structure were removed from the frontend area.
- `README.md` has been updated to reflect the current layout and the work completed so far.
