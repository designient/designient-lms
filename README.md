# LearnHub — Learning Management System

A production-grade LMS with student enrollment, lesson delivery, assignment submission/grading, and admin management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| ORM | Prisma 7 (with @prisma/adapter-pg) |
| Database | PostgreSQL 15 |
| Auth | NextAuth.js v5 (beta) |
| File Storage | MinIO (S3-compatible) |
| Validation | Zod |
| Styling | Vanilla CSS (design system) |

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Docker + Docker Compose

### 1. Clone & Install

```bash
cd designient-lms
npm install --legacy-peer-deps
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **MinIO** on port `9000` (console: `9001`)

### 3. Environment Variables

Copy and configure `.env`:

```bash
# Already provided — key variables:
DATABASE_URL="postgresql://lms_user:lms_password@localhost:5432/lms_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# MinIO
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="lms-uploads"
S3_REGION="us-east-1"

# Email (optional for dev)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed data
npx tsx prisma/seed.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | Password1 |
| Instructor | instructor@lms.com | Password1 |
| Student | student@lms.com | Password1 |
| Student | alice@lms.com | Password1 |

## Project Structure

```
src/
├── app/
│   ├── api/v1/          # 30+ REST API routes
│   │   ├── auth/        # signup, login, logout, forgot/reset-password, me, verify
│   │   ├── courses/     # CRUD, publish/unpublish, modules, assignments, enroll, learn
│   │   ├── modules/     # update, delete, lessons
│   │   ├── lessons/     # update, delete, complete
│   │   ├── assignments/ # submit, submissions list
│   │   ├── submissions/ # grade
│   │   ├── me/          # courses, grades, submissions
│   │   └── admin/       # users, dashboard summary
│   ├── login/           # Login page
│   ├── signup/          # Registration page
│   ├── forgot-password/ # Password reset request
│   ├── reset-password/  # Password reset form
│   ├── courses/         # Catalog, detail, learning player
│   ├── my-courses/      # Enrolled courses
│   ├── grades/          # Grade view
│   ├── assignments/     # Assignment submission
│   └── dashboard/       # Admin/instructor dashboard
│       ├── courses/     # Course management + builder
│       ├── submissions/ # Grading queue
│       └── users/       # User management (admin)
├── components/          # Navbar, Toast, UI components, Providers
├── lib/                 # prisma, auth, api, validations, audit, s3, helpers
└── types/               # TypeScript type extensions
prisma/
├── schema.prisma        # 10 models with indexes and constraints
├── seed.ts              # Demo data seeder
docker-compose.yml       # PostgreSQL + MinIO
```

## API Endpoints

All under `/api/v1`:

### Auth
- `POST /auth/signup` — Register new user
- `POST /auth/login` — Sign in
- `POST /auth/logout` — Sign out
- `POST /auth/forgot-password` — Request reset email
- `POST /auth/reset-password` — Reset with token
- `GET /auth/me` — Current user profile
- `GET /auth/verify?token=` — Email verification

### Courses
- `GET /courses` — List published courses (paginated, filterable)
- `POST /courses` — Create course (instructor/admin)
- `GET /courses/:id` — Course detail with syllabus
- `PATCH /courses/:id` — Update course
- `POST /courses/:id/publish` — Publish course
- `POST /courses/:id/unpublish` — Unpublish course
- `POST /courses/:id/modules` — Add module
- `POST /courses/:id/enroll` — Enroll student
- `GET /courses/:id/learn` — Get course with progress
- `GET /courses/:id/assignments` — List assignments

### Content
- `PATCH /modules/:id` — Update module
- `DELETE /modules/:id` — Delete module
- `POST /modules/:id/lessons` — Add lesson
- `PATCH /lessons/:id` — Update lesson
- `DELETE /lessons/:id` — Delete lesson
- `POST /lessons/:id/complete` — Mark lesson complete

### Assignments & Grading
- `POST /assignments/:id/submit` — Submit assignment (multipart)
- `GET /assignments/:id/submissions` — View submissions (instructor)
- `POST /submissions/:id/grade` — Grade submission

### Student
- `GET /me/courses` — My enrolled courses with progress
- `GET /me/submissions` — My submissions
- `GET /me/grades` — My grades

### Admin
- `GET /admin/users` — List/search users
- `PATCH /admin/users/:id/role` — Change user role
- `PATCH /admin/users/:id/active` — Activate/deactivate user
- `GET /admin/dashboard/summary` — Platform metrics

## Features

### Student Flow
1. Sign up → Sign in
2. Browse course catalog (search, filter by level)
3. View course detail with syllabus
4. Enroll in course
5. Learn: video/text/file lessons with sidebar navigation
6. Mark lessons complete, track progress
7. Submit assignments with file upload
8. View grades and feedback

### Instructor/Admin Flow
1. Dashboard with key metrics
2. Create/edit/publish courses
3. Course builder: add modules, lessons (text/video/file)
4. Review and grade student submissions
5. User management (admin only)

### Security
- Password hashing (bcrypt)
- JWT sessions via NextAuth
- Server-side RBAC on all API routes
- Input validation (Zod) on all endpoints
- Audit logging for key actions

## Assumptions

1. Phase 1 is free enrollment (no payment)
2. File uploads go to MinIO (local S3-compatible storage)
3. Email sending is optional for dev (token-based reset works without SMTP)
4. One resubmission per assignment allowed by default
5. Course structure: Course → Modules → Lessons (ordered by position)
