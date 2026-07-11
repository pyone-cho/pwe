import { Request, Response, NextFunction } from "express";

// Tenant middleware - ensures org_id is set on request
// 1. If auth middleware already set req.orgId, use that (JWT-derived)
// 2. Otherwise, fall back to x-org-id header (for public/guest routes)
export function tenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.orgId) {
    const headerOrgId = req.headers["x-org-id"] as string | undefined;
    if (headerOrgId) {
      req.orgId = headerOrgId;
    } else {
      res.status(403).json({ success: false, error: "Organization context required" });
      return;
    }
  }

  next();
}
