import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";
import { Prisma, Event } from "@prisma/client";

export interface EventCreateInput {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  capacity?: number;
  registrationMode?: string;
  requiresPayment?: boolean;
  paymentAmount?: number;
  customFields?: unknown[];
}

export interface EventUpdateInput {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  registrationMode?: string;
  status?: string;
  requiresPayment?: boolean;
  paymentAmount?: number;
  customFields?: unknown[];
}

export class EventService {
  async list(orgId: string, query: PaginationQuery): Promise<PaginatedResponse<Event>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = { orgId };

    // Search filter
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { location: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Date filters for upcoming/past
    if (query.status === "published") {
      // Upcoming: published events with startDate >= now
      where.startDate = { gte: new Date() };
    } else if (query.status === "completed") {
      // Past: completed events OR published events with startDate < now
      where.OR = [
        { status: "completed" },
        { status: "published", startDate: { lt: new Date() } },
      ];
      delete where.status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: { not: "cancelled" } },
              },
            },
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

  async create(orgId: string, data: EventCreateInput, userId: string) {
    // Convert date strings to Date objects for Prisma
    const processedData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate && data.endDate !== "" ? new Date(data.endDate) : undefined,
    };

    return prisma.event.create({
      data: {
        orgId,
        createdById: userId,
        ...processedData,
      } as unknown as Prisma.EventCreateInput,
    });
  }

  async update(orgId: string, id: string, data: EventUpdateInput) {
    const event = await prisma.event.findFirst({
      where: { id, orgId },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    // Convert date strings to Date objects for Prisma
    const processedData = {
      ...data,
      startDate: data.startDate && data.startDate !== "" ? new Date(data.startDate) : undefined,
      endDate: data.endDate && data.endDate !== "" ? new Date(data.endDate) : undefined,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(processedData).filter(([_, v]) => v !== undefined)
    );

    return prisma.event.update({
      where: { id },
      data: cleanData as unknown as Prisma.EventUpdateInput,
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
          select: {
            registrations: {
              where: { status: { not: "cancelled" } },
            },
          },
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
          select: {
            registrations: {
              where: { status: { not: "cancelled" } },
            },
          },
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
