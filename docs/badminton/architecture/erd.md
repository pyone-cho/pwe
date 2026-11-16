# PWE Badminton – Entity Relationship Diagrams

**Version:** 1.0  
**Status:** Proposed logical ERD; not a generated Prisma schema

The diagrams show the badminton-specific logical extension. Existing PWE core entities are marked by their current names. Some constraints (for example, exactly two match sides and one/two players per side) are business rules enforced by services and database constraints, not fully expressed by Mermaid ER notation.

## 1. Identity, Player and Membership

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ USER : scopes
    ORGANIZATION ||--o{ MEMBER : scopes
    USER ||--o| MEMBER : account_for
    USER ||--o| PROFILE : has
    MEMBER ||--o| PLAYER_PROFILE : has
    MEMBER ||--o{ MEMBERSHIP : holds
    MEMBERSHIP_PLAN ||--o{ MEMBERSHIP : defines
    MEMBER ||--o{ PLAYER_REGISTRATION_REVIEW : review_history
    USER ||--o{ PLAYER_REGISTRATION_REVIEW : reviews

    USER {
        uuid id PK
        uuid orgId FK
        string email
        string role
        boolean isActive
    }

    MEMBER {
        uuid id PK
        uuid orgId FK
        uuid userId FK
        string memberType
        string registrationStatus
        string membershipStatus
        string membershipType
    }

    PLAYER_PROFILE {
        uuid id PK
        uuid orgId FK
        uuid memberId FK
        string skillLevel
        string playingPreference
    }

    MEMBERSHIP_PLAN {
        uuid id PK
        uuid orgId FK
        string name
        decimal fee
        int durationDays
        boolean isActive
    }

    MEMBERSHIP {
        uuid id PK
        uuid orgId FK
        uuid memberId FK
        uuid planId FK
        string status
        date startDate
        date endDate
    }

    PLAYER_REGISTRATION_REVIEW {
        uuid id PK
        uuid orgId FK
        uuid memberId FK
        uuid reviewerUserId FK
        string decision
        string remarks
        datetime reviewedAt
    }
~~~

## 2. Courts and Bookings

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ COURT : owns
    COURT ||--o{ COURT_BOOKING : scheduled
    MEMBER o|--o{ COURT_BOOKING : booked_for
    USER ||--o{ COURT_BOOKING : created_by

    COURT {
        uuid id PK
        uuid orgId FK
        string name
        string status
        decimal hourlyRate
    }

    COURT_BOOKING {
        uuid id PK
        uuid orgId FK
        uuid courtId FK
        uuid bookedForMemberId FK
        uuid createdByUserId FK
        datetime startAt
        datetime endAt
        string status
        decimal amount
    }
~~~

Booking rule: the same Court cannot have overlapping non-cancelled bookings. The exact PostgreSQL exclusion constraint belongs in a SQL migration.

## 3. Training and Attendance

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ TRAINING_SESSION : owns
    USER ||--o{ TRAINING_SESSION : coaches
    COURT o|--o{ TRAINING_SESSION : hosts
    TRAINING_SESSION ||--o{ TRAINING_ENROLLMENT : includes
    MEMBER ||--o{ TRAINING_ENROLLMENT : enrolls
    TRAINING_SESSION ||--o{ TRAINING_ATTENDANCE : records
    MEMBER ||--o{ TRAINING_ATTENDANCE : attends
    USER o|--o{ TRAINING_ATTENDANCE : marks

    TRAINING_SESSION {
        uuid id PK
        uuid orgId FK
        uuid coachUserId FK
        uuid courtId FK
        string title
        datetime startAt
        datetime endAt
        int capacity
        string status
    }

    TRAINING_ENROLLMENT {
        uuid id PK
        uuid orgId FK
        uuid sessionId FK
        uuid memberId FK
        string status
    }

    TRAINING_ATTENDANCE {
        uuid id PK
        uuid orgId FK
        uuid sessionId FK
        uuid memberId FK
        uuid markedByUserId FK
        string status
        datetime markedAt
    }
~~~

## 4. Fixed Teams, Dynamic Teams, Matches and Scores

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ TEAM : owns
    TEAM ||--o{ TEAM_MEMBER : roster
    MEMBER ||--o{ TEAM_MEMBER : joins

    ORGANIZATION ||--o{ MATCH : owns
    COURT o|--o{ MATCH : hosts
    MATCH ||--|{ MATCH_SIDE : has
    TEAM o|--o{ MATCH_SIDE : fixed_team
    MATCH_SIDE ||--|{ MATCH_PARTICIPANT : lineup
    MEMBER ||--o{ MATCH_PARTICIPANT : plays
    MATCH ||--o{ MATCH_GAME : scored

    TEAM {
        uuid id PK
        uuid orgId FK
        string name
        string status
    }

    TEAM_MEMBER {
        uuid id PK
        uuid orgId FK
        uuid teamId FK
        uuid memberId FK
        date startDate
        date endDate
    }

    MATCH {
        uuid id PK
        uuid orgId FK
        uuid courtId FK
        string matchType
        datetime scheduledAt
        string status
        uuid winnerSideId FK
        uuid recordedByUserId FK
    }

    MATCH_SIDE {
        uuid id PK
        uuid orgId FK
        uuid matchId FK
        string side
        uuid teamId FK
    }

    MATCH_PARTICIPANT {
        uuid id PK
        uuid orgId FK
        uuid matchSideId FK
        uuid memberId FK
        int playerOrder
    }

    MATCH_GAME {
        uuid id PK
        uuid orgId FK
        uuid matchId FK
        int gameNumber
        int sideAScore
        int sideBScore
    }
~~~

Interpretation:

- Fixed Team: MatchSide references a Team, and MatchParticipant snapshots the actual lineup.
- Dynamic Team: MatchSide has no Team reference; MatchParticipant stores the match-specific lineup.
- Singles: one MatchParticipant on each side.
- Doubles: two MatchParticipants on each side.
- A Match has two sides and one to three games. These cardinalities require application validation and database constraints where practical.

## 5. Payments and Existing PWE Records

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ PAYMENT : scopes
    MEMBER ||--o{ PAYMENT : pays
    MEMBERSHIP o|--o{ PAYMENT : membership_payment
    COURT_BOOKING o|--o{ PAYMENT : booking_payment
    TRAINING_ENROLLMENT o|--o{ PAYMENT : training_payment
    EVENT o|--o{ PAYMENT : event_payment
    REGISTRATION o|--o{ PAYMENT : registration_payment

    PAYMENT {
        uuid id PK
        uuid orgId FK
        uuid memberId FK
        uuid membershipId FK
        uuid courtBookingId FK
        uuid trainingEnrollmentId FK
        uuid eventId FK
        uuid registrationId FK
        decimal amount
        string currency
        string status
    }
~~~

Payment is an extension of the existing PWE Payment entity, not a new parallel payment table. The optional references shown above are logical associations; implementation must define which single primary business reference a payment row represents.

## 6. Registration workflow

~~~mermaid
flowchart TD
    A[Player submits registration] --> B[Create User, Member and PlayerProfile]
    B --> C[Registration status: PENDING]
    C --> D[Manager reviews request]
    D --> E{Decision}
    E -->|Approve| F[Registration status: APPROVED]
    E -->|Reject| G[Registration status: REJECTED]
    F --> H[Apply approved-player RBAC policy]
    G --> I[Show rejection status and next steps]
~~~

The registration status is distinct from User.isActive. Q013 remains pending, so the approved-player permission set is not fixed in this design.

## 7. Confirmed and pending rules

Confirmed:

- Both Member and Guest Player categories exist.
- Player self-registration requires Manager approval.
- Fixed and Dynamic Doubles are supported.
- Court booking is staff-managed.
- Match score entry is manual.

Pending:

- Q012: Guest Player participation permissions.
- Q013: permissions after Player approval.
- Q014: simultaneous active Membership policy.

Do not implement policy-dependent constraints until these decisions are approved.
