import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";

// Role hierarchy: admin > staff > member > guest
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  staff: 3,
  member: 2,
  guest: 1,
};

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
}

export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const userRole = req.user.role as UserRole;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: `Access denied. Minimum role required: ${minRole}`,
      });
      return;
    }

    next();
  };
}

// Convenience middleware
export const requireAdmin = requireRole("admin");
export const requireStaff = requireMinRole("staff");
export const requireMember = requireMinRole("member");
