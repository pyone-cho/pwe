import { Router } from "express";
import { memberController } from "../controllers/member.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";
import { validate, memberSchemas } from "../middleware/validate.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

router.get("/me", requireMinRole("member"), memberController.getMe);
router.get("/", requireMinRole("staff"), memberController.list);
router.get("/export", requireMinRole("staff"), memberController.exportCsv);
router.get("/:id", requireMinRole("staff"), memberController.getById);
router.post("/", requireMinRole("staff"), validate(memberSchemas.create), memberController.create);
router.put("/:id", requireMinRole("staff"), validate(memberSchemas.update), memberController.update);
router.patch("/:id/status", requireMinRole("admin"), memberController.updateStatus);
router.post("/import", requireMinRole("admin"), memberController.importCsv);

export default router;
