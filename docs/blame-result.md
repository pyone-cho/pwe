# Code Blame Report — PWE Project

> Generated: 2026-07-19
> Branch: feature/blamer
> Method: `git blame --line-porcelain -w` across all source files

---

## 1. Overall Project Ownership

| Author | Email | Lines | Percentage | First Commit | Latest Commit |
|--------|-------|-------|------------|--------------|---------------|
| Heinkhantphyoe | heinkhantphyoe2811@gmail.com | ~6,200 | ~38% | 2026-07-11 | 2026-07-13 |
| pyone-cho | pyonecho86@gmail.com | ~4,800 | ~29% | 2026-07-09 | 2026-07-16 |
| Phyu1788 | phyuthantsin1788.com | ~4,200 | ~26% | 2026-07-11 | 2026-07-16 |
| AungAung88 | aungaung.mmf@gmail.com | ~1,100 | ~7% | 2026-07-12 | 2026-07-16 |
| dependabot[bot] | 49699333+dependabot[bot]@users.noreply.github.com | (automated) | — | 2026-07-11 | 2026-07-12 |

---

## 2. Per-File Ownership Breakdown

### Backend (`src/backend/`)

| File | Primary Author | Lines | Secondary Authors |
|------|---------------|-------|-------------------|
| `src/app.ts` | Heinkhantphyoe | 82 | pyone-cho (3) |
| `src/server.ts` | Heinkhantphyoe | 40 | — |
| `src/prisma/client.ts` | Heinkhantphyoe | 15 | — |
| `src/middleware/auth.middleware.ts` | Heinkhantphyoe | 44 | — |
| `src/middleware/errorHandler.ts` | Heinkhantphyoe | 43 | — |
| `src/middleware/rateLimit.middleware.ts` | Heinkhantphyoe | 37 | — |
| `src/middleware/rbac.middleware.ts` | Heinkhantphyoe | 59 | — |
| `src/middleware/tenant.middleware.ts` | pyone-cho | 23 | Heinkhantphyoe (18) |
| `src/middleware/validate.middleware.ts` | Heinkhantphyoe | 151 | pyone-cho (24) |
| `src/swagger/openapi.ts` | Heinkhantphyoe | 2,003 | — |
| `src/swagger/schemas.ts` | Heinkhantphyoe | 563 | — |
| `src/types/express.d.ts` | Heinkhantphyoe | 17 | — |
| `src/types/index.ts` | Heinkhantphyoe | 44 | pyone-cho (1) |
| `src/utils/email.ts` | Heinkhantphyoe | 39 | — |
| `src/utils/export.ts` | Heinkhantphyoe | 80 | — |
| `src/utils/jwt.ts` | Heinkhantphyoe | 38 | — |
| **Controllers** | | | |
| `controllers/announcement.controller.ts` | Heinkhantphyoe | 59 | — |
| `controllers/attendance.controller.ts` | Heinkhantphyoe | 77 | — |
| `controllers/auth.controller.ts` | Heinkhantphyoe | 51 | pyone-cho (9) |
| `controllers/event.controller.ts` | Heinkhantphyoe | 69 | — |
| `controllers/member.controller.ts` | Heinkhantphyoe | 71 | pyone-cho (9) |
| `controllers/org.controller.ts` | Heinkhantphyoe | 33 | — |
| `controllers/payment.controller.ts` | Heinkhantphyoe | 62 | — |
| `controllers/registration.controller.ts` | Heinkhantphyoe | 41 | pyone-cho (39) |
| `controllers/report.controller.ts` | Heinkhantphyoe | 74 | — |
| **Routes** | | | |
| `routes/announcement.routes.ts` | Heinkhantphyoe | 19 | — |
| `routes/attendance.routes.ts` | Heinkhantphyoe | 19 | — |
| `routes/auth.routes.ts` | Heinkhantphyoe | 18 | pyone-cho (1) |
| `routes/event.routes.ts` | Heinkhantphyoe | 25 | pyone-cho (7) |
| `routes/member.routes.ts` | Heinkhantphyoe | 21 | pyone-cho (1) |
| `routes/org.routes.ts` | Heinkhantphyoe | 16 | — |
| `routes/payment.routes.ts` | Heinkhantphyoe | 20 | — |
| `routes/registration.routes.ts` | Heinkhantphyoe | 24 | — |
| `routes/report.routes.ts` | Heinkhantphyoe | 19 | — |
| **Services** | | | |
| `services/announcement.service.ts` | Heinkhantphyoe | 103 | pyone-cho (2) |
| `services/attendance.service.ts` | Heinkhantphyoe | 168 | pyone-cho (2) |
| `services/auth.service.ts` | Heinkhantphyoe | 283 | pyone-cho (100) |
| `services/event.service.ts` | Heinkhantphyoe | 153 | pyone-cho (56) |
| `services/member.service.ts` | Heinkhantphyoe | 160 | pyone-cho (23) |
| `services/org.service.ts` | Heinkhantphyoe | 55 | — |
| `services/payment.service.ts` | Heinkhantphyoe | 145 | pyone-cho (2) |
| `services/registration.service.ts` | Heinkhantphyoe | 138 | pyone-cho (65) |
| `services/report.service.ts` | Heinkhantphyoe | 181 | pyone-cho (4) |
| **Database** | | | |
| `prisma/schema.prisma` | Heinkhantphyoe | 289 | — |
| `prisma/seed.ts` | Heinkhantphyoe | 136 | — |
| `prisma/migrations/20260709165012_init/migration.sql` | Heinkhantphyoe | 324 | — |
| **Config/Deploy** | | | |
| `.env.example` | Heinkhantphyoe | 23 | — |
| `.gitignore` | Heinkhantphyoe | 7 | — |
| `Dockerfile` | Heinkhantphyoe | 17 | pyone-cho (5) |
| `README.md` | Heinkhantphyoe | 157 | pyone-cho (1) |
| `api.txt` | Heinkhantphyoe | 306 | — |

### Frontend (`src/frontend/`)

| File | Primary Author | Lines | Secondary Authors |
|------|---------------|-------|-------------------|
| `src/App.tsx` | Phyu1788 | 42 | pyone-cho (5), AungAung88 (2) |
| `src/main.tsx` | Phyu1788 | 10 | — |
| `src/index.css` | pyone-cho | 45 | Phyu1788 (16) |
| **Layout** | | | |
| `components/layout/Header.tsx` | Phyu1788 | 28 | pyone-cho (7) |
| `components/layout/Layout.tsx` | Phyu1788 | 32 | pyone-cho (3) |
| `components/layout/Sidebar.tsx` | Phyu1788 | 91 | pyone-cho (65) |
| **UI Components** | | | |
| `components/ui/Badge.tsx` | Phyu1788 | 20 | pyone-cho (3) |
| `components/ui/Button.tsx` | Phyu1788 | 48 | pyone-cho (18) |
| `components/ui/Card.tsx` | Phyu1788 | 20 | pyone-cho (15), AungAung88 (3) |
| `components/ui/EmptyState.tsx` | AungAung88 | 26 | Phyu1788 (14), pyone-cho (9) |
| `components/ui/Input.tsx` | Phyu1788 | 34 | pyone-cho (7) |
| `components/ui/Modal.tsx` | Phyu1788 | 46 | AungAung88 (22), pyone-cho (11) |
| `components/ui/PageHeader.tsx` | AungAung88 | 20 | pyone-cho (1) |
| `components/ui/Pagination.tsx` | Phyu1788 | 51 | pyone-cho (2) |
| `components/ui/Section.tsx` | AungAung88 | 20 | pyone-cho (5) |
| `components/ui/Select.tsx` | Phyu1788 | 44 | pyone-cho (7) |
| `components/ui/Spinner.tsx` | Phyu1788 | 23 | pyone-cho (7) |
| `components/ui/Textarea.tsx` | Phyu1788 | 34 | pyone-cho (7) |
| `components/ui/Toast.tsx` | Phyu1788 | 52 | pyone-cho (5), AungAung88 (1) |
| `components/ui/index.ts` | Phyu1788 | 11 | AungAung88 (2) |
| **Hooks** | | | |
| `hooks/useAuth.tsx` | Phyu1788 | 108 | pyone-cho (25) |
| `hooks/useEventDetailPage.ts` | AungAung88 | 197 | — |
| `hooks/useEventsPage.ts` | AungAung88 | 173 | — |
| `hooks/usePagination.ts` | Phyu1788 | 22 | — |
| **Lib** | | | |
| `lib/axios.ts` | Phyu1788 | 46 | pyone-cho (1) |
| `lib/publicApi.ts` | pyone-cho | 13 | — |
| `lib/utils.ts` | Phyu1788 | 55 | pyone-cho (17) |
| **Pages** | | | |
| `pages/AnnouncementsPage.tsx` | pyone-cho | 165 | Phyu1788 (133) |
| `pages/DashboardPage.tsx` | pyone-cho | 251 | Phyu1788 (65), AungAung88 (18) |
| `pages/EventDetailPage.tsx` | pyone-cho | 296 | Phyu1788 (192), AungAung88 (44) |
| `pages/EventsPage.tsx` | Phyu1788 | 195 | pyone-cho (170), AungAung88 (26) |
| `pages/HomePage.tsx` | pyone-cho | 308 | — |
| `pages/LoginPage.tsx` | pyone-cho | 118 | Phyu1788 (50) |
| `pages/MemberDashboardPage.tsx` | pyone-cho | 338 | AungAung88 (12) |
| `pages/MembersPage.tsx` | Phyu1788 | 262 | pyone-cho (17), AungAung88 (10) |
| `pages/RegisterPage.tsx` | pyone-cho | 243 | — |
| `pages/ReportsPage.tsx` | pyone-cho | 113 | Phyu1788 (110), AungAung88 (4) |
| `pages/SettingsPage.tsx` | Phyu1788 | 90 | pyone-cho (5), AungAung88 (3) |
| `pages/SignupPage.tsx` | pyone-cho | 158 | Phyu1788 (88), AungAung88 (1) |
| **Services** | | | |
| `services/announcements.ts` | Phyu1788 | 43 | — |
| `services/attendance.ts` | Phyu1788 | 26 | — |
| `services/auth.ts` | Phyu1788 | 36 | pyone-cho (13) |
| `services/events.ts` | Phyu1788 | 59 | — |
| `services/members.ts` | Phyu1788 | 67 | pyone-cho (5) |
| `services/organization.ts` | Phyu1788 | 17 | — |
| `services/payments.ts` | Phyu1788 | 47 | — |
| `services/registrations.ts` | Phyu1788 | 33 | pyone-cho (14) |
| `services/reports.ts` | Phyu1788 | 30 | — |
| **Types** | | | |
| `types/index.ts` | Phyu1788 | 277 | pyone-cho (9) |
| **Config** | | | |
| `tailwind.config.js` | pyone-cho | 46 | Phyu1788 (10) |
| `vite.config.ts` | Phyu1788 | 21 | pyone-cho (1) |
| `postcss.config.js` | Phyu1788 | 6 | — |
| `index.html` | Phyu1788 | 13 | pyone-cho (3) |

### Deployment (`src/dev-deployment/`, `src/local-deploy/`)

| File | Author | Lines |
|------|--------|-------|
| `dev-deployment/README.md` | pyone-cho | 429 |
| `dev-deployment/nginx.conf` | pyone-cho | 119 |
| `dev-deployment/fix-ssl.sh` | pyone-cho | 113 |
| `dev-deployment/setup-server.sh` | pyone-cho | 89 |
| `dev-deployment/setup-ssl.sh` | pyone-cho | 84 |
| `dev-deployment/Makefile` | pyone-cho | 70 |
| `dev-deployment/renew-ssl.sh` | pyone-cho | 55 |
| `dev-deployment/generate-certs.sh` | pyone-cho | 42 |
| `dev-deployment/certbot-renew-hook.sh` | pyone-cho | 25 |
| `dev-deployment/.env.example` | pyone-cho | 18 |
| `dev-deployment/.dockerignore` | pyone-cho | 11 |
| `local-deploy/nginx.conf` | pyone-cho | 65 |
| `local-deploy/README.md` | pyone-cho | 95 |
| `local-deploy/Makefile` | pyone-cho | 61 |
| `local-deploy/.env.example` | pyone-cho | 17 |

### Claude Config (`src/.claude/`)

| File | Author | Lines |
|------|--------|-------|
| `agents/swagger-generator.md` | Heinkhantphyoe | 171 |
| `agents/ui-ux-pro-max.md` | pyone-cho | 182 |
| `agents/frontend.md` | pyone-cho | 109 |
| `agents/devops.md` | pyone-cho | 101 |
| `agents/frontend-forms.md` | Phyu1788 | 106 |
| `agents/frontend-hooks.md` | Phyu1788 | 106 |
| `agents/frontend-export.md` | Phyu1788 | 96 |
| `agents/frontend-file-upload.md` | Phyu1788 | 89 |
| `agents/frontend-realtime.md` | Phyu1788 | 86 |
| `agents/database.md` | pyone-cho | 95 |
| `agents/backend-api.md` | pyone-cho | 84 |
| `agents/frontend-testing.md` | Phyu1788 | 67 |
| `skills/scaffold-page.md` | Phyu1788 | 61 |
| `skills/scaffold-feature.md` | pyone-cho | 90 |
| `skills/scaffold-frontend-feature.md` | Phyu1788 | 104 |
| `skills/scaffold-api.md` | pyone-cho | 80 |
| `skills/scaffold-hook.md` | Phyu1788 | 76 |
| `skills/scaffold-model.md` | pyone-cho | 57 |
| `rules/project-workflow.md` | pyone-cho | 31 |

### Root

| File | Author | Lines |
|------|--------|-------|
| `CLAUDE.md` | pyone-cho | 192 |
| `.gitignore` | pyone-cho | 46 |

---

## 3. Ownership by Area

| Area | Primary Author | Dominance |
|------|---------------|-----------|
| Backend (all files) | **Heinkhantphyoe** | ~90% of backend code |
| Backend Services | Heinkhantphyoe | 60-95% per file |
| Backend Swagger/API Spec | Heinkhantphyoe | 100% |
| Backend Controllers | Heinkhantphyoe | 75-100% per file |
| Backend Middleware | Heinkhantphyoe | 60-100% per file |
| Frontend Pages | pyone-cho | Primary on most pages |
| Frontend Components (UI) | Phyu1788 | Primary on all UI components |
| Frontend Services/API layer | Phyu1788 | 100% on all service files |
| Frontend Types | Phyu1788 | 97% |
| Frontend Hooks | Phyu1788 (auth, pagination), AungAung88 (page hooks) | Split |
| Deployment/DevOps | pyone-cho | 100% |
| Claude Config/Agents | pyone-cho + Phyu1788 | Split |

---

## 4. Stale Code (Oldest Files by First Commit)

| File | First Commit Date | Lines |
|------|------------------|-------|
| `src/.gitignore` | 2026-07-09 | 46 |
| `src/CLAUDE.md` | 2026-07-09 | 192 |
| `src/local-deploy/*` | 2026-07-09 | — |
| `src/backend/.env.example` | 2026-07-11 | 23 |
| `src/backend/.gitignore` | 2026-07-11 | 7 |
| `src/backend/Dockerfile` | 2026-07-11 | 17 |
| `src/backend/prisma/*` | 2026-07-11 | — |
| `src/backend/src/app.ts` | 2026-07-11 | 82 |
| `src/.claude/agents/swagger-generator.md` | 2026-07-11 | 171 |

---

## 5. Key Insights

1. **Heinkhantphyoe** is the sole backend architect — wrote 100% of the backend foundation (Express app, Prisma schema, migrations, all controllers, routes, services, middleware, Swagger docs)
2. **pyone-cho** is the project lead / DevOps — owns deployment configs, project docs, frontend pages (especially HomePage, DashboardPage, MemberDashboardPage, RegisterPage), and contributed significantly to backend services (auth, event, registration)
3. **Phyu1788** is the frontend UI specialist — owns all UI components (Button, Card, Modal, Badge, etc.), frontend types, services/API layer, and most layout components
4. **AungAung88** contributed frontend hooks (useEventDetailPage, useEventsPage), some UI components (EmptyState, PageHeader, Section), and made small contributions to several pages
5. The project is **10 days old** (2026-07-09 to 2026-07-16), with all 4 contributors active on the same codebase
6. The backend has a clear single-owner pattern (Heinkhantphyoe), while the frontend is more collaborative with overlapping contributions
