import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "./services/auth/authService";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Auth Service - Password Hashing", () => {
  it("hashes password and verifies match correctly", async () => {
    const rawPassword = "StrongPassword123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);

    const match = await verifyPassword(rawPassword, hash);
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword("WrongPassword123!", hash);
    expect(wrongMatch).toBe(false);
  });
});

describe("Auth Service - Session Tokens", () => {
  it("mints and verifies JWT session payload", async () => {
    const payload = {
      userId: 42,
      email: "engineer@domain.com",
      role: "STUDENT" as const,
      firstName: "Alex",
      lastName: "Rivera",
    };

    const token = await createSessionToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(42);
    expect(verified?.email).toBe("engineer@domain.com");
    expect(verified?.role).toBe("STUDENT");
  });

  it("returns null for tampered or invalid token", async () => {
    const verified = await verifySessionToken("invalid.token.string");
    expect(verified).toBeNull();
  });
});

describe("TRPC Auth Procedures", () => {
  const dummyContext: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };

  it("returns null for unauthenticated session query", async () => {
    const caller = appRouter.createCaller(dummyContext);
    const session = await caller.auth.me();
    expect(session).toBeNull();
  });

  it("reports platform status", async () => {
    const caller = appRouter.createCaller(dummyContext);
    const status = await caller.status();
    expect(status.status).toBe("healthy");
    expect(status.timestamp).toBeDefined();
  });
});
