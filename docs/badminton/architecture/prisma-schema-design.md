# PWE Badminton – Prisma Schema Design

**Document version:** 0.1  
**Status:** Proposed schema blueprint for review; not implemented  
**Target:** Prisma 6 + PostgreSQL 16

## 1. Purpose and boundary

This document translates confirmed Badminton requirements into a Prisma-oriented model plan, based on the existing `src/backend/prisma/schema.prisma` on branch `badminton`.

This is a design artifact only. It does not modify `schema.prisma`, generate migrations, alter data, or implement APIs/UI. Preserve existing PWE core models and table mappings.

## 2. Existing schema baseline and compatibility

Existing models: Organization, User, Profile, Member, Event, Registration, Attendance, Payment, Announcement and RefreshToken.

Compatibility observations:

1. `User.role` is currently a string with a legacy comment (`admin / staff / member / guest`). Confirmed Badminton roles are Admin, Manager, Coach and Player. Inspect authorization middleware before changing role values; do not silently reinterpret legacy values.
2. `Member.userId` is nullable and not unique. Existing staff-managed members may have no login.
3. `Member.membershipStatus` and `membershipType` are legacy summary fields, not a membership ledger. Retain them during additive migration.
4. Existing Registration and Attendance are Event-centric. Training requires dedicated enrollment and attendance models.
5. Payment requires memberId and optionally references Event/Registration. Extend it without dropping those links.
6. All new tenant-scoped models must include orgId and enforce organization isolation.

## 3. Naming and field conventions

- Preserve existing model names and `@@map` table names.
- UUID primary keys: `String @id @default(uuid()) @db.Uuid`.
- Tenant key: `orgId @map("org_id") @db.Uuid`.
- Use `@map` for snake_case columns.
- Use `DateTime @db.Timestamptz()` for instants and `@db.Date` for date-only fields.
- Use Decimal for monetary values.
- Match current bounded-string conventions for new statuses initially, with SQL CHECK constraints. Introduce PostgreSQL enum types only after reviewing migration and application compatibility.

## 4. Existing model extensions

### Organization
Add relation arrays for the new player, membership, approval, court, training, team, match and audit records.

### User
Add named relation arrays for review actor, guest approval reviewer, booking creator, assigned coach, attendance marker, match score recorder and audit actor. Preserve existing authentication and refresh-token relations.

### Member
Proposed additive fields:

| Field | Prisma type | Default / rule |
|---|---|---|
| memberType | String | MEMBER; allowed MEMBER / GUEST |
| registrationStatus | String | APPROVED for legacy rows; self-registration explicitly creates PENDING |

Add relations to PlayerProfile, reviews, memberships, guest approvals, bookings, training, teams and matches as appropriate. Keep userId nullable. Consider `@@unique([orgId, userId])` only after auditing existing duplicates; nullable unique behavior must be understood.

The APPROVED default is a legacy-row compatibility choice, not the registration workflow. New self-registration must explicitly set PENDING in a transaction.

## 5. Proposed new models

### PlayerProfile
Fields: id, orgId, memberId (unique), skillLevel, playingPreference, preferredHand (optional), notes, createdAt, updatedAt. Do not duplicate name/email/phone already held by Profile/Member.

### PlayerRegistrationReview
Fields: id, orgId, memberId, reviewerUserId, decision (APPROVED/REJECTED), remarks, reviewedAt. Keep Member.registrationStatus as current state and preserve each review action here.

### MembershipPlan
Fields: id, orgId, name, description, fee (Decimal), currency, durationDays, isActive, createdAt, updatedAt.

### Membership
Fields: id, orgId, memberId, planId, status, startDate, endDate, feeSnapshot (Decimal), currencySnapshot, notes, createdAt, updatedAt. Status values: ACTIVE, EXPIRED, CANCELLED, SUSPENDED. Guests have no Membership until they become club Members.

Q014: at most one ACTIVE Membership per Member. Prisma's normal unique declaration cannot express a conditional unique index. Add a PostgreSQL partial unique index in a reviewed SQL migration:

```sql
CREATE UNIQUE INDEX memberships_one_active_per_member
ON memberships (org_id, member_id)
WHERE status = 'ACTIVE';
```

Before applying it, normalize legacy statuses and check duplicate active rows. Use transactional application validation as well; the database index is the concurrency guard.

### GuestParticipationApproval
Fields: id, orgId, memberId, activityType, status, eventId (optional), trainingSessionId (optional), reviewedByUserId, reviewedAt, validFrom, validUntil, remarks, createdAt.

- activityType: TRAINING, FRIENDLY_MATCH, TOURNAMENT.
- status: APPROVED or REJECTED.
- Store a concrete Event or TrainingSession relation when approval is for one scheduled instance.
- Add a CHECK constraint to make target scope unambiguous; avoid an unvalidated polymorphic target UUID.
- Approval for one activity must not automatically authorize unrelated activities.
- Only Manager/Admin-authorized staff can issue the approval.

The final scope must consistently support the approved business rule: Manager decides participation by event/activity type. Whether the decision is category-wide or tied to a specific scheduled instance is a review gate below.

### Court and CourtBooking
Court fields: id, orgId, name, description, status, hourlyRate (Decimal optional), currency, createdAt, updatedAt.

CourtBooking fields: id, orgId, courtId, bookedForMemberId (nullable only if unassigned bookings are permitted), createdByUserId, startAt, endAt, status, feeSnapshot (Decimal optional), currency, notes, createdAt, updatedAt.

Only authorized staff can create/update/cancel bookings. Player Basic Access does not include booking creation. Require endAt > startAt. Prevent overlapping active bookings with a PostgreSQL GiST exclusion constraint on a half-open time range; cancelled bookings do not block slots. Implement this in reviewed SQL migration, not only Prisma.

### TrainingSession, TrainingEnrollment and TrainingAttendance
TrainingSession: id, orgId, title, description, coachUserId, courtId (optional), startAt, endAt, capacity (optional), status, createdAt, updatedAt.

TrainingEnrollment: id, orgId, sessionId, memberId, status, enrolledAt, reviewedByUserId (optional), notes.

TrainingAttendance: id, orgId, sessionId, memberId, markedByUserId, status, markedAt, notes.

Enforce unique (sessionId, memberId) for enrollment and attendance. Attendance values: PRESENT, ABSENT, LATE, EXCUSED. Under Q013, Player Basic Access does not include self-service enrollment; authorized staff perform it unless a later decision changes this.

### Team and TeamMember
Team: id, orgId, name, description, status, createdAt, updatedAt.

TeamMember: id, orgId, teamId, memberId, startDate, endDate, createdAt.

Team is the reusable Fixed Team; TeamMember preserves roster history. Prevent overlapping active duplicate team/member assignments. Dynamic Teams are match-specific and are represented by MatchParticipant snapshots, not persistent Team rows.

### Match, MatchSide, MatchParticipant and MatchGame
Match: id, orgId, matchType, scheduledAt, courtId (optional), status, recordedByUserId, completedAt, winnerSideId (optional), notes, createdAt, updatedAt.

MatchSide: id, orgId, matchId, side (A/B), teamId (optional).

MatchParticipant: id, orgId, matchSideId, memberId, playerOrder.

MatchGame: id, orgId, matchId, gameNumber (1–3), sideAScore, sideBScore, recordedByUserId, recordedAt.

Rules: SINGLES/DOUBLES; exactly two sides; one participant per side for Singles and two for Doubles; no player on both sides. Fixed Team matches snapshot actual players in MatchParticipant. Manual scoring only: best of three, rally point, 21 points, win by two after 20–20, cap 30.

### MatchScoreAudit
Fields: id, orgId, matchId, matchGameId (optional), actorUserId, action, beforeData (Json optional), afterData (Json optional), reason, createdAt. Treat audit rows as append-only; preserve score corrections.

### Payment extension
Add optional references to Membership, CourtBooking and TrainingEnrollment to the existing Payment model. Preserve Event and Registration references. One Payment row should represent one primary business purpose in the initial release; define a CHECK constraint or service validation after legacy payment patterns are audited. Do not create a parallel BadmintonPayment table.

## 6. Proposed status/value conventions

| Field | Values |
|---|---|
| Member.memberType | MEMBER, GUEST |
| Member.registrationStatus | PENDING, APPROVED, REJECTED |
| Membership.status | ACTIVE, EXPIRED, CANCELLED, SUSPENDED |
| GuestParticipationApproval.activityType | TRAINING, FRIENDLY_MATCH, TOURNAMENT |
| GuestParticipationApproval.status | APPROVED, REJECTED |
| Court.status | ACTIVE, INACTIVE |
| CourtBooking.status | PENDING, CONFIRMED, CANCELLED, COMPLETED |
| TrainingSession.status | DRAFT, SCHEDULED, CANCELLED, COMPLETED |
| TrainingEnrollment.status | ENROLLED, CANCELLED, WAITLISTED |
| TrainingAttendance.status | PRESENT, ABSENT, LATE, EXCUSED |
| Match.matchType | SINGLES, DOUBLES |
| Match.status | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| MatchSide.side | A, B |
| Team.status | ACTIVE, INACTIVE |

Prefer SQL CHECK constraints for bounded string values in the first pass.

## 7. Tenant isolation and relation integrity

The existing schema uses simple foreign keys. Adding orgId to a child table alone does not prevent a relation pointing to another organization's row.

Before implementation:
1. Audit existing data for cross-organization relation inconsistencies.
2. Add composite unique keys such as (orgId, id) to referenced tables where feasible.
3. Use composite tenant-aware relations for new Member/Court/User references where Prisma supports them without breaking existing code.
4. Derive orgId from authenticated server context, never a client-supplied value.
5. Scope every query/mutation by orgId.
6. Review RLS policies and raw SQL paths.
7. Test cross-tenant relation assignment and read/write isolation.

Do not break existing PWE foreign keys as part of the first Badminton migration without a separate compatibility review.

## 8. Additive migration sequence

1. Inspect API services, authorization middleware, seed data and existing rows.
2. Resolve Guest approval scope and legacy role mapping.
3. Add new models and compatible Member fields.
4. Backfill legacy Member rows only after validating the mapping.
5. Add relations to Organization, User, Member and Payment.
6. Add ordinary indexes, unique constraints and CHECK constraints.
7. Add the partial unique active-membership index after cleaning duplicate active rows.
8. Add the court booking exclusion constraint and required GiST operator support.
9. Add/verify tenant-aware foreign keys and RLS in reviewed SQL migrations.
10. Run Prisma format, validate, generate, migration diff and migration tests against a disposable database.
11. Verify existing Event, Registration, Attendance, Payment and authentication flows.

## 9. Review gates before editing schema.prisma

- Does Guest approval apply to an activity category (e.g. all Training), a specific scheduled instance, or support both?
- How do existing legacy role values map to Admin, Manager, Coach and Player? Inspect authorization middleware first.
- May CourtBooking be unassigned to a Member?
- What exact action ends/replaces an ACTIVE Membership when a replacement begins?
- Are there duplicate Member-user links or duplicate active memberships in existing data?
- What are the existing Payment reference patterns, and which composite tenant-safe relations are feasible?

## 10. Non-goals

This blueprint does not authorize changing schema.prisma, generating migrations, altering live data, or implementing APIs/UI. Those are subsequent steps after review of the gates above.
