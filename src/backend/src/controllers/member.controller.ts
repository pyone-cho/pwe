import { Request, Response, NextFunction } from "express";
import { memberService } from "../services/member.service";

export class MemberController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await memberService.getMe(req.orgId!, req.user!.userId);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await memberService.list(req.orgId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await memberService.getById(req.orgId!, req.params.id);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await memberService.create(req.orgId!, req.body);
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await memberService.update(req.orgId!, req.params.id, req.body);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await memberService.updateStatus(req.orgId!, req.params.id, req.body.status);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  async importCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await memberService.importCsv(req.orgId!, req.body.records);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await memberService.exportCsv(req.orgId!, req.query as any);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=members.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const memberController = new MemberController();
