import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";

export class AnnouncementService {
  async list(orgId: string, query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { orgId };

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          event: true,
          createdBy: {
            include: { profile: true },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      data: announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(orgId: string, id: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, orgId },
      include: {
        event: true,
        createdBy: {
          include: { profile: true },
        },
      },
    });

    if (!announcement) {
      throw new AppError(404, "Announcement not found");
    }

    return announcement;
  }

  async create(orgId: string, data: any, userId: string) {
    return prisma.announcement.create({
      data: {
        orgId,
        createdById: userId,
        ...data,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, orgId },
    });

    if (!announcement) {
      throw new AppError(404, "Announcement not found");
    }

    return prisma.announcement.update({
      where: { id },
      data,
    });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, orgId },
    });

    if (!announcement) {
      throw new AppError(404, "Announcement not found");
    }

    const updateData: any = { status };

    if (status === "published" && !announcement.publishedAt) {
      updateData.publishedAt = new Date();
    }

    return prisma.announcement.update({
      where: { id },
      data: updateData,
    });
  }
}

export const announcementService = new AnnouncementService();
