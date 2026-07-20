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
    }
  }
}

export {};
