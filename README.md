# MUN Buddy

![Project Status](https://img.shields.io/badge/status-phase%201-brightgreen?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-static-blue?style=flat-square)
![Backend](https://img.shields.io/badge/backend-planned-orange?style=flat-square)

MUN Buddy is a Model United Nations conference management platform built as a frontend prototype with a planned backend integration. It is designed to support conference organizers and delegates by centralizing event management, committee coordination, delegate assignments, resources, announcements, and agendas.

## Project Overview

MUN Buddy aims to provide a polished conference workflow for:

- **Organizers**: build conferences, manage committees, approve delegates, publish announcements, and configure event settings.
- **Delegates**: register, view assignments, access committee information, and stay up to date with conference announcements.

The current workspace contains a complete static frontend prototype and an initial backend application structure.

## Features

### Organizer Portal

- Dashboard overview with conference metrics
- Delegate management and approval workflow
- Committee administration and capacity monitoring
- Portfolio/country assignment and tracking
- Resource library and announcement publishing
- Agenda management and event coordination
- Conference settings and registration controls

### Delegate Portal

- Delegate dashboard with assignment summaries
- Committee and country portfolio pages
- Announcement feed
- Static current affairs and writing center placeholders

### Public Pages

- Landing page
- Login page
- Organizer registration
- Delegate registration

## Folder Structure

```text
backend/
  app/
  migrations/
  tests/
  run.py
  requirements.txt
  docker-compose.yml
  Dockerfile
frontend/
  index.html
  login.html
  delegate/
    dashboard.html
    country.html
    committee.html
    resolutions.html
    notes.html
  organizer/
    dashboard.html
    delegates.html
    countries.html
    committees.html
    agendas.html
    announcements.html
    assignments.html
    resources.html
    settings.html
  assets/
    css/
    js/
    images/
```

## Current Status

- **Phase 1: Frontend Development** — substantially complete
- **Frontend**: full static prototype with placeholder content
- **Backend**: structural setup exists, dynamic business logic not implemented
- **Authentication**: not yet built
- **Database**: not yet connected
- **AI features**: planned for future phases

## Roadmap

| Phase | Focus | Status |
| --- | --- | --- |
| Phase 1 | Frontend prototype and UX design | ✅ Complete |
| Phase 2 | Requirements audit and feature refinement | 🟡 In progress |
| Phase 3 | Database modeling and schema design | 🔜 Planned |
| Phase 4 | Authentication and access control | 🔜 Planned |
| Phase 5 | Backend integration and form processing | 🔜 Planned |
| Phase 6 | AI research and writing assistant features | 🔜 Planned |

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, Font Awesome
- **Backend (planned)**: PHP, MySQL
- **Database design tool**: MySQL Workbench
- **Development**: Visual Studio Code
- **Version control**: Git, GitHub

## Installation

### Prerequisites

- Python 3.8+ (for backend environment)
- Node/npm if frontend tooling is added later
- Git

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/deadman415/MUN_Buddy.git
cd MUN_Buddy
```

2. Create and activate a Python virtual environment:

```bash
python -m venv venv
venv\Scripts\Activate.ps1
```

3. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Start the backend server (placeholder, backend implementation pending):

```bash
python run.py
```

5. Open the frontend pages directly from the `frontend/` directory or serve them with a local web server.

### Optional Local Frontend Server

Use Python built-in HTTP server from the `frontend/` directory:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Development Workflow

1. Create a feature branch from `main`.
2. Make incremental frontend or backend updates.
3. Test UI changes by opening pages in `frontend/`.
4. Keep backend work modular under `backend/app/`.
5. Commit with descriptive messages and push for review.

## Future Plans

- Dynamic backend integration with MySQL
- Authentication for organizers and delegates
- Real file uploads and downloads for resources
- Real-time announcements and notifications
- AI-powered research assistant, speech writer, and resolution builder
- Conference analytics and delegate performance tracking
- Delegate resources page and conference document repository

## Notes

This repository currently represents the frontend prototype phase. Many pages show static placeholder data and are designed to demonstrate the final intended user experience.

---

If you want, I can also add a `CONTRIBUTING.md` and a more detailed API design outline for the backend phase.