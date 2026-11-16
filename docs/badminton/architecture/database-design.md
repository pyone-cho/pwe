# PWE Badminton – Database Design

**Document version:** 1.1  
**Status:** Proposed logical design; Q001–Q014 confirmed; not an implemented Prisma schema  
**Database:** PostgreSQL 16  
**ORM:** Prisma 6

## 1. Design approach

PWE Badminton is an initial single-club deployment, but it is built on PWE's existing organization-scoped platform. New records therefore retain orgId and tenant-aware access controls. The design is a modular extension of the existing schema, not a separate database or a replacement for PWE core tables.

### Existing models inspected on the badminton branch

The current Prisma schema contains:

- Organization
- User
- Profile
- Member
- Event
- Registration
- Attendance
- Payment
- Announcement
- RefreshToken

Important existing fields:

- User: orgId, email, passwordHash, role, isActive.
- Member: orgId, nullable userId, firstName, lastName, email, phone, membershipStatus, membershipType.
- Profile: unique userId, personal details.
- Payment: orgId, required memberId, optional eventId and registrationId, amount, currency, status, payment method and recordedById.
- Attendance: currently event/registration oriented.

The current Member.membershipStatus and Member.membershipType fields are useful for compatibility but are not sufficient to represent a full membership plan and renewal history. The proposed Membership and MembershipPlan models provide that history. Existing fields should be retained during a staged migration and deprecated only after existing application dependencies are migrated.

## 2. Logical model groups

### 2.1 Identity and player

**Reuse:** Organization, User, Profile, Member  
**Add:** PlayerProfile, PlayerRegistrationReview

Recommended additions to Member:

- memberType: MEMBER or GUEST.
- registrationStatus: PENDING, APPROVED or REJECTED.

Prefer PlayerRegistrationReview as the authoritative approval audit log. Member.registrationStatus may hold the current state for efficient reads.

PlayerProfile should have a unique memberId and contain badminton-specific fields such as skillLevel, playingPreference and optional preferred hand. Avoid duplicating name, email and phone already stored in Profile/Member unless a clear product requirement justifies a snapshot.

Self-registration transaction:

1. Validate registration input and organization context.
2. Create User with the least-privileged role and account status appropriate for the existing auth flow.
3. Create Member with registrationStatus=PENDING.
4. Create PlayerProfile.
5. Commit all records in one transaction.
6. Notify or expose the pending status to the registrant.
7. Manager approval creates a PlayerRegistrationReview record and updates the current registration status.
8. On approval, grant Basic Access only: the Player may view/edit their own profile and view the club schedule. Do not grant self-service training enrollment, event registration or court booking.

Do not use User.isActive as the registration approval field. Authentication account status and business approval are separate controls.

### 2.2 Membership

**Add:** MembershipPlan, Membership

MembershipPlan defines a named plan, fee, duration and active flag. Membership stores an individual member's purchased period, status, start/end dates and plan reference.

Keep a full history. Do not overwrite the previous Membership on renewal. Q014 confirms at most one active Membership per Member. Enforce this with application validation and a PostgreSQL partial unique index in a reviewed migration (for example, unique memberId where status is ACTIVE), scoped by orgId as appropriate.

### 2.3 Courts and bookings

**Add:** Court, CourtBooking

CourtBooking fields should include orgId, courtId, bookedForMemberId (nullable only if club policy permits unassigned bookings), createdByUserId, startAt, endAt, status, fee snapshot/currency and notes.

The booking creator must be an authorized staff User. Enforce the staff-only rule in the API authorization layer and test it; hiding the booking button in the frontend is not sufficient. Player Basic Access does not include self-service booking.

Use a PostgreSQL exclusion constraint to prevent overlapping active bookings for the same court. A half-open interval [startAt, endAt) permits one booking to end exactly when the next begins. Cancelled bookings should not block a time slot. Implement the exact predicate and range expression in a reviewed SQL migration; Prisma schema alone may not express this constraint.

### 2.4 Training

**Add:** TrainingSession, TrainingEnrollment, TrainingAttendance

Use a dedicated TrainingAttendance model rather than forcing training attendance into the existing Attendance model, whose current required eventId and registrationId represent event attendance. This avoids weakening existing constraints and keeps training semantics clear.

TrainingSession references the assigned Coach User and optional Court. Enrollment is unique per session/member. Attendance is unique per session/member and records who marked it.

### 2.5 Teams, matches and scoring

**Add:** Team, TeamMember, Match, MatchSide, MatchParticipant, MatchGame

- Team represents a reusable Fixed Team.
- TeamMember stores roster membership with start/end dates.
- MatchSide stores the two sides of a Match; teamId is optional.
- MatchParticipant stores the actual players on each side for that match.
- MatchGame stores the manual score for each game.

For a Fixed Team match, MatchSide may reference Team, but MatchParticipant must still snapshot the players who actually played. For a Dynamic Team, MatchSide.teamId is null and MatchParticipant records the match-specific pair.

Validate lineup cardinality in the service layer: one player per side for Singles and two per side for Doubles. Prevent a player from appearing on both sides. Match result edits must be audited.

### 2.6 Payments

**Reuse and extend:** Payment

The existing Payment model is already tied to Member and optionally Event/Registration. Extend it with nullable references to Membership, CourtBooking and TrainingEnrollment as needed. Do not create a parallel BadmintonPayment table.

For the first release, one Payment record should represent one payment transaction and one primary business reference. If split payments, refunds with multiple allocations or a general ledger are required later, introduce a PaymentAllocation model rather than adding more unrelated nullable foreign keys without a clear rule.

### 2.7 Existing Event and Announcement

Reuse Event for general club events if needed. Do not force recurring training sessions or scheduled matches into Event when dedicated domain models are more accurate. Reuse Announcement for club notices.

## 3. Proposed relationship summary

| Parent | Child | Cardinality / rule |
|---|---|---|
| Organization | User | 1 to many |
| Organization | Member | 1 to many |
| User | Member | 1 to 0..1 for account-linked player records; current schema permits nullable userId |
| Member | PlayerProfile | 1 to 0..1 |
| Member | Membership | 1 to many over time |
| MembershipPlan | Membership | 1 to many |
| Member | PlayerRegistrationReview | 1 to many |
| Court | CourtBooking | 1 to many |
| Member | CourtBooking | 1 to many as booked-for player, optional |
| User | CourtBooking | 1 to many as creator |
| TrainingSession | TrainingEnrollment | 1 to many |
| Member | TrainingEnrollment | 1 to many |
| TrainingSession | TrainingAttendance | 1 to many |
| Team | TeamMember | 1 to many over time |
| Member | TeamMember | 1 to many over time |
| Match | MatchSide | exactly two sides by business rule |
| MatchSide | MatchParticipant | one for Singles; two for Doubles |
| Match | MatchGame | one to three |
| Member | MatchParticipant | 1 to many |
| Member | Payment | 1 to many |

## 4. Key database constraints

1. Unique organization-scoped account email: retain existing User unique(orgId, email).
2. Unique PlayerProfile.memberId.
3. Unique TeamMember active membership per team/member, with effective-date rules; exact partial index to be defined in migration.
4. Unique TrainingEnrollment(sessionId, memberId).
5. Unique TrainingAttendance(sessionId, memberId).
6. Unique MatchSide(matchId, side), with side limited to A/B.
7. Unique MatchGame(matchId, gameNumber), with gameNumber between 1 and 3.
8. MatchParticipant unique(matchSideId, memberId), plus service validation preventing duplicate player across both sides.
9. CourtBooking endAt > startAt.
10. CourtBooking exclusion constraint for overlapping active bookings on the same court.
11. Payment amount >= 0; currency stored as ISO-like three-character code consistent with the existing schema.
12. All tenant-scoped records carry orgId; enforce tenant consistency in application and, where practical, composite foreign keys/RLS.

## 5. Tenant isolation

Although the first deployment has one club, preserve PWE's orgId model:

- Derive orgId from the authenticated server-side identity, never from a trusted client field.
- Apply orgId to every new tenant-scoped model.
- Ensure service-layer queries and mutations always scope by orgId.
- Review Prisma middleware coverage for nested writes and raw SQL.
- Add PostgreSQL RLS policies for new tenant-scoped tables as a defense in depth.
- Test cross-organization reads, updates, deletes and relation assignments.

The existing PWE schema uses several simple foreign keys. During implementation, review whether composite keys such as (orgId, memberId) and (orgId, courtId) can be added without disrupting current relations. Do not claim tenant-safe relations solely because each table has an orgId column.

## 6. Migration strategy

1. Preserve existing tables and fields.
2. Add new tables and nullable/compatible fields first.
3. Backfill memberType and registrationStatus for existing Member rows using an explicitly reviewed mapping.
4. Keep existing membershipStatus and membershipType until all current code paths are migrated.
5. Add new relations to Payment without dropping eventId/registrationId.
6. Add PostgreSQL-specific constraints (booking exclusion, conditional uniqueness, RLS) in reviewed SQL migration files.
7. Deploy additive migration; validate data; then update application services.
8. Only remove deprecated fields in a later migration after verifying no code or reports depend on them.

## 7. Confirmed business policies

- **Q012 – Guest participation:** Guest Players may participate in Training, Friendly Matches and Tournaments only after Manager approval for the specific activity/event type. Model the approval decision with reviewer, timestamp, scope and status so approval for one event does not automatically authorize another.
- **Q013 – Approved Player permissions:** Basic Access only. A Player can view and edit their own profile and view the club schedule. Self-service Training enrollment, Event registration and Court Booking are not granted. Keep this policy in RBAC/API authorization, not only frontend visibility.
- **Q014 – Active Membership cardinality:** A Member can have at most one ACTIVE Membership at a time. Preserve historical Membership rows. Enforce with application validation and a PostgreSQL partial unique index in a reviewed SQL migration; ensure the index is tenant-safe.

## 8. Non-goals for the initial database

- Live scoring event stream.
- Tournament brackets and national league structures.
- Online payment gateway transaction models.
- Equipment inventory.
- Multiple club branches.
- AI performance prediction.
