import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";

export class PaymentController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.list(req.orgId!, req.query as import("../types").PaginationQuery);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.create(req.orgId!, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.update(req.orgId!, req.params.id as string, req.body);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.updateStatus(req.orgId!, req.params.id as string, req.body.status);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await paymentService.getSummary(req.orgId!, req.query.eventId as string);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await paymentService.exportCsv(req.orgId!, req.query.eventId as string);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
