import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        res.status(400).json({ success: false, error: "Validation failed", details: errors });
        return;
      }
      next(error);
    }
  };
}

// Validation schemas
import { z } from "zod";

export const authSchemas = {
  signup: z.object({
    body: z.object({
      orgName: z.string().min(2).max(255),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1).max(100),
      lastName: z.string().max(100).optional(),
    }),
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().min(1),
    }),
  }),
};

export const memberSchemas = {
  create: z.object({
    body: z.object({
      firstName: z.string().min(1).max(100),
      lastName: z.string().max(100).optional(),
      phone: z.string().min(1).max(20),
      email: z.string().email().optional(),
      membershipType: z.enum(["regular", "premium", "honorary"]).optional(),
      emergencyContact: z.string().max(255).optional(),
      notes: z.string().optional(),
    }),
  }),
  update: z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().max(100).optional(),
      phone: z.string().min(1).max(20).optional(),
      email: z.string().email().optional(),
      membershipType: z.enum(["regular", "premium", "honorary"]).optional(),
      membershipStatus: z.enum(["active", "inactive", "suspended"]).optional(),
      emergencyContact: z.string().max(255).optional(),
      notes: z.string().optional(),
    }),
  }),
};

export const eventSchemas = {
  create: z.object({
    body: z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      location: z.string().max(255).optional(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime().optional(),
      capacity: z.number().int().positive().optional(),
      registrationMode: z.enum(["public", "member", "both"]).optional(),
      requiresPayment: z.boolean().optional(),
      paymentAmount: z.number().positive().optional(),
      customFields: z.array(z.object({
        name: z.string(),
        type: z.enum(["text", "select", "checkbox"]),
        options: z.array(z.string()).optional(),
        required: z.boolean().optional(),
      })).optional(),
    }),
  }),
  update: z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      location: z.string().max(255).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      capacity: z.number().int().positive().optional(),
      registrationMode: z.enum(["public", "member", "both"]).optional(),
      status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
      requiresPayment: z.boolean().optional(),
      paymentAmount: z.number().positive().optional(),
      customFields: z.array(z.any()).optional(),
    }),
  }),
};

export const registrationSchemas = {
  create: z.object({
    params: z.object({ eventId: z.string().uuid() }),
    body: z.object({
      memberId: z.string().uuid().optional(),
      guestName: z.string().max(200).optional(),
      guestEmail: z.string().email().optional(),
      guestPhone: z.string().max(20).optional(),
      formData: z.record(z.any()).optional(),
    }),
  }),
};

export const paymentSchemas = {
  create: z.object({
    body: z.object({
      memberId: z.string().uuid(),
      eventId: z.string().uuid().optional(),
      registrationId: z.string().uuid().optional(),
      amount: z.number().positive(),
      currency: z.string().max(3).optional(),
      paymentMethod: z.enum(["cash", "bank_transfer", "mobile_money", "other"]).optional(),
      referenceNumber: z.string().max(100).optional(),
      notes: z.string().optional(),
      paidAt: z.string().datetime().optional(),
    }),
  }),
};

export const announcementSchemas = {
  create: z.object({
    body: z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      eventId: z.string().uuid().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    }),
  }),
};
