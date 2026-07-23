import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { registrationController } from "../controllers/registration.controller";
import { authenticate, optionalAuth } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";
import { validate, eventSchemas, registrationSchemas } from "../middleware/validate.middleware";

const router = Router();

// Public routes (no auth required, but need org context)
router.get("/public", tenantIsolation, eventController.getPublicEvents);
router.get("/public/:id", tenantIsolation, eventController.getPublicEventById);

// Guest registration (no auth required, needs org context via x-org-id header)
router.post("/:eventId/register", authLimiter, optionalAuth, tenantIsolation, validate(registrationSchemas.create), registrationController.create);

// Protected routes
router.use(authenticate, tenantIsolation);

// Member self-registration (authenticated members can register for events)
router.post("/:eventId/register/member", requireMinRole("member"), registrationController.registerForMember);
router.get("/:eventId/register/member", requireMinRole("member"), registrationController.getMyRegistration);
router.delete("/:eventId/register/member", requireMinRole("member"), registrationController.cancelMyRegistration);

router.get("/", requireMinRole("member"), eventController.list);
router.post("/", requireMinRole("staff"), validate(eventSchemas.create), eventController.create);
router.get("/:id", requireMinRole("member"), eventController.getById);
router.put("/:id", requireMinRole("staff"), validate(eventSchemas.update), eventController.update);
router.patch("/:id/status", requireMinRole("staff"), eventController.updateStatus);

export default router;
