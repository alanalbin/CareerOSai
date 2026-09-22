import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const baseContext: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("Production App Router", () => {
  it("provides operational healthcheck", async () => {
    const caller = appRouter.createCaller(baseContext);
    const status = await caller.status();
    expect(status.status).toBe("healthy");
    expect(status.timestamp).toBeDefined();
  });

  it("denies access to protected student procedures when unauthenticated", async () => {
    const caller = appRouter.createCaller(baseContext);
    await expect(caller.student.getDashboardData()).rejects.toThrow();
  });

  it("denies access to protected college procedures when unauthenticated", async () => {
    const caller = appRouter.createCaller(baseContext);
    await expect(caller.college.getOverview()).rejects.toThrow();
  });

  it("denies access to protected recruiter procedures when unauthenticated", async () => {
    const caller = appRouter.createCaller(baseContext);
    await expect(caller.recruiter.getOverview()).rejects.toThrow();
  });
});
