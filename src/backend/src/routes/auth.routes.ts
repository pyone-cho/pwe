import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate, authSchemas } from "../middleware/validate.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Public routes
router.post("/signup", authLimiter, validate(authSchemas.signup), authController.signup);
router.post("/login", authLimiter, validate(authSchemas.login), authController.login);
router.post("/refresh", authLimiter, validate(authSchemas.refreshToken), authController.refreshToken);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);

export default router;
