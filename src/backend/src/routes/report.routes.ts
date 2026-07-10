import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

router.get("/members", requireMinRole("staff"), reportController.getMemberReport);
router.get("/members/export", requireMinRole("staff"), reportController.exportMemberReport);
router.get("/events", requireMinRole("staff"), reportController.getEventReport);
router.get("/events/export", requireMinRole("staff"), reportController.exportEventReport);
router.get("/payments", requireMinRole("admin"), reportController.getPaymentReport);
router.get("/payments/export", requireMinRole("admin"), reportController.exportPaymentReport);

export default router;
