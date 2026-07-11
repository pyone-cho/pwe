import { Request, Response, NextFunction } from "express";
import { orgService } from "../services/org.service";

export class OrgController {
  async getOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await orgService.getOrg(req.orgId!);
      res.json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  }

  async updateOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await orgService.updateOrg(req.orgId!, req.body);
      res.json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  }

  async getOrgStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await orgService.getOrgStats(req.orgId!);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const orgController = new OrgController();
