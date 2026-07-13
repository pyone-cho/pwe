import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";

// Tenant middleware - ensures org_id is set on request
// 1. If auth middleware already set req.orgId, use that (JWT-derived)
// 2. Otherwise, fall back to x-org-id header (for public/guest routes)
//    - If the value is a UUID, use it directly
//    - If it's a slug, resolve it to a UUID
export function tenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.orgId) {
    const headerOrgId = req.headers["x-org-id"] as string | undefined;
    if (headerOrgId) {
      // Check if it's a UUID (contains hyphens in standard format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(headerOrgId)) {
        req.orgId = headerOrgId;
      } else {
        // Treat as slug — resolve to UUID
        prisma.organization
          .findUnique({ where: { slug: headerOrgId }, select: { id: true } })
          .then((org) => {
            if (!org) {
              res.status(403).json({ success: false, error: "Organization not found" });
              return;
            }
            req.orgId = org.id;
            next();
          })
          .catch(() => {
            res.status(500).json({ success: false, error: "Failed to resolve organization" });
          });
        return;
      }
    } else {
      res.status(403).json({ success: false, error: "Organization context required" });
      return;
    }
  }

  next();
}
