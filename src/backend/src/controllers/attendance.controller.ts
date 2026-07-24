import { Request, Response, NextFunction } from "express";
import { attendanceService } from "../services/attendance.service";

export class AttendanceController {
  async listByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.listByEvent(
        req.orgId!,
        req.params.eventId as string,
        req.query as import("../types").PaginationQuery
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance = await attendanceService.checkIn(
        req.orgId!,
        req.params.eventId as string,
        req.body.registrationId,
        req.user!.userId,
        req.body.notes
      );
      res.status(201).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async bulkCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.bulkCheckIn(
        req.orgId!,
        req.params.eventId as string,
        req.body.registrationIds,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async undoCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.undoCheckIn(req.orgId!, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await attendanceService.getSummary(req.orgId!, req.params.eventId as string);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await attendanceService.exportCsv(req.orgId!, req.params.eventId as string);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=attendance.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
