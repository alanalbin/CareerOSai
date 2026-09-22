import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { findUserById } from "../db";
import { verifySessionToken } from "../services/auth/authService";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    let token: string | undefined;

    // 1. Check cookies
    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const parsed = parseCookieHeader(cookieHeader);
      token = parsed[COOKIE_NAME] || parsed["career_os_session"] || parsed["vantage_session"];
    }

    // 2. Check Authorization header
    if (!token && opts.req.headers.authorization) {
      const parts = opts.req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        token = parts[1];
      }
    }

    if (token) {
      const payload = await verifySessionToken(token);
      if (payload && payload.userId) {
        const dbUser = await findUserById(payload.userId);
        if (dbUser && dbUser.isActive) {
          user = dbUser;
        }
      }
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
