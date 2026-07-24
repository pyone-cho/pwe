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

# Slide 8 — Demo 1: Members & Events
**Member Management:**
- Add/edit members with name, phone, email
- Search, filter by status, activate/deactivate
- Reset member passwords

**Event Management:**
- 4-step wizard: info → registration → fields → review
- Draft / publish / complete / cancel lifecycle
- Member registration and cancellation

---

# Slide 9 — Demo 2: Attendance & Reports
**Attendance Tracking:**
- Check-in members at events via checkboxes
- Bulk check-in and undo
- Per-event attendance records

**Reports & Analytics:**
- Member summary cards (total, active, inactive, suspended)
- Membership type bar chart
- Event performance table (registrations, attendance %, revenue MMK)

---

# Slide 10 — Roadmap
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

# Slide 11 — Team roles
| Role | Person |
|------|--------|
| Product & Design | Hein Ko + Pyae Sone|
| Backend (Express, Prisma, Auth) | Hein Ko + Maung Suan Kim |
| Frontend (React, Tailwind) | Phyu Thant Sin + Aung Pyae Sone |
| DevOps (Docker, Railway) | pyone-cho + U Lay Aung |
| AI-assisted tooling | Claude Code |

Solo-built with AI-assisted development throughout — from architecture decisions to deployment.

---

# Slide 12 — Ask / next steps
**We're looking for:**
- **Beta testers** — Myanmar organizations to try PWE
- **Feedback** on feature gaps and UX
- **Contributors** interested in the roadmap items
- **Design help** — polish the UI, build a design system

**Try it:** Visit the live demo or clone the repo.

---

# Slide 13 — Thank you
**PWE** — Membership management for Myanmar

- GitHub: [pyone-cho/pwe](https://github.com/pyone-cho/pwe)
- GitHub: [team-03-app/pwe](https://github.com/vibe-code-tours/team-03-app)(future-main repo)
- Built with ❤️ and Claude Code

**Questions?**
