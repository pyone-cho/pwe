---
marp: true
paginate: true
transition: fade
auto-advance: 20
---

# Slide 1 — Team & project
## PWE — Membership Management Platform
**Team**: Team-03

PWE is a multi-tenant SaaS platform for Myanmar organizations to manage members, events, payments, announcements, and attendance — all in one place. Built from scratch as an MVP with 7 core features.

---

# Slide 2 — The person/users
**Three user roles** in each organization:

| Role | Access |
|------|--------|
| **Admin** | Full control — settings, all modules |
| **Staff** | Operations — members, events, announcements |
| **Member** | View events, register, check-in |

Target: Myanmar clubs, associations, NGOs, and community groups that need lightweight digital management.

---

# Slide 3 — Problem
Myanmar organizations still rely on **spreadsheets, paper forms, and fragmented tools** to manage:

- Member directories and contact info
- Event registrations and attendance
- Fee collection and payment tracking
- Organization-wide announcements

No unified, local-friendly solution exists.

---

# Slide 4 — Evidence it's real
- Most Myanmar clubs/associations (100+) still use **Google Sheets + Facebook groups**
- Payment tracking is done manually in **notebooks or Excel**
- Attendance is taken on **paper lists**
- Existing global tools (Meetup, Eventbrite) lack **local payment support (MMK)** and are too expensive

---

# Slide 5 — Our idea
**PWE** — a simple, affordable membership management SaaS built specifically for Myanmar:

- Multi-tenant: one platform serves many organizations
- All-in-one: members, events, attendance, payments, announcements
- Role-based access so admins can delegate to staff
- Free-tier friendly deployment (Railway, $5/mo credit)

---

# Slide 6 — Alternatives considered

| Option | Why not |
|--------|---------|
| **Excel / Google Sheets** | No automation, no roles, error-prone |
| **Meetup / Eventbrite** | No MMK, expensive, no local hosting |
| **WordPress plugins** | Heavy, security overhead, not multi-tenant |
| **Custom per-org app** | Doesn't scale — rebuild for every client |

---

# Slide 7 — Why this one
- **Multi-tenant by design** — single codebase, many orgs (row-level org_id isolation)
- **Myanmar-first** — MMK payment amounts, local phone format
- **Modern stack** — fast, type-safe, testable
- **Free-tier deployable** — $0–$5/mo to run
- **Self-service onboarding** — create an org and go

---

# Slide 8 — Scope (MVP)
**7 features, ~136 hours, all implemented:**

| # | Feature | Hrs |
|---|---------|:---:|
| 1 | Organization workspace | 16 |
| 2 | Member management | 22 |
| 3 | Event management | 24 |
| 4 | Registration forms | 18 |
| 5 | Attendance tracking | 20 |
| 6 | Payment tracking | 16 |
| 7 | Announcements & reports | 20 |

**Dependency chain**: 1 → 2/3 → 4 → 5/6 → 7

---

# Slide 9 — Architecture
```
┌──────────────────────────────────┐
│         React SPA (Vite)          │
│   Tailwind CSS, Recharts, Formik  │
└──────────────┬───────────────────┘
       │ HTTP (Axios)
┌──────▼────────────────────────────┐
│   Express.js API (TypeScript)      │
│   JWT auth, Zod validation         │
│   Prisma ORM, Row-level org_id     │
└──────┬────────────────────────────┘
       │
┌──────▼────────────────────────────┐
│   PostgreSQL 16 (multi-tenant)    │
│   Shared tables, org_id scoping   │
└───────────────────────────────────┘
```

Single DB, shared tables + org_id, Prisma middleware + RLS safety net.

---

# Slide 10 — Tech stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 24 |
| Backend | Express.js + TypeScript |
| Frontend | React 19 + Vite 8 |
| CSS | Tailwind CSS 3.4 |
| DB | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | JWT + bcrypt (15min access, 7d refresh) |
| Validation | Zod 3.24 |
| Charts | Recharts 2.15 |
| Hosting | Railway (Docker + Nginx) |

---

# Slide 11 — MCP / skills / agents used
**Built with AI-assisted development:**

- **Claude Code** — primary development agent
- **Context7 MCP** — live library docs for React, Express, Prisma, Tailwind
- **Codebase Memory MCP** — knowledge graph of project structure and architecture
- **Chrome DevTools MCP** — UI debugging and testing
- **Sequential Thinking** — complex problem decomposition

---

# Slide 12 — Demo 1: Members & Events
**Member Management:**
- Add/edit members with name, phone, email
- Search, filter by status, activate/deactivate
- Reset member passwords

**Event Management:**
- 4-step wizard: info → registration → fields → review
- Draft / publish / complete / cancel lifecycle
- Member registration and cancellation

---

# Slide 13 — Demo 2: Attendance & Reports
**Attendance Tracking:**
- Check-in members at events via checkboxes
- Bulk check-in and undo
- Per-event attendance records

**Reports & Analytics:**
- Member summary cards (total, active, inactive, suspended)
- Membership type bar chart
- Event performance table (registrations, attendance %, revenue MMK)

---

# Slide 14 — What worked
- **Prisma + org_id middleware** — multi-tenancy is clean and type-safe
- **React + Vite** — fast dev iteration, fast builds
- **JWT httpOnly cookies** — simple, secure auth without a session store
- **Tailwind CSS** — rapid UI without fighting CSS specificity
- **4-step event wizard** — complex feature broken into manageable steps

---

# Slide 15 — What was hard
- **Express 5 types** — `req.params` casting, breaking changes from v4
- **Prisma JSON fields** — type gymnastics for `JsonValue` ↔ typed interfaces
- **Railway Docker build** — Nginx `envsubst` conflict with `$host` variables
- **Multi-tenant query isolation** — ensuring every query includes `org_id`
- **File uploads** — multer + type-safe request augmentation

---

# Slide 16 — Metrics / results
- **~15,000+ lines** of TypeScript across backend + frontend
- **7/7 MVP features** fully implemented
- **~30 API routes** with auth, validation, and rate limiting
- **Deployed live** on Railway free tier (~$4.62/mo)
- **Zero-downtime** Docker Compose deployment
- **End-to-end** user flows from org creation to attendance tracking

---

# Slide 17 — Roadmap
**Short-term:**
- Email notifications for events and announcements
- Payment gateway integration (Wave Money, KBZ Pay)
- Member import/export (CSV)

**Medium-term:**
- Custom registration forms (field builder)
- SMS notifications
- Public event listings page

**Long-term:**
- Mobile app (React Native)
- Multi-language support (Myanmar/English)

---

# Slide 18 — Team roles
| Role | Person |
|------|--------|
| Product & Design | pyone-cho |
| Backend (Express, Prisma, Auth) | pyone-cho |
| Frontend (React, Tailwind) | pyone-cho |
| DevOps (Docker, Railway) | pyone-cho |
| AI-assisted tooling | Claude Code |

Solo-built with AI-assisted development throughout — from architecture decisions to deployment.

---

# Slide 19 — Ask / next steps
**We're looking for:**
- **Beta testers** — Myanmar organizations to try PWE
- **Feedback** on feature gaps and UX
- **Contributors** interested in the roadmap items
- **Design help** — polish the UI, build a design system

**Try it:** Visit the live demo or clone the repo.

---

# Slide 20 — Thank you
**PWE** — Membership management for Myanmar

- GitHub: [pyone-cho/pwe](https://github.com/pyone-cho/pwe)
- Built with ❤️ and Claude Code

**Questions?**
