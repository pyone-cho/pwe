# PWE Badminton

Project documentation for the single-club badminton management application built on the existing PWE platform.

## Project baseline

| Area | Decision |
|---|---|
| Product | Badminton Club Management |
| Club model | Single club for the initial release |
| Application | Web application |
| Hosting | DigitalOcean Cloud VPS |
| Operating system | Ubuntu Server 24.04 LTS |
| Runtime deployment | Docker Engine + Docker Compose |
| Reverse proxy | Caddy |
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Domain | Existing domain (exact hostname to be supplied) |
| Backup | External storage / cloud backup |

## Confirmed product decisions

| ID | Decision | Confirmed value |
|---|---|---|
| Q001 | Court booking | Manager-authorized staff only |
| Q002 | System users | Admin, Manager, Coach and Player can log in |
| Q003 | Scoring | Manual score entry after a match |
| Q004 | Operating system | Ubuntu Server 24.04 LTS |
| Q005 | Server type | VPS |
| Q006 | VPS provider | DigitalOcean |
| Q007 | Domain | Existing domain |
| Q008 | Backup location | External storage |
| Q009 | Player categories | Members and Guest Players |
| Q010 | Player registration | Player self-registration; Manager approval required |
| Q011 | Doubles teams | Fixed teams and match-specific dynamic teams |
| Q012 | Guest Player participation | Manager approval is required for each event/activity type |
| Q013 | Approved Player permissions | Basic Access: view/edit own profile and view club schedule |
| Q014 | Simultaneous active memberships | One active Membership per Member at a time |

## Confirmed business rules

- Guest Players may participate in Training, Friendly Matches or Tournaments only when a Manager approves their participation for the relevant event/activity type.
- After approval, a Player has Basic Access: view and edit their own profile and view the club schedule. Self-service training enrollment, event registration and court booking are not included in this permission set.
- A Member may have only one active Membership at a time. Membership history is retained; a new membership may become active after the current one expires or is replaced according to club policy.

## Documents

- Database Requirements: requirements/database-requirements.md
- Database Design: architecture/database-design.md
- Entity Relationship Diagrams: architecture/erd.md

## Scope boundary

This directory documents requirements and design only. It does not contain an implemented Prisma schema, migration, Docker deployment, or application feature code. Those changes require a separate implementation task and review.
