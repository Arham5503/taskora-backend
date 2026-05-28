# Taskora Backend

Taskora Backend is an Express.js REST API for the Taskora project management app. It handles user authentication, OTP email verification, project collaboration, invite links, task management, and blog content.

## Features

- User signup, login, logout, profile updates, and session refresh
- JWT authentication with HTTP-only cookies
- Email OTP verification and OTP resend flow
- Project CRUD with owner and team-member access control
- Project invite links with roles, expiry dates, and usage limits
- Task CRUD, task status updates, assignees, categories, and project progress tracking
- Notification system for task assignments, task updates, project updates, joins, and removals
- Blog creation and fetching
- MongoDB persistence with Mongoose models

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens
- bcryptjs
- Nodemailer
- Cookie Parser
- CORS

## Project Structure

```text
.
|-- app.js
|-- server.js
|-- package.json
|-- config/
|   `-- db.js
|-- controllers/
|   |-- authController.js
|   |-- blog.js
|   |-- notifications.js
|   |-- project.js
|   `-- tasks.js
|-- middleware/
|   `-- authantication.js
|-- models/
|   |-- Blogs.model.js
|   |-- Otp.model.js
|   |-- Notification.model.js
|   |-- Project.model.js
|   |-- ProjectInvite.model.js
|   |-- Signup.model.js
|   |-- Task.model.js
|   `-- UserProjectConnection.model.js
|-- routes/
|   `-- authRoutes.js
`-- utils/
    |-- otp.js
    `-- sendEmail.js
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB database connection string
- Gmail account or app password for OTP emails

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
DB=mongodb+srv://username:password@cluster.mongodb.net/taskora

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXP=15m
REFRESH_TOKEN_EXP=7d

EMAIL=your_email@gmail.com
APP_PASSWORD=your_gmail_app_password

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Run the Server

```bash
npm run dev
```

The API is mounted under:

```text
http://localhost:3000/api
```

The configured CORS origins are:

- `https://taskora-chi.vercel.app`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:3000`

## Available Scripts

```bash
npm run dev
```

Starts the server with Nodemon.

```bash
npm test
```

Currently returns the default placeholder test error.

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/signup` | Create a user and send OTP email |
| POST | `/login` | Log in and set access/refresh cookies |
| GET | `/refresh` | Refresh access token from refresh cookie |
| GET | `/profile` | Get logged-in user profile |
| POST | `/profile` | Update logged-in user profile |
| GET | `/me` | Verify current session and return user |
| GET | `/logout` | Clear auth cookies |
| POST | `/resend-otp` | Send a new OTP to an unverified user |
| POST | `/verify-otp` | Verify user email with OTP |

Example signup body:

```json
{
  "username": "Arham",
  "email": "arham@example.com",
  "password": "password123"
}
```

Example login body:

```json
{
  "email": "arham@example.com",
  "password": "password123"
}
```

### Blogs

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/create-blog` | Create a blog post |
| GET | `/blog` | Fetch all blog posts |

Example blog body:

```json
{
  "title": "Taskora Update",
  "content": "New collaboration features are live.",
  "slug": "taskora-update"
}
```

### Projects

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/project` | Create a project |
| GET | `/project-data` | Fetch projects for the logged-in user |
| GET | `/project/:projectId` | Fetch a single project |
| PUT | `/project/:projectId` | Update a project |
| PATCH | `/project/:projectId/status` | Update project status |
| DELETE | `/project/:projectId` | Delete a project |
| GET | `/users` | Fetch suggested team members |

Example project body:

```json
{
  "title": "Website Redesign",
  "priority": "high",
  "durationDays": 30,
  "description": "Refresh the product website.",
  "client": "Taskora",
  "team": []
}
```

Valid project priorities:

- `low`
- `medium`
- `high`

Valid project statuses:

- `planning`
- `in_progress`
- `completed`
- `on_hold`

### Project Team

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/project/:projectId/team` | Fetch project owner and team |
| DELETE | `/project/:projectId/team/:memberId` | Remove a team member |

### Project Invites

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/project/:projectId/invite` | Generate an invite link |
| GET | `/invite/:inviteCode` | Preview invite information |
| POST | `/invite/:inviteCode/join` | Join a project through an invite |

Example invite body:

```json
{
  "role": "contributor",
  "expiresInDays": 7,
  "maxUses": 5
}
```

Valid invite roles:

- `owner`
- `manager`
- `contributor`
- `viewer`

### Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/task` | Create a task, with optional multipart attachments |
| GET | `/tasks` | Fetch tasks across the user's projects |
| GET | `/project/:projectId/tasks` | Fetch tasks for one project |
| GET | `/task/:taskId` | Fetch a single task |
| PUT | `/task/:taskId` | Update a task |
| PATCH | `/task/:taskId/status` | Update task status |
| DELETE | `/task/:taskId` | Delete a task |

Example task body:

```json
{
  "title": "Create wireframes",
  "description": "Prepare dashboard wireframes.",
  "priority": "medium",
  "dueDate": "2026-06-01",
  "project": "PROJECT_ID",
  "assignees": [],
  "category": "Design"
}
```

Valid task priorities:

- `low`
- `medium`
- `high`

Valid task statuses:

- `todo`
- `in_progress`
- `in_review`
- `done`

Task creation also supports `multipart/form-data` with an `attachments` field. When files are sent, the backend stores the attachment count on the task.

### Notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/notifications` | Fetch notifications for the logged-in user |
| GET | `/notifications/unread-count` | Fetch unread notification count |
| PATCH | `/notifications/:notificationId/read` | Mark one notification as read |
| PATCH | `/notifications/read-all` | Mark all notifications as read |
| DELETE | `/notifications/:notificationId` | Delete one notification |

Supported notification query params for `GET /notifications`:

| Query | Description |
| --- | --- |
| `type` | `all`, `task`, `mention`, `project`, or `system` |
| `read` | `true` or `false` |
| `page` | Page number, defaults to `1` |
| `limit` | Page size, defaults to `30`, max `100` |

Example:

```text
GET /api/notifications?type=task&read=false&page=1&limit=20
```

Notifications are created automatically for:

- New task assignments
- New assignees added to an existing task
- Task completion
- Task status updates
- Project status updates
- Users added to a project during project creation
- Users joining a project through an invite link
- Users removed from a project

Notification types:

- `task`
- `mention`
- `project`
- `system`

## Authentication Notes

Protected routes expect the `accessToken` cookie set by `/api/login`. The refresh flow uses the `refreshToken` cookie.

When testing with tools like Postman or Thunder Client, enable cookie storage and send requests with credentials. When calling from a frontend, use credentials:

```js
fetch("http://localhost:3000/api/me", {
  credentials: "include"
});
```

## Data Models

Main MongoDB collections:

- `Signup`: users, profile details, and email verification state
- `OTP`: hashed OTP records with expiry
- `Project`: project metadata, owner, team, status, and progress counters
- `Task`: task data, assignees, checklist, and project relationship
- `Notification`: user notifications, read state, actor, linked task/project, and metadata
- `ProjectInvite`: invite codes, roles, expiry, and usage limits
- `Connection`: collaboration history between users
- `blog`: blog posts

## Notes

- The app uses Gmail through Nodemailer for OTP emails, so `APP_PASSWORD` should be a Gmail app password.
- Cookies are marked secure in production. For local development, `NODE_ENV=development` keeps login cookies usable over HTTP.
- `FRONTEND_URL` is used when generating project invite links.
