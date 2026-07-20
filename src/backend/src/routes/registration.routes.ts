import { Router } from "express";
import { registrationController } from "../controllers/registration.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

// Event-specific registration routes
router.get(
  "/events/:eventId/registrations",
  requireMinRole("staff"),
  registrationController.listByEvent
);

router.patch(
  "/registrations/:id/cancel",
  requireMinRole("staff"),
  registrationController.cancel
);

export default router;
