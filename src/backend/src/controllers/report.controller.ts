import { Request, Response, NextFunction } from "express";
import { reportService } from "../services/report.service";

export class ReportController {
  async getMemberReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getMemberReport(req.orgId!);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getEventReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getEventReport(
        req.orgId!,
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getPaymentReport(
        req.orgId!,
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async exportMemberReport(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await reportService.exportMemberReport(req.orgId!);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=member-report.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportEventReport(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await reportService.exportEventReport(req.orgId!);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=event-report.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportPaymentReport(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await reportService.exportPaymentReport(req.orgId!);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=payment-report.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
