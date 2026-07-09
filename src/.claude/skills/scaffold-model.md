---
name: scaffold-model
description: Generate a new Prisma model with multi-tenant support and migration
---

# Scaffold Prisma Model

Generate a new Prisma model with proper multi-tenant design.

## Usage

When the user says "add model X" or "create database table for X", follow these steps:

## Steps

1. **Read existing schema** — understand current models and relations
2. **Read Feature-spec.md** — find data requirements for the feature
3. **Add model** to `apps/backend/prisma/schema.prisma`
4. **Add relations** to existing models if needed
5. **Create migration** — `npx prisma migrate dev --name add_<model>_model`
6. **Update seed** — add sample data if needed
7. **Generate client** — `npx prisma generate`

## Model Template

```prisma
model <Model> {
  id        String   @id @default(cuid())
  orgId     String
  org       Org      @relation(fields: [orgId], references: [id])

  // ... domain fields

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orgId])
  @@unique([orgId, /* natural key if applicable */])
}
```

## Rules

- Every tenant-scoped model MUST have `orgId` + `org` relation
- Use `cuid()` for IDs
- Include `createdAt` and `updatedAt`
- Add `@@index([orgId])` on every tenant model
- Unique constraints must include `orgId` (unique per org, not globally)
- Use PostgreSQL enums for fixed value sets
- Use `@default()` for all non-nullable fields where sensible

## When Working

- Run `npx prisma validate` after changes
- Run `npx prisma generate` to update client
- Check that existing queries still work
- Verify migration SQL before applying in production
