import { Router } from "express";
import { announcementController } from "../controllers/announcement.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";
import { validate, announcementSchemas } from "../middleware/validate.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

router.get("/", requireMinRole("member"), announcementController.list);
router.get("/:id", requireMinRole("member"), announcementController.getById);
router.post("/", requireMinRole("staff"), validate(announcementSchemas.create), announcementController.create);
router.put("/:id", requireMinRole("staff"), validate(announcementSchemas.update), announcementController.update);
router.patch("/:id/status", requireMinRole("staff"), validate(announcementSchemas.updateStatus), announcementController.updateStatus);

export default router;
