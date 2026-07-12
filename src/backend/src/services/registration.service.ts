import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";

export class RegistrationService {
  async listByEvent(orgId: string, eventId: string, query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { orgId, eventId };

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredAt: "desc" },
        include: {
          member: true,
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return {
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(orgId: string, eventId: string, data: any) {
    // Check if event exists and is open for registration
    const event = await prisma.event.findFirst({
      where: { id: eventId, orgId },
    });

    if (!event) {
      throw new AppError(404, "Event not found");
    }

    if (event.status !== "published") {
      throw new AppError(400, "Event is not open for registration");
    }

    // Check capacity
    if (event.capacity) {
      const registrationCount = await prisma.registration.count({
        where: {
          eventId,
          status: { not: "cancelled" },
        },
      });

      if (registrationCount >= event.capacity) {
        // Add to waitlist
        return prisma.registration.create({
          data: {
            eventId,
            orgId,
            ...data,
            status: "waitlisted",
          },
        });
      }
    }

    // Check for duplicate registration
    if (data.memberId) {
      const existing = await prisma.registration.findFirst({
        where: {
          eventId,
          memberId: data.memberId,
          status: { not: "cancelled" },
        },
      });

      if (existing) {
        throw new AppError(409, "Already registered for this event");
      }
    }

    return prisma.registration.create({
      data: {
        eventId,
        orgId,
        ...data,
      },
    });
  }

  async cancel(orgId: string, id: string) {
    const registration = await prisma.registration.findFirst({
      where: { id, orgId },
    });

    if (!registration) {
      throw new AppError(404, "Registration not found");
    }

    if (registration.status === "cancelled") {
      throw new AppError(400, "Registration is already cancelled");
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    // If there's a waitlist, promote the first person
    if (registration.status === "registered") {
      const nextWaitlisted = await prisma.registration.findFirst({
        where: {
          eventId: registration.eventId,
          status: "waitlisted",
        },
        orderBy: { registeredAt: "asc" },
      });

      if (nextWaitlisted) {
        await prisma.registration.update({
          where: { id: nextWaitlisted.id },
          data: { status: "registered" },
        });
      }
    }

    return updated;
  }
}

export const registrationService = new RegistrationService();
