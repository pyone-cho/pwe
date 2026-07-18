import bcrypt from "bcryptjs";
import prisma from "../prisma/client";
import { generateTokenPair, verifyAccessToken } from "../utils/jwt";
import { JwtPayload, TokenPair } from "../types";
import { AppError } from "../middleware/errorHandler";

interface SignupInput {
  orgName: string;
  slug: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  orgSlug: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email: string;
  password: string;
}

export class AuthService {
  async signup(input: SignupInput) {
    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: input.slug },
    });

    if (existingOrg) {
      throw new AppError(409, "Organization slug already exists");
    }

    // Check if email already exists in any org
    const existingUser = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError(409, "Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create org + admin user + profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name: input.orgName,
          slug: input.slug,
        },
      });

      // Create admin user with profile
      const user = await tx.user.create({
        data: {
          orgId: org.id,
          email: input.email,
          passwordHash,
          role: "admin",
          profile: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      return { org, user };
    });

    // Generate tokens
    const tokenPayload: JwtPayload = {
      userId: result.user.id,
      orgId: result.org.id,
      role: result.user.role,
      email: result.user.email,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.expiresAt,
      },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        profile: result.user.profile,
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async register(input: RegisterInput) {
    // Find organization by slug
    const org = await prisma.organization.findUnique({
      where: { slug: input.orgSlug },
    });

    if (!org) {
      throw new AppError(404, "Organization not found");
    }

    // Check if email already exists in this org
    const existingUser = await prisma.user.findFirst({
      where: { orgId: org.id, email: input.email },
    });

    if (existingUser) {
      throw new AppError(409, "Email already registered in this organization");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user + profile + member in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          orgId: org.id,
          email: input.email,
          passwordHash,
          role: "member",
          phone: input.phone,
          profile: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
        include: { profile: true },
      });

      const member = await tx.member.create({
        data: {
          orgId: org.id,
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          email: input.email,
        },
      });

      return { user, member };
    });

    // Generate tokens
    const tokenPayload: JwtPayload = {
      userId: result.user.id,
      orgId: org.id,
      role: result.user.role,
      email: result.user.email,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.expiresAt,
      },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        profile: result.user.profile,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(input: LoginInput) {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: input.email },
      include: {
        profile: true,
        organization: true,
      },
    });

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.isActive) {
      throw new AppError(403, "Account is disabled");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, "Invalid email or password");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokenPayload: JwtPayload = {
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(token: string) {
    // Hash the provided token
    const crypto = require("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the refresh token
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!refreshToken) {
      throw new AppError(401, "Invalid refresh token");
    }

    if (refreshToken.revokedAt) {
      throw new AppError(401, "Refresh token has been revoked");
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new AppError(401, "Refresh token has expired");
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokenPayload: JwtPayload = {
      userId: refreshToken.user.id,
      orgId: refreshToken.user.orgId,
      role: refreshToken.user.role,
      email: refreshToken.user.email,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: refreshToken.user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.expiresAt,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: "Logged out successfully" };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        organization: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile: user.profile,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError(400, "Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all existing refresh tokens (force re-login)
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: "Password changed successfully" };
  }
}

export const authService = new AuthService();
