import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";

export class EventService {
  async list(orgId: string, query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { orgId };

    // Search filter
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { location: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(orgId: string, id: string) {
    const event = await prisma.event.findFirst({
      where: { id, orgId },
      include: {
        _count: {
          select: {
            registrations: true,
            attendance: true,
          },
        },
        createdBy: {
          include: { profile: true },
        },
      },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    return event;
  }

  async create(orgId: string, data: any, userId: string) {
    return prisma.event.create({
      data: {
        orgId,
        createdById: userId,
        ...data,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const event = await prisma.event.findFirst({
      where: { id, orgId },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    return prisma.event.update({
      where: { id },
      data,
    });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const event = await prisma.event.findFirst({
      where: { id, orgId },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["published"],
      published: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[event.status]?.includes(status)) {
      throw new AppError(400, `Cannot transition from ${event.status} to ${status}`);
    }

    return prisma.event.update({
      where: { id },
      data: { status },
    });
  }

  async getPublicEvents(orgId: string) {
    return prisma.event.findMany({
      where: {
        orgId,
        status: "published",
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async getPublicEventById(orgId: string, id: string) {
    const event = await prisma.event.findFirst({
      where: {
        id,
        orgId,
        status: "published",
      },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    return event;
  }
}

export const eventService = new EventService();
