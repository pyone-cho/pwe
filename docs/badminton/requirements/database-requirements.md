# PWE Badminton – Database Requirements

**Document version:** 1.1  
**Status:** Design baseline; Q001–Q014 confirmed  
**Target database:** PostgreSQL 16  
**ORM:** Prisma 6

## 1. Purpose

Define the data requirements for the initial single-club PWE Badminton web application. The design extends the existing PWE organization-management platform and must reuse existing models where practical rather than replacing the platform schema.

## 2. Confirmed decisions

| ID | Requirement | Decision |
|---|---|---|
| Q009 | Membership categories | Both club members and Guest Players are supported |
| Q010 | Player registration | Players may self-register; a Manager must approve the registration |
| Q011 | Doubles teams | Both persistent Fixed Teams and match-specific Dynamic Teams are supported |

Other confirmed product and deployment decisions:

- Single club for the initial release.
- All user categories (Admin, Manager, Coach and Player) have login accounts.
- Court bookings are created and managed by authorized club staff, not by Players.
- Match scores are entered manually after play; live scoring is out of scope.
- Single DigitalOcean VPS, Ubuntu Server 24.04 LTS, Docker Compose and Caddy.
- Existing domain and external backup storage.

## 3. Core data requirements

### 3.1 Identity and club records

1. Reuse the existing Organization, User, Profile and Member models.
2. A User is an authentication identity; a Member is a club-level person record. They must not be treated as interchangeable.
3. Member.userId remains nullable so staff can maintain records for people without login accounts.
4. A Member may have one PlayerProfile.
5. Player records must preserve their history when their membership expires or their member category changes.
6. Every tenant-scoped record must carry orgId and be queried within the authenticated organization context.

### 3.2 Player categories

The system must support:

- MEMBER: a person who has a club membership.
- GUEST: a player who may participate without holding a club membership.

The member category and membership status are separate concepts. A Member can remain a Player after a membership expires. A Guest must not be represented by inventing a paid Membership record.

Guest Player participation is subject to Manager approval for each relevant event/activity type. This applies to Training, Friendly Matches and Tournaments; approval is not a blanket entitlement.

### 3.3 Player self-registration and approval

1. A prospective Player can submit a registration request.
2. The system creates the User, Member and PlayerProfile records in one database transaction.
3. The registration starts in PENDING status.
4. A Manager-authorized reviewer can APPROVE or REJECT the request.
5. Every review decision stores reviewer, timestamp and optional remarks.
6. Repeated submissions must not create duplicate accounts or duplicate Member records for the same organization and user.
7. Authentication account status and player-registration status must remain separate. Approval must not be implemented by overloading User.isActive.
8. Pending or rejected users may only access the limited registration-status experience.
9. After approval, a Player receives Basic Access only: view and edit their own profile and view the club schedule. They cannot self-enroll in Training, register for Events or create Court Bookings under this permission set.

### 3.4 Membership plans and history

1. Support configurable Membership Plans.
2. Store each membership purchase/period as a separate Membership record.
3. Preserve historical memberships; do not overwrite an expired membership when a new one is purchased.
4. Store start date, end date, status, plan, and the Member to whom it belongs.
5. A Guest Player has no Membership unless they later join as a club Member.
6. A Member may have only one active Membership at a time. Retain all historical Membership records. A replacement Membership may become active only after the current active Membership is expired or otherwise formally ended.

### 3.5 Fixed and Dynamic Doubles Teams

1. Fixed Teams are reusable club records.
2. TeamMember records maintain membership history with effective start/end dates.
3. A Dynamic Team is created in the context of a particular Match and need not have a persistent Team record.
4. Match participants must be snapshotted on the match side so later changes to a Fixed Team do not rewrite historical match lineups.
5. Singles require one participant per side; Doubles require two participants per side.
6. A Member must not appear on both sides of the same Match.
7. Team names and membership changes must be auditable.

### 3.6 Courts and bookings

1. A Court belongs to one organization.
2. A CourtBooking identifies the court, time interval, booking status, associated player/member where applicable, and the staff User who created it.
3. Only authorized staff may create, update or cancel a booking.
4. Player accounts may view permitted schedules but cannot create bookings.
5. A court cannot have overlapping active bookings.
6. End time must be later than start time.
7. Cancelled bookings remain available for history and reporting.
8. Booking conflict protection must be enforced at the database level, not only by a prior application query.

### 3.7 Training and attendance

1. TrainingSession stores schedule, assigned Coach, optional Court, capacity and status.
2. TrainingEnrollment links a Member to a TrainingSession.
3. TrainingAttendance records attendance independently of the existing event attendance model.
4. A Member may be enrolled only once per TrainingSession.
5. Attendance states: PRESENT, ABSENT, LATE and EXCUSED.

### 3.8 Match and manual scoring

1. Match stores match type (SINGLES or DOUBLES), schedule, court, status and the recorded result.
2. MatchSide represents side A or side B.
3. MatchParticipant snapshots each Player assigned to a side.
4. MatchGame stores one game's side-A and side-B scores, with game number 1–3.
5. Live score events are not required for the initial release.
6. Match results and score corrections must record who entered or changed them.
7. Scoring baseline: rally point, best of three games, 21 points, win by two after 20–20, maximum 30 points.

### 3.9 Payments

1. Reuse the existing Payment model.
2. Extend it to optionally reference a Membership, CourtBooking or TrainingEnrollment while retaining existing Event and Registration links.
3. Keep amount, currency, payment method, status, paid timestamp and receiving User.
4. Payment records must not be deleted merely because the related booking or membership is cancelled.
5. Online payment gateway integration is out of the initial scope.

## 4. Proposed entities

| Entity | New or reused | Purpose |
|---|---|---|
| Organization | Reuse | Tenant root |
| User | Reuse / extend carefully | Authentication |
| Profile | Reuse | User personal details |
| Member | Reuse / extend | Club person record |
| PlayerProfile | New | Badminton-specific profile |
| PlayerRegistrationReview | New | Approval audit history |
| MembershipPlan | New | Membership product and fee |
| Membership | New | Membership periods/history |
| Court | New | Club court |
| CourtBooking | New | Staff-created booking |
| TrainingSession | New | Training schedule |
| TrainingEnrollment | New | Player enrollment |
| TrainingAttendance | New | Training attendance |
| Team | New | Reusable Fixed Team |
| TeamMember | New | Fixed Team roster history |
| Match | New | Match record |
| MatchSide | New | Side A / Side B |
| MatchParticipant | New | Match lineup snapshot |
| MatchGame | New | Manual game score |
| Payment | Reuse / extend | Financial record |
| Announcement | Reuse | Club notices |

## 5. Integrity, security and audit requirements

- Use UUID primary keys, PostgreSQL foreign keys and appropriate indexes.
- Apply orgId to all tenant-scoped new models.
- Prefer composite tenant-aware foreign keys where compatible with the existing schema, so a record cannot reference another organization's Member or Court.
- Never trust orgId supplied by a browser; derive it from the authenticated session/JWT.
- Retain PWE's application-level tenant filtering and review PostgreSQL RLS coverage for every new tenant-scoped table.
- Use database transactions for multi-record registration, approval, membership purchase and match-result updates.
- Add unique constraints for organization-scoped email/account associations, one PlayerProfile per Member, one enrollment per session/member, and one participant occurrence per match as appropriate.
- Enforce booking overlap with a PostgreSQL exclusion constraint using a timestamp range and a GiST index (for example, btree_gist plus a half-open [start, end) range). Confirm the exact migration SQL before implementation.
- Use check constraints for positive booking duration, non-negative payment amount, valid score ranges and valid game numbers where possible.
- Keep review and score-correction audit history.
- Soft-delete only where business history must remain; financial and match records should generally be retained.

## 6. Pending decisions – do not assume approval

| ID | Question | Status | Design handling |
|---|---|---|---|
| Q012 | What can Guest Players participate in? | Confirmed | Manager approval is required for each activity/event type: Training, Friendly Match or Tournament |
| Q013 | What can an approved Player do? | Confirmed | Basic Access: view/edit own profile and view club schedule; no self-service training enrollment, event registration or court booking |
| Q014 | Can a Member hold multiple active memberships? | Confirmed | No; at most one active Membership per Member at a time |

## 7. Acceptance criteria for the database design

- Existing PWE core entities are reused where practical.
- Member, PlayerProfile and Membership are distinct concepts.
- A Guest Player can exist without a Membership record.
- Self-registration is auditable and requires Manager approval.
- Fixed and Dynamic Doubles lineups both preserve match history.
- Booking overlap is prevented under concurrent requests.
- Match scores can be recorded manually for up to three games.
- Payments can be linked to the relevant business transaction without replacing the existing Payment model.
- Tenant isolation is maintained for all new records.
- Q012–Q014 are confirmed and must be enforced in authorization logic and membership integrity constraints.
