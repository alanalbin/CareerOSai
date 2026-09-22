import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { User } from "../../drizzle/schema";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user as User,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const studentProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || (ctx.user.role !== "STUDENT" && ctx.user.role !== "SUPER_ADMIN")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access restricted to registered students",
      });
    }
    return next({ ctx });
  })
);

export const collegeProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || (ctx.user.role !== "COLLEGE_ADMIN" && ctx.user.role !== "SUPER_ADMIN")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Institutional administrator access required",
      });
    }
    return next({ ctx });
  })
);

export const recruiterProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || (ctx.user.role !== "RECRUITER" && ctx.user.role !== "SUPER_ADMIN")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Recruiter access required",
      });
    }
    return next({ ctx });
  })
);

export const superAdminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "SUPER_ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: NOT_ADMIN_ERR_MSG,
      });
    }
    return next({ ctx });
  })
);

export const adminProcedure = superAdminProcedure;
