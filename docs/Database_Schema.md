# Database Schema

Database: `task_management` (MongoDB). Two collections: `users` and `tasks`.

## users

| Field | Type | Rules |
| ----- | ---- | ----- |
| `_id` | ObjectId | auto |
| `name` | String | required, trimmed, 2–60 chars |
| `email` | String | required, **unique index**, lowercased, email format |
| `password` | String | required, min 6, **bcrypt hash only**, `select: false` (never returned) |
| `role` | String | enum `admin` \| `manager` \| `employee`, default `employee` |
| `createdAt`, `updatedAt` | Date | timestamps |

## tasks

| Field | Type | Rules |
| ----- | ---- | ----- |
| `_id` | ObjectId | auto |
| `title` | String | required, 3–120 chars |
| `description` | String | optional, max 2000 |
| `assignedTo` | ObjectId → `users` | required |
| `createdBy` | ObjectId → `users` | required, set by the server from the token |
| `priority` | String | enum `low` \| `medium` \| `high`, default `medium` |
| `status` | String | enum `todo` \| `in_progress` \| `completed`, default `todo` |
| `dueDate` | Date | required |
| `createdAt`, `updatedAt` | Date | timestamps |
| `isOverdue` | virtual | `status != completed && dueDate < now` (computed, not stored) |

Indexes: `{ assignedTo: 1, status: 1 }`, `{ createdBy: 1 }`, `{ dueDate: 1 }`.

## activities

One collection for both the automatic history and comments.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `task` | ObjectId → `tasks` | required, indexed with `createdAt` |
| `actor` | ObjectId → `users` | who did it |
| `type` | String | `created` \| `status` \| `assigned` \| `priority` \| `due_date` \| `edited` \| `comment` |
| `from`, `to` | String | old and new value (status, priority, due date) |
| `fromUser`, `toUser` | ObjectId → `users` | old and new assignee |
| `text` | String | required when `type` is `comment`, max 1000 |
| `createdAt` | Date | timestamps |

How history is recorded (`models/Task.js`):

1. `post('init')` keeps a snapshot of the task as it was loaded.
2. The controller sets `task.$locals.actor = req.user._id` before `save()`.
3. `pre('save')` compares the snapshot with the new values and lists the changes.
4. `post('save')` inserts one activity entry per change.

## Relationships

```
User (1) ──< assignedTo ── (many) Task
User (1) ──< createdBy  ── (many) Task
Task (1) ──< task       ── (many) Activity
User (1) ──< actor      ── (many) Activity
```

`populate('assignedTo', 'name email role')` replaces the id with the user's public fields when reading.

## Seed data

`npm run seed` wipes both collections and inserts 7 users (1 admin, 2 managers, and the four team members as employees) and 10 tasks, each with its history (created, status changes) plus a few comments, covering every status, priority, an overdue task and a task assigned to a manager. Password for all: `Password@123`.
