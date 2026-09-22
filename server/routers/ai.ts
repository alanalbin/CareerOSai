import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { qwen3 } from "../services/ai/qwen3";
import { getStudentProfileByUserId, getDb, schema } from "../db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const aiRouter = router({
  analyzeEvidence: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2),
        description: z.string().min(10),
        type: z.string().default("PROJECT"),
        source: z.string().default("Manual entry"),
        evidenceId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const result = await qwen3.analyzeEvidence(input, profile.id, input.evidenceId);
      return result;
    }),

  analyzeProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2),
        description: z.string().min(10),
        technologies: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const result = await qwen3.analyzeProject(input, profile.id);
      return result;
    }),

  generateRecommendations: protectedProcedure
    .input(z.object({ targetRole: z.string().optional() }).optional())
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const [skills, projects] = await Promise.all([
        db.select().from(schema.studentSkills).where(eq(schema.studentSkills.studentId, profile.id)),
        db.select().from(schema.projects).where(eq(schema.projects.studentId, profile.id)),
      ]);

      const targetRole = input?.targetRole || profile.targetRoles?.[0] || "Product Engineer";
      const result = await qwen3.generateCareerRecommendations(
        profile,
        skills.map((s: any) => String(s.skillId)),
        projects,
        targetRole
      );

      if (result.success && result.data) {
        // Save to career_recommendations
        await db.insert(schema.careerRecommendations).values({
          studentId: profile.id,
          targetRole,
          matchScore: result.data.primaryRoleFitScore,
          missingSkills: result.data.skillGaps,
          recommendedActions: result.data.improvementActions,
          reasoning: result.data.readinessSummary,
        });
      }

      return result;
    }),
});
