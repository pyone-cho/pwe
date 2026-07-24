import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        orgId: string;
        role: string;
        email: string;
      };
      orgId?: string;
      params: Record<string, string>;
    }
  }
}

export {};
