import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import crypto from "node:crypto";

// A deployment must provide a stable secret. The ephemeral development fallback
// deliberately prevents a checked-in default credential from securing sessions.
const JWT_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || crypto.randomBytes(48).toString("base64url");
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: number;
  email: string;
  role: "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER" | "SUPER_ADMIN";
  firstName: string;
  lastName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as TokenPayload["role"],
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
    };
  } catch (err) {
    return null;
  }
}
