import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireMinRole } from "../middleware/rbac.middleware";
import { tenantIsolation } from "../middleware/tenant.middleware";

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, tenantIsolation);

router.get("/events/:eventId/attendance", requireMinRole("staff"), attendanceController.listByEvent);
router.get("/events/:eventId/attendance/summary", requireMinRole("staff"), attendanceController.getSummary);
router.get("/events/:eventId/attendance/export", requireMinRole("staff"), attendanceController.exportCsv);
router.post("/events/:eventId/attendance", requireMinRole("staff"), attendanceController.checkIn);
router.post("/events/:eventId/attendance/bulk", requireMinRole("staff"), attendanceController.bulkCheckIn);
router.delete("/attendance/:id", requireMinRole("admin"), attendanceController.undoCheckIn);

export default router;
