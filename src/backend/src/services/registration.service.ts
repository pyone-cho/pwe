import { Prisma, Registration } from "@prisma/client";
import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { PaginationQuery, PaginatedResponse } from "../types";

export class RegistrationService {
  async listByEvent(orgId: string, eventId: string, query: PaginationQuery): Promise<PaginatedResponse<Registration>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RegistrationWhereInput = { orgId, eventId };

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

  async create(orgId: string, eventId: string, data: { memberId?: string; guestName?: string; guestEmail?: string; guestPhone?: string; formData?: Record<string, unknown> }) {
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

    // Enforce registration mode
    if (event.registrationMode === "member" && !data.memberId) {
      throw new AppError(403, "This event is restricted to members only");
    }

    // Check capacity and create registration atomically
    if (event.capacity) {
      return prisma.$transaction(async (tx) => {
        const registrationCount = await tx.registration.count({
          where: {
            eventId,
            status: { not: "cancelled" },
          },
        });

        const status = registrationCount >= event.capacity! ? "waitlisted" : "registered";

        // Check for duplicate registration
        if (data.memberId) {
          const existing = await tx.registration.findFirst({
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

        return tx.registration.create({
          data: {
            eventId,
            orgId,
            ...data,
            status,
          } as unknown as Prisma.RegistrationCreateInput,
        });
      });
    }

    // No capacity limit — check for duplicates and create
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
      } as unknown as Prisma.RegistrationCreateInput,
    });
  }

  async registerForMember(orgId: string, eventId: string, userId: string) {
    // Find the member record for this user
    const member = await prisma.member.findFirst({
      where: { userId, orgId },
    });

    if (!member) {
      throw new AppError(404, "Member profile not found");
    }

    // Use the existing create method with the memberId
    return this.create(orgId, eventId, { memberId: member.id });
  }

  async getMyRegistration(orgId: string, eventId: string, userId: string) {
    // Find the member record for this user
    const member = await prisma.member.findFirst({
      where: { userId, orgId },
    });

    if (!member) {
      return null;
    }

    // Find the registration for this member and event
    const registration = await prisma.registration.findFirst({
      where: {
        eventId,
        memberId: member.id,
        status: { not: "cancelled" },
      },
    });

    return registration;
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

  async cancelMyRegistration(orgId: string, eventId: string, userId: string) {
    // Find the member record for this user
    const member = await prisma.member.findFirst({
      where: { userId, orgId },
    });

    if (!member) {
      throw new AppError(404, "Member profile not found");
    }

    // Find the registration for this member and event
    const registration = await prisma.registration.findFirst({
      where: {
        eventId,
        memberId: member.id,
        status: { not: "cancelled" },
      },
    });

    if (!registration) {
      throw new AppError(404, "Registration not found");
    }

    // Use the existing cancel method
    return this.cancel(orgId, registration.id);
  }
}

export const registrationService = new RegistrationService();
