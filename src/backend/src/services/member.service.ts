import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";
import { generateCsv, generateMemberExportData } from "../utils/export";

export class MemberService {
  async list(orgId: string, query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { orgId };

    // Search filter
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.member.count({ where }),
    ]);

    return {
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMe(orgId: string, userId: string) {
    const member = await prisma.member.findFirst({
      where: { orgId, userId },
      include: {
        registrations: {
          include: {
            event: true,
          },
          orderBy: { registeredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!member) {
      throw new AppError(404, "Member profile not found");
    }

    return member;
  }

  async getById(orgId: string, id: string) {
    const member = await prisma.member.findFirst({
      where: { id, orgId },
      include: {
        registrations: {
          include: {
            event: true,
          },
          orderBy: { registeredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!member) {
      throw new AppError(404, "Member not found");
    }

    return member;
  }

  async create(orgId: string, data: any) {
    // Check for duplicate phone
    const existing = await prisma.member.findFirst({
      where: { orgId, phone: data.phone },
    });

    if (existing) {
      // Warning, not blocking
      console.log(`Warning: Duplicate phone number ${data.phone}`);
    }

    return prisma.member.create({
      data: {
        orgId,
        ...data,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const member = await prisma.member.findFirst({
      where: { id, orgId },
    });

    if (!member) {
      throw new AppError(404, "Member not found");
    }

    return prisma.member.update({
      where: { id },
      data,
    });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const member = await prisma.member.findFirst({
      where: { id, orgId },
    });

    if (!member) {
      throw new AppError(404, "Member not found");
    }

    return prisma.member.update({
      where: { id },
      data: { membershipStatus: status },
    });
  }

  async importCsv(orgId: string, records: any[]) {
    let successCount = 0;
    let skipCount = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Validate required fields
        if (!record.first_name || !record.phone) {
          errors.push({ row: i + 1, error: "Missing required fields: first_name, phone" });
          continue;
        }

        await prisma.member.create({
          data: {
            orgId,
            firstName: record.first_name,
            lastName: record.last_name,
            phone: record.phone,
            email: record.email,
            membershipType: record.membership_type || "regular",
          },
        });
        successCount++;
      } catch (error) {
        skipCount++;
        errors.push({ row: i + 1, error: "Failed to create member" });
      }
    }

    return { successCount, skipCount, errors };
  }

  async exportCsv(orgId: string, query: PaginationQuery) {
    const members = await prisma.member.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    const exportData = generateMemberExportData(members);
    const csv = generateCsv(exportData);

    return csv;
  }
}

export const memberService = new MemberService();
