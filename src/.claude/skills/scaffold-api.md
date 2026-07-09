---
name: scaffold-api
description: Generate a new Express API route with controller, service, validation, and test
---

# Scaffold API Endpoint

Generate a single Express API endpoint with full layering.

## Usage

When the user says "add endpoint POST /api/v1/events/:id/cancel" or "create API for X", follow these steps:

## Steps

1. **Identify the module** — which feature module does this belong to?
2. **Read existing module files** — understand current patterns
3. **Add route** to the module's `routes.ts`
4. **Add controller method** to `controller.ts`
5. **Add service method** to `service.ts` with Prisma query + `orgId`
6. **Add Zod schema** to `validation.ts` if request body/params need validation
7. **Add test** to `__tests__/<feature>.test.ts`

## Route Pattern

```typescript
// In routes.ts
router.post('/:id/cancel',
  authMiddleware,
  roleMiddleware(['admin']),
  validate(cancelEventSchema),
  asyncHandler(controller.cancelEvent)
);
```

## Controller Pattern

```typescript
// In controller.ts
export const cancelEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const orgId = req.user!.orgId;
  const result = await service.cancelEvent(id, orgId);
  res.json({ success: true, data: result });
};
```

## Service Pattern

```typescript
// In service.ts
export const cancelEvent = async (id: string, orgId: string) => {
  const event = await prisma.event.findFirst({
    where: { id, orgId },
  });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found');
  if (event.status === 'CANCELLED') throw new AppError('BAD_REQUEST', 'Already cancelled');

  return prisma.event.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
};
```

## Validation Pattern

```typescript
// In validation.ts
export const cancelEventSchema = z.object({
  reason: z.string().optional(),
});
```

## Important

- Always extract `orgId` from `req.user`, never from request body
- Use `asyncHandler` on all route handlers
- Throw `AppError` for business logic errors with proper error codes
- Validate all input with Zod before processing
