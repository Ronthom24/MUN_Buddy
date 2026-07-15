# MUN Buddy

![Project Status](https://img.shields.io/badge/status-frontend%2Fbackend%20scaffold-yellow?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-static%20prototype-blue?style=flat-square)
![Backend](https://img.shields.io/badge/backend-node%2Fexpress-orange?style=flat-square)

MUN Buddy is a web-based platform for managing Model United Nations conferences. It is designed to help organizers run events smoothly while giving delegates a central place to access their committee information, assignments, notes, and conference resources.

## What the app is

MUN Buddy brings the main parts of a conference experience into one digital workspace:

- Conference organizers can manage committees, agendas, announcements, resources, and delegate information.
- Delegates can view their assigned committee, country portfolio, agenda details, resolutions, and notes.
- The system is structured to support the flow of a real MUN event from planning to participation.

## How it works

The application is split into two main experiences:

### 1. Organizer experience
Organizers use the dashboard-style pages to:
- create and manage conference-related content
- oversee committees and countries
- manage delegate assignments and portfolios
- publish announcements and resources
- organize agendas and conference settings

### 2. Delegate experience
Delegates use the delegate portal to:
- access their conference dashboard
- view committee and country information
- review resolutions, notes, and conference guidance
- stay updated with announcements and materials

The frontend is built as a polished static prototype, while the backend is being structured as a real service that can eventually power authentication, persistence, and API-driven data.

## Actual technology stack

The project currently uses the following technologies:

### Frontend
- HTML5 for page structure
- CSS3 for styling
- JavaScript for interactivity
- Bootstrap 5 for layout and components
- Font Awesome icons
- Custom JavaScript modules under the frontend assets folder

### Backend
- Node.js
- Express.js
- MySQL database support via mysql2
- CORS, Helmet, Morgan, and dotenv for API and security setup
- JSON Web Token support for future authentication flows
- bcrypt for password hashing

### Project structure
```text
backend/
  src/
    app.js
    server.js
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
    validations/
frontend/
  index.html
  login.html
  register.html
  delegate/
  organizer/
  assets/
    css/
    js/
```

## Current status

This repository currently contains:
- a complete static frontend prototype for organizer and delegate workflows
- a Node.js/Express backend scaffold with MySQL connection setup
- initial route and application structure for future API development

What is not fully implemented yet:
- full authentication and user sessions
- persistent database-backed features end-to-end
- live file management and real data storage for all modules

## Running the project locally

### Prerequisites
- Node.js 18 or newer
- npm
- MySQL server (for the backend database connection)

### 1. Install dependencies
From the repository root:
```bash
npm install
```

Then install backend dependencies:
```bash
cd backend
npm install
```

### 2. Configure environment variables
Create a `.env` file inside the backend folder with values similar to:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mun_buddy
```

### 3. Start the backend
```bash
cd backend
npm run dev
```

### 4. Open the frontend
You can open the HTML files directly in the browser, or serve the frontend locally with a simple static server such as:
```bash
cd frontend
python -m http.server 8000
```
Then visit:
```text
http://localhost:8000
```

## Development notes

- Keep frontend pages and shared scripts organized under the frontend folders.
- Backend logic should stay modular under the backend src structure.
- New features should be added incrementally and tested before integrating with the database.

## Roadmap

- complete authentication for organizers and delegates
- connect the frontend to real backend APIs
- implement database-backed conference and delegate management
- add resource uploads and announcement workflows
- expand analytics and AI-assisted conference features

## License

This project is licensed under the ISC license in the root repository files.