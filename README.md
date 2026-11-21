# TaskFlow — Team 6 Task Management Portal

An interactive task management portal with role-based access control.

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Frontend | Vue 3 (Composition API, `<script setup>`), Vue Router 4, Pinia, Axios, Vite |
| Backend  | Node.js, Express 5, JWT (jsonwebtoken), bcryptjs           |
| Database | MongoDB with Mongoose                                      |

## Roles

| Role     | Can do                                                                                   |
| -------- | ---------------------------------------------------------------------------------------- |
| Admin    | Everything: all tasks, create/edit/delete any task, manage users and roles               |
| Manager  | Create and assign tasks; edit/delete tasks they created; see tasks they created or own   |
| Employee | See tasks assigned to them; change only the status of those tasks                        |

The backend enforces every rule. The frontend only hides what a user can't do.

## Features

- Login, registration (@team6.dev only) and role-based access for admin, manager and employee
- Dashboard with summary cards and charts (tasks by status, open tasks by priority, workload per person)
- Task list as cards, a table or a **Kanban board** (drag a card to another column to change its status)
- Task details with a status stepper and an **activity timeline with comments** (history is recorded automatically)
- User management for admins, a profile page, and a light/dark theme

## Run it locally

Prerequisites: Node.js 20+ and MongoDB (local `mongod` or a free MongoDB Atlas cluster).

```bash
# 1. Backend
cd backend
cp .env.example .env          # edit MONGO_URI and JWT_SECRET
npm install
npm run seed                  # creates demo users + tasks
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies every `/api` request to `http://localhost:5000`, so no CORS setup is needed in development.

### Demo accounts (password `Password@123`)

| Role     | Name                | Email               |
| -------- | ------------------- | ------------------- |
| Admin    | Asha Verma          | asha@team6.dev      |
| Manager  | Manoj Kumar         | manoj@team6.dev     |
| Manager  | Meera Reddy         | meera@team6.dev     |
| Employee | Prajwal S Dharani   | prajwal@team6.dev   |
| Employee | Chaganti Navya Sri  | navya@team6.dev     |
| Employee | Puvvada Sasidhar    | sasidhar@team6.dev  |
| Employee | Shaik Khadar Ahamad | khadar@team6.dev    |

## Accounts and roles

- **Email domain:** only `@team6.dev` addresses can register or be created by an admin. Change it with `ALLOWED_EMAIL_DOMAIN` in `backend/.env` (leave it empty to allow any domain).
- **New sign-ups** always start as employees.
- **Login protection:** after 5 wrong passwords for the same email, that login is locked for 15 minutes (`LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES` in `backend/.env`). Restarting the backend clears all locks.
- **Quick-login buttons** on the login page are hidden by default. To show them while developing, create `frontend/.env` with `VITE_DEMO_LOGINS=true` and restart `npm run dev`.
- **Adding or removing admins and managers** is done by an admin on the **Users** page:
  - *Add user* with any role, or change the role dropdown on an existing user to promote or demote them.
  - An admin can't change their own role or delete themselves, so there is always at least one admin.
  - A user with open tasks must have those tasks reassigned before they can be made admin or deleted.
  - When a manager (or admin) is demoted to employee, the tasks they created are handed over to the admin who made the change, so someone can still edit them.
- **Changing the demo data:** edit the `users` and `tasks` arrays in `backend/scripts/seed.js` and run `npm run seed` again. Any number of admins, managers and employees works.

### Verify the security rules

With the backend running and seeded:

```bash
cd backend
npm run test:api
```

It runs 27 checks against the API directly (no browser), logging in as each role and checking 401/403/404 responses, task-level access and role escalation attempts.

## Project structure

```
Team-6-Task-Management/
├── backend/
│   ├── config/        env, database connection, role/status constants
│   ├── controllers/   request handlers (auth, tasks, activity/comments, users)
│   ├── middleware/    protect (JWT), authorize (roles), task access, errors
│   ├── models/        Mongoose User, Task and Activity schemas
│   ├── routes/        Express routers mounted under /api
│   ├── scripts/       seed.js, smoke-test.js
│   ├── utils/         ApiError, token helpers, response helper
│   ├── app.js         Express app (middleware + routes)
│   └── server.js      connects to MongoDB, then starts listening
├── frontend/
│   └── src/
│       ├── components/   Navbar, Sidebar, TaskCard, TaskTable, TaskForm, KanbanBoard, TaskActivity, charts/…
│       ├── composables/  useFormat, useDebouncedRef
│       ├── router/       routes + navigation guards
│       ├── services/     Axios instance + API modules
│       ├── stores/       Pinia: auth, tasks, ui
│       ├── utils/        constants, permission helpers
│       └── views/        pages
└── docs/
    ├── API_Documentation.md
    └── Database_Schema.md
```

## Team ownership

| Member              | Area                                  |
| ------------------- | ------------------------------------- |
| Prajwal S Dharani   | Frontend components and pages         |
| Chaganti Navya Sri  | Pinia stores, routing, guards, login  |
| Puvvada Sasidhar    | Express API, JWT, middleware, errors  |
| Shaik Khadar Ahamad | MongoDB, Mongoose models, seed data   |
