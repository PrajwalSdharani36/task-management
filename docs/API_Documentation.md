# API Documentation

Base URL: `http://localhost:5000/api`
Protected endpoints need the header `Authorization: Bearer <token>`.

## Response format

```json
{ "success": true,  "message": "Task created successfully", "data": { } }
{ "success": false, "message": "You are not authorized", "statusCode": 403 }
```

Validation errors also include `"errors": { "field": "message" }`.

| Code | Meaning |
| ---- | ------- |
| 200 | Read or update succeeded |
| 201 | Resource created |
| 400 | Invalid input (missing field, bad enum, bad JSON, business rule) |
| 401 | Missing, invalid or expired token; wrong login |
| 403 | Logged in but role/ownership does not allow the action |
| 404 | Not found **or not accessible to you** (we don't reveal other users' tasks) |
| 409 | Email already registered |
| 429 | Too many failed login attempts (locked for 15 minutes) |
| 503 | Database unavailable |

## Auth

| Method | Path | Auth | Body | Notes |
| ------ | ---- | ---- | ---- | ----- |
| GET | `/auth/config` | — | — | `{ allowRegistration, emailDomain }` — used by the register page |
| POST | `/auth/register` | — | `name, email, password` | Email must end in `@team6.dev` (`ALLOWED_EMAIL_DOMAIN`), else 400. Always creates an **employee**. Disabled when `ALLOW_REGISTRATION=false`. Returns `{ token, user }` |
| POST | `/auth/login` | — | `email, password` | Returns `{ token, user }`. Same 401 message for unknown email and wrong password. After 5 failed attempts for the same email the login is locked for 15 minutes (429) |
| GET | `/auth/me` | any | — | Returns `{ user }`. Used to restore the session after a refresh |
| PATCH | `/auth/me` | any | `name?`, `currentPassword?`, `newPassword?` | Changing the password requires the current one |

## Tasks

| Method | Path | Roles | Rule |
| ------ | ---- | ----- | ---- |
| GET | `/tasks` | any | Admin: all. Manager: created by or assigned to them. Employee: assigned to them |
| GET | `/tasks/stats` | any | Counts within the same scope, open tasks per priority (`byPriority`), per-person workload for admin/manager (`workload`) and the 5 nearest open deadlines |
| GET | `/tasks/:id` | any | 404 if outside the caller's scope |
| POST | `/tasks` | admin, manager | Assignee must exist and must not be an admin |
| PATCH | `/tasks/:id` | any (in scope) | Creator/admin: any field. Assignee only: `status` only, else 403 |
| DELETE | `/tasks/:id` | admin, manager | Manager only for tasks they created |

`GET /tasks` query parameters:

| Param | Values |
| ----- | ------ |
| `status` | `todo`, `in_progress`, `completed` |
| `priority` | `low`, `medium`, `high` |
| `search` | text matched against title (case-insensitive) |
| `assignedTo` | user id (admin/manager only) |
| `mine` | `true` → only tasks assigned to me |
| `sort` | `newest` (default), `oldest`, `dueSoon`, `updated` |
| `page`, `limit` | pagination, `limit` max 100 |

Response: `{ tasks: [...], pagination: { page, limit, total, pages } }`

Task body for POST/PATCH:

```json
{
  "title": "Develop Login Page",
  "description": "Build the login form",
  "assignedTo": "<userId>",
  "priority": "high",
  "status": "in_progress",
  "dueDate": "2026-11-20"
}
```

## Activity and comments

Nested under a task, so the same access rule applies: if you can't see the task, you get 404.

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/tasks/:id/activity` | anyone who can see the task | Full history, oldest first: `created`, `status`, `assigned`, `priority`, `due_date`, `edited` and `comment` entries, with `actor` populated |
| POST | `/tasks/:id/comments` | anyone who can see the task | Body `{ "text": "..." }`, max 1000 characters. 201 with the new comment |
| DELETE | `/tasks/:id/comments/:commentId` | comment author or admin | Anyone else gets 403 |

History entries are written automatically by Mongoose hooks on the Task model whenever a task is created or saved; controllers never write them by hand.

## Users

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/users` | admin, manager | Managers never see admins. Each user includes `openTasks` |
| POST | `/users` | admin | `name, email, password, role`. Same email-domain rule as register |
| PATCH | `/users/:id` | admin | `name?`, `role?`. Cannot change own role; cannot promote someone with open tasks to admin. Demoting to employee moves the tasks they created to the acting admin (`transferredTasks` in the response) |
| DELETE | `/users/:id` | admin | Cannot delete self; blocked while the user has open tasks. Their completed tasks are removed and tasks they created move to the admin |

## Quick curl test

```bash
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prajwal@team6.dev","password":"Password@123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")

curl -s localhost:5000/api/tasks -H "Authorization: Bearer $TOKEN"
curl -s localhost:5000/api/users -H "Authorization: Bearer $TOKEN"   # 403 for an employee
```
