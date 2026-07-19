import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";

export class OrgService {
  async getOrg(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError(404, "Organization not found");
    }

    return org;
  }

  async updateOrg(orgId: string, data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    settings?: Record<string, unknown>;
  }) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError(404, "Organization not found");
    }

    return prisma.organization.update({
      where: { id: orgId },
      data,
    });
  }

  async getOrgStats(orgId: string) {
    const [members, events, activeEvents] = await Promise.all([
      prisma.member.count({ where: { orgId } }),
      prisma.event.count({ where: { orgId } }),
      prisma.event.count({ where: { orgId, status: "published" } }),
    ]);

    return {
      totalMembers: members,
      totalEvents: events,
      activeEvents: activeEvents,
    };
  }
}

export const orgService = new OrgService();
