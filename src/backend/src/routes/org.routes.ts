import { Router } from "express";
import { orgController } from "../controllers/org.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

router.get("/", requireMinRole("staff"), orgController.getOrg);
router.put("/", requireMinRole("admin"), orgController.updateOrg);
router.get("/stats", requireMinRole("staff"), orgController.getOrgStats);

export default router;
