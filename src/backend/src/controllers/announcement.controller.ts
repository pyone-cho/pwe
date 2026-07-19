import { Request, Response, NextFunction } from "express";
import { announcementService } from "../services/announcement.service";

export class AnnouncementController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.list(req.orgId!, req.query as import("../types").PaginationQuery);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.getById(req.orgId!, req.params.id);
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.create(
        req.orgId!,
        req.body,
        req.user!.userId
      );
      res.status(201).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.update(req.orgId!, req.params.id, req.body);
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.updateStatus(
        req.orgId!,
        req.params.id,
        req.body.status
      );
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }
}

export const announcementController = new AnnouncementController();
