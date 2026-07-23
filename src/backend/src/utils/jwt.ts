import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JwtPayload, TokenPair } from "../types";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables");
}
const secret = JWT_SECRET as string;
const refreshSecret = REFRESH_TOKEN_SECRET as string;

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, secret) as unknown as JwtPayload;
}

export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 7 days
  return expiry;
}

export function generateTokenPair(payload: JwtPayload): TokenPair & { refreshTokenHash: string; expiresAt: Date } {
  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();

  return { accessToken, refreshToken, refreshTokenHash, expiresAt };
}
