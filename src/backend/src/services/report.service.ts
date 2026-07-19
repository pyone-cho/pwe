import prisma from "../prisma/client";
import { generateCsv, generateMemberExportData, generateEventExportData, generatePaymentExportData } from "../utils/export";

export class ReportService {
  async getMemberReport(orgId: string) {
    const [total, active, inactive, suspended, byType, monthly] = await Promise.all([
      prisma.member.count({ where: { orgId } }),
      prisma.member.count({ where: { orgId, membershipStatus: "active" } }),
      prisma.member.count({ where: { orgId, membershipStatus: "inactive" } }),
      prisma.member.count({ where: { orgId, membershipStatus: "suspended" } }),
      prisma.member.groupBy({
        by: ["membershipType"],
        where: { orgId },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', join_date) as month, COUNT(*) as count
        FROM members
        WHERE org_id = ${orgId}::uuid
        GROUP BY DATE_TRUNC('month', join_date)
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
      byType: byType.map((t) => ({
        type: t.membershipType || "unknown",
        count: t._count,
      })),
      monthly: monthly.map((row: { month: Date | string; count: bigint | number }) => ({
        month: row.month?.toISOString?.() ?? row.month,
        count: Number(row.count),
      })),
    };
  }

  async getEventReport(orgId: string, startDate?: string, endDate?: string) {
    const where: { orgId: string; startDate?: { gte?: Date; lte?: Date } } = { orgId };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [total, byStatus, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.groupBy({
        by: ["status"],
        where: { orgId },
        _count: true,
      }),
      prisma.event.findMany({
        where,
        include: {
          _count: {
            select: {
              registrations: true,
              attendance: true,
            },
          },
          payments: {
            where: { status: "paid" },
            select: { amount: true },
          },
        },
        orderBy: { startDate: "desc" },
        take: 50,
      }),
    ]);

    const eventsWithStats = events.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      status: e.status,
      registrations: e._count.registrations,
      attendance: e._count.attendance,
      attendanceRate: e._count.registrations > 0
        ? Math.round((e._count.attendance / e._count.registrations) * 100)
        : 0,
      revenue: e.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    }));

    const totalRevenue = eventsWithStats.reduce((sum, e) => sum + e.revenue, 0);
    const avgAttendance = eventsWithStats.length > 0
      ? Math.round(eventsWithStats.reduce((sum, e) => sum + e.attendanceRate, 0) / eventsWithStats.length)
      : 0;

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      totalRevenue,
      avgAttendance,
      events: eventsWithStats,
    };
  }

  async getPaymentReport(orgId: string, startDate?: string, endDate?: string) {
    const where: { orgId: string; createdAt?: { gte?: Date; lte?: Date } } = { orgId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [paid, pending, refunded, totalAmount, byMethod] = await Promise.all([
      prisma.payment.count({ where: { ...where, status: "paid" } }),
      prisma.payment.count({ where: { ...where, status: "pending" } }),
      prisma.payment.count({ where: { ...where, status: "refunded" } }),
      prisma.payment.aggregate({
        where: { ...where, status: "paid" },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ["paymentMethod"],
        where: { ...where, status: "paid" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      paid,
      pending,
      refunded,
      totalCollected: totalAmount._sum.amount || 0,
      byMethod: byMethod.map((m) => ({
        method: m.paymentMethod || "unknown",
        count: m._count,
        total: m._sum.amount || 0,
      })),
    };
  }

  async exportMemberReport(orgId: string) {
    const members = await prisma.member.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    const exportData = generateMemberExportData(members);
    return generateCsv(exportData);
  }

  async exportEventReport(orgId: string) {
    const events = await prisma.event.findMany({
      where: { orgId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const exportData = generateEventExportData(events);
    return generateCsv(exportData);
  }

  async exportPaymentReport(orgId: string) {
    const payments = await prisma.payment.findMany({
      where: { orgId },
      include: {
        member: true,
        event: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const exportData = generatePaymentExportData(payments);
    return generateCsv(exportData);
  }
}

export const reportService = new ReportService();
