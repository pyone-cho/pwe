import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";
import { generateCsv, generatePaymentExportData } from "../utils/export";

export class PaymentService {
  async list(orgId: string, query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { orgId };

    // Filter by status
    if (query.search) {
      where.OR = [
        { member: { firstName: { contains: query.search, mode: "insensitive" } } },
        { member: { lastName: { contains: query.search, mode: "insensitive" } } },
        { referenceNumber: { contains: query.search } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          event: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(orgId: string, data: any, userId: string) {
    // Verify member exists
    const member = await prisma.member.findFirst({
      where: { id: data.memberId, orgId },
    });

    if (!member) {
      throw new AppError(404, "Member not found");
    }

    return prisma.payment.create({
      data: {
        orgId,
        recordedById: userId,
        ...data,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const payment = await prisma.payment.findFirst({
      where: { id, orgId },
    });

    if (!payment) {
      throw new AppError(404, "Payment not found");
    }

    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, orgId },
    });

    if (!payment) {
      throw new AppError(404, "Payment not found");
    }

    const updateData: any = { status };

    if (status === "paid" && !payment.paidAt) {
      updateData.paidAt = new Date();
    }

    return prisma.payment.update({
      where: { id },
      data: updateData,
    });
  }

  async getSummary(orgId: string, eventId?: string) {
    const where: any = { orgId };
    if (eventId) {
      where.eventId = eventId;
    }

    const [paid, pending, refunded, totalAmount] = await Promise.all([
      prisma.payment.count({ where: { ...where, status: "paid" } }),
      prisma.payment.count({ where: { ...where, status: "pending" } }),
      prisma.payment.count({ where: { ...where, status: "refunded" } }),
      prisma.payment.aggregate({
        where: { ...where, status: "paid" },
        _sum: { amount: true },
      }),
    ]);

    return {
      paid,
      pending,
      refunded,
      totalCollected: totalAmount._sum.amount || 0,
    };
  }

  async exportCsv(orgId: string, eventId?: string) {
    const where: any = { orgId };
    if (eventId) {
      where.eventId = eventId;
    }

    const payments = await prisma.payment.findMany({
      where,
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

export const paymentService = new PaymentService();
