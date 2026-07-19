import { Request, Response, NextFunction } from "express";
import { registrationService } from "../services/registration.service";

export class RegistrationController {
  async listByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await registrationService.listByEvent(
        req.orgId!,
        req.params.eventId,
        req.query as import("../types").PaginationQuery
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await registrationService.create(
        req.orgId!,
        req.params.eventId,
        req.body
      );
      res.status(201).json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }

  async registerForMember(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await registrationService.registerForMember(
        req.orgId!,
        req.params.eventId,
        req.user!.userId
      );
      res.status(201).json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }

  async getMyRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await registrationService.getMyRegistration(
        req.orgId!,
        req.params.eventId,
        req.user!.userId
      );
      res.json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await registrationService.cancel(req.orgId!, req.params.id);
      res.json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }

  async cancelMyRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await registrationService.cancelMyRegistration(
        req.orgId!,
        req.params.eventId,
        req.user!.userId
      );
      res.json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }
}

export const registrationController = new RegistrationController();
