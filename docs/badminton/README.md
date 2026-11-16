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

## Pending business decisions

The following items are intentionally not treated as approved requirements:

- Q012: Guest Player participation scope.
- Q013: Permissions granted after registration approval.
- Q014: Whether a member may hold multiple simultaneous active memberships.

The database design keeps these policies configurable or enforceable in the application until they are decided. See the database requirements document.

## Documents

- Database Requirements: requirements/database-requirements.md
- Database Design: architecture/database-design.md
- Entity Relationship Diagrams: architecture/erd.md

## Scope boundary

This directory documents requirements and design only. It does not contain an implemented Prisma schema, migration, Docker deployment, or application feature code. Those changes require a separate implementation task and review.
