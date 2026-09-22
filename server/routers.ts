import { router, publicProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./routers/auth";
import { studentRouter } from "./routers/student";
import { collegeRouter } from "./routers/college";
import { recruiterRouter } from "./routers/recruiter";
import { documentsRouter } from "./routers/documents";
import { notificationsRouter } from "./routers/notifications";
import { aiRouter } from "./routers/ai";
import { verificationRouter } from "./routers/verification";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  student: studentRouter,
  college: collegeRouter,
  recruiter: recruiterRouter,
  documents: documentsRouter,
  notifications: notificationsRouter,
  ai: aiRouter,
  verification: verificationRouter,

  // Health and environment status
  status: publicProcedure.query(() => ({
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
