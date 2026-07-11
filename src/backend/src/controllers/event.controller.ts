import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service";

export class EventController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await eventService.list(req.orgId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getById(req.orgId!, req.params.id);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.create(req.orgId!, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.update(req.orgId!, req.params.id, req.body);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.updateStatus(req.orgId!, req.params.id, req.body.status);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async getPublicEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventService.getPublicEvents(req.orgId!);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async getPublicEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getPublicEventById(req.orgId!, req.params.id);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();
