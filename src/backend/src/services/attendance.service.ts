import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";
import { generateCsv, generateAttendanceExportData } from "../utils/export";

export class AttendanceService {
  async listByEvent(orgId: string, eventId: string, query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { orgId, eventId };

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkedInAt: "desc" },
        include: {
          registration: {
            include: {
              member: true,
            },
          },
          checkedInBy: {
            include: { profile: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkIn(orgId: string, eventId: string, registrationId: string, userId: string, notes?: string) {
    // Check if registration exists
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId,
        orgId,
        status: "registered",
      },
    });

    if (!registration) {
      throw new AppError(404, "Registration not found or not active");
    }

    // Check if already checked in
    const existing = await prisma.attendance.findFirst({
      where: {
        eventId,
        registrationId,
      },
    });

    if (existing) {
      throw new AppError(409, "Already checked in");
    }

    return prisma.attendance.create({
      data: {
        eventId,
        registrationId,
        memberId: registration.memberId,
        orgId,
        checkedInById: userId,
        notes,
      },
    });
  }

  async bulkCheckIn(orgId: string, eventId: string, registrationIds: string[], userId: string) {
    const results = [];
    const errors: { registrationId: string; error: string }[] = [];

    for (const registrationId of registrationIds) {
      try {
        const result = await this.checkIn(orgId, eventId, registrationId, userId);
        results.push(result);
      } catch (error: any) {
        errors.push({ registrationId, error: error.message });
      }
    }

    return { checkedIn: results.length, errors };
  }

  async undoCheckIn(orgId: string, id: string) {
    const attendance = await prisma.attendance.findFirst({
      where: { id, orgId },
    });

    if (!attendance) {
      throw new AppError(404, "Attendance record not found");
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return { message: "Check-in undone" };
  }

  async getSummary(orgId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, orgId },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    const [totalRegistered, totalCheckedIn] = await Promise.all([
      prisma.registration.count({
        where: {
          eventId,
          status: "registered",
        },
      }),
      prisma.attendance.count({
        where: { eventId },
      }),
    ]);

    return {
      eventId,
      eventTitle: event.title,
      totalRegistered,
      totalCheckedIn,
      absent: totalRegistered - totalCheckedIn,
      attendanceRate: totalRegistered > 0
        ? Math.round((totalCheckedIn / totalRegistered) * 100)
        : 0,
    };
  }

  async exportCsv(orgId: string, eventId: string) {
    const attendance = await prisma.attendance.findMany({
      where: { eventId, orgId },
      include: {
        registration: {
          include: {
            member: true,
          },
        },
        checkedInBy: {
          include: { profile: true },
        },
      },
      orderBy: { checkedInAt: "desc" },
    });

    const exportData = generateAttendanceExportData(attendance);
    return generateCsv(exportData);
  }
}

export const attendanceService = new AttendanceService();
