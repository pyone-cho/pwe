# PWE Badminton – Authentication and RBAC Review

**Version:** 0.1  
**Status:** Inspection findings and proposed migration policy  
**Inspected branch:** badminton  
**Scope:** Existing auth, RBAC, tenant middleware, registration flow, seed and initial migration

## 1. Existing implementation findings

### 1.1 Current role vocabulary

The backend currently defines `UserRole = admin | staff | member | guest`. The RBAC middleware assigns a numeric hierarchy:

`admin (4) > staff (3) > member (2) > guest (1)`

Route guards use `requireMinRole` and `requireRole`. This makes the roles hierarchical: a higher role inherits access to every route guarded by a lower minimum role. That is too coarse to represent the different operational responsibilities of Manager and Coach safely.

### 1.2 Current role assignment

- Organization signup creates `admin`.
- Public organization registration creates `member`.
- Seed data creates `admin` and `staff`.
- No current code path inspected creates a Coach role.
- Existing frontend and Swagger types also use the legacy four-role vocabulary.

### 1.3 Registration workflow gap

The current public `POST /auth/register` flow creates User, Profile and Member in a transaction, sets role to `member`, then issues access and refresh tokens immediately.

It does not currently:
- set a Player registration status to PENDING;
- create PlayerProfile;
- create a PlayerRegistrationReview;
- wait for Manager approval before granting normal access.

This conflicts with confirmed Q010. The Badminton implementation must introduce a pending-registration state and restrict pending accounts to a registration-status experience. User.isActive must remain an authentication switch, not the approval flag.

### 1.4 Q013 permission conflict

The existing event routes allow `requireMinRole("member")` users to self-register for Events. That conflicts with Q013 Basic Access, which does not include self-service Event registration. Badminton must replace broad role-threshold assumptions with explicit permissions and ownership checks.

### 1.5 Tenant middleware

Protected member/org routes call `authenticate` before `tenantIsolation`; the tenant context is therefore derived from the JWT. The tenant middleware can use `x-org-id` for unauthenticated/public tenant selection. For authenticated requests, a client header must never override the JWT-derived orgId.

### 1.6 Seed and migration baseline

The seed currently creates a generic EventHub organization, Admin and Staff users, sample Members and a sample Event. This is platform demo data, not a Badminton-specific seed. The initial SQL migration uses simple foreign keys; it does not enforce composite same-organization relations for every reference. New models should improve tenant-aware integrity without silently breaking existing PWE relationships.

## 2. Recommended Badminton role vocabulary

Use the following canonical application roles for Badminton:

| Canonical role | Responsibility |
|---|---|
| ADMIN | Full system and organization administration |
| MANAGER | Club operations, member/player approvals, bookings, memberships, events and reporting |
| COACH | Assigned training, attendance and match-related duties only |
| PLAYER | Player Basic Access under Q013 |

Guest Player should be represented as `Member.memberType = GUEST`, not as a separate elevated/parallel login role. A Guest Player who logs in still has the PLAYER role, with participation controlled by explicit GuestParticipationApproval records.

Do not rely on a numeric role hierarchy for Manager/Coach/Player. Use explicit permission checks or role-to-permission mappings. A Coach must not automatically inherit Manager capabilities simply because of a numeric rank.

## 3. Proposed legacy mapping (requires owner confirmation)

| Existing role | Proposed Badminton mapping | Notes |
|---|---|---|
| admin | ADMIN | Preserve full admin access |
| staff | MANAGER | Conservative operational mapping; inspect each existing account before migration |
| member | PLAYER | Existing member login becomes Player |
| guest | PLAYER + Member.memberType=GUEST | Only when a linked Member record is verified as a Guest; otherwise require manual review |

This is a proposed mapping, not an approved migration. Never bulk-convert legacy `guest` users to Guest Players without verifying the linked Member record and club policy.

## 4. Permission design baseline

Use action permissions rather than a simple role ladder. Suggested permissions:

- `organization.manage`
- `users.manage`
- `players.review`
- `players.read`
- `players.update_own_profile`
- `schedule.read`
- `members.manage`
- `memberships.manage`
- `guest_participation.approve`
- `courts.manage`
- `court_bookings.manage`
- `training.manage`
- `training.attendance.manage`
- `matches.manage`
- `matches.score.record`
- `reports.read`
- `events.manage`
- `events.register_self` (not granted to Player under Q013)

Baseline:
- ADMIN: all organization permissions.
- MANAGER: all club operations except platform-wide/system-owner operations.
- COACH: only assigned training, attendance and explicitly assigned match functions.
- PLAYER: `players.read` (self only), `players.update_own_profile`, `schedule.read`.
- Guest Player: same Player baseline; participation additionally requires the relevant Manager approval.

Object-level ownership and orgId checks are required in addition to role permission checks.

## 5. Implementation requirements

1. Keep the persisted role field string-based initially to avoid an unnecessary enum migration, but validate writes against the canonical role vocabulary after a staged migration.
2. Add a controlled legacy-role migration with an account-by-account exception report.
3. Do not change JWT claims format until token invalidation/refresh behavior has been planned.
4. Update backend types, RBAC middleware, auth service, route guards, frontend role unions, Swagger schemas and seed data together.
5. Add a Player registration approval gate. A newly registered Player must not receive full Player permissions before approval.
6. Remove/deny Player self-service Event registration and any other Q013-excluded operation in API routes, not only in the UI.
7. Keep Manager-only approval endpoints protected by explicit permission.
8. Add tests for role-permission matrix, own-profile-only access, pending/rejected registration, guest activity approval and cross-tenant access.

## 6. Review decision required

Confirm the proposed legacy role mapping in Section 3 before implementing the migration:

- admin → ADMIN
- staff → MANAGER
- member → PLAYER
- guest → PLAYER + GUEST member category only when the linked Member record verifies that category; otherwise manual review

If staff accounts include Coaches, they must be identified and assigned COACH explicitly rather than automatically remaining MANAGER.
