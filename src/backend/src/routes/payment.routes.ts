import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";
import { validate, paymentSchemas } from "../middleware/validate.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

router.get("/", requireMinRole("staff"), paymentController.list);
router.get("/summary", requireMinRole("staff"), paymentController.getSummary);
router.get("/export", requireMinRole("staff"), paymentController.exportCsv);
router.post("/", requireMinRole("staff"), validate(paymentSchemas.create), paymentController.create);
router.patch("/:id", requireMinRole("admin"), validate(paymentSchemas.update), paymentController.update);
router.patch("/:id/status", requireMinRole("admin"), paymentController.updateStatus);

export default router;
