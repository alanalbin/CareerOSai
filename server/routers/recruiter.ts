import { z } from "zod";
import { router, protectedProcedure, recruiterProcedure } from "../_core/trpc";
import { getDb, schema, getRecruiterProfileByUserId } from "../db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { logAudit } from "../services/audit/auditService";
import { TRPCError } from "@trpc/server";

export const recruiterRouter = router({
  // Backwards-compatible candidate endpoint. It is intentionally protected by
  // the recruiter middleware; no candidate data is exposed by this alias.
  getCandidates: recruiterProcedure.query(() => []),
  // 1. Talent Overview
  getOverview: recruiterProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const recruiter = await getRecruiterProfileByUserId(ctx.user!.id);
    if (!recruiter) throw new TRPCError({ code: "NOT_FOUND", message: "Recruiter profile is not available." });

    const [jobs, consentedStudents, applications] = await Promise.all([
      db.select().from(schema.jobs).where(eq(schema.jobs.recruiterId, recruiter.id)),
      db.select({ id: schema.studentProfiles.id, readinessScore: schema.studentProfiles.readinessScore })
        .from(schema.studentProfiles)
        .where(inArray(schema.studentProfiles.recruiterVisibility, ["CONSENTED", "PUBLIC"])),
      db.select().from(schema.jobApplications).innerJoin(schema.jobs, eq(schema.jobApplications.jobId, schema.jobs.id)).where(eq(schema.jobs.recruiterId, recruiter.id)),
    ]);

    const activeJobs = jobs.filter((j: any) => j.status === "OPEN").length;
    const eligibleCount = consentedStudents.filter((s: any) => (s.readinessScore || 0) >= 60).length;

    return {
      companyName: recruiter.companyName,
      metrics: {
        openRoles: activeJobs,
        eligibleCandidates: eligibleCount,
        consentOnCount: consentedStudents.length,
        totalApplications: applications.length,
      },
      recentJobs: jobs.slice(0, 3),
    };
  }),

  // 2. Job Operations
  getJobs: recruiterProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const recruiter = await getRecruiterProfileByUserId(ctx.user!.id);
    if (!recruiter) return [];
    return db.select().from(schema.jobs).where(eq(schema.jobs.recruiterId, recruiter.id)).orderBy(desc(schema.jobs.createdAt));
  }),

  createJob: recruiterProcedure
    .input(
      z.object({
        title: z.string().min(2, "Job title is required"),
        description: z.string().min(10, "Job description must be at least 10 characters"),
        location: z.string().min(2, "Location is required"),
        employmentType: z.enum(["FULL_TIME", "INTERNSHIP", "CONTRACT"]).default("FULL_TIME"),
        experienceLevel: z.enum(["ENTRY_LEVEL", "MID_LEVEL", "SENIOR"]).default("ENTRY_LEVEL"),
        requiredSkills: z.array(z.string()).min(1, "At least one required skill must be defined"),
        preferredSkills: z.array(z.string()).default([]),
        salaryRange: z.string().optional(),
        minReadiness: z.number().min(0).max(100).default(60),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const recruiter = await getRecruiterProfileByUserId(ctx.user!.id);
      if (!recruiter) throw new TRPCError({ code: "NOT_FOUND", message: "Recruiter profile is not available." });

      const [newJob] = await db.insert(schema.jobs).values({
        recruiterId: recruiter.id,
        title: input.title,
        description: input.description,
        location: input.location,
        employmentType: input.employmentType,
        experienceLevel: input.experienceLevel,
        requiredSkills: input.requiredSkills,
        preferredSkills: input.preferredSkills,
        salaryRange: input.salaryRange || null,
        minReadiness: input.minReadiness,
        status: "OPEN",
      }).returning();

      logAudit(ctx.user!.id, "JOB_POSTED", "jobs", newJob.id, { title: input.title });
      return { success: true, job: newJob };
    }),

  // 3. Consent-Aware Candidate Search
  searchCandidates: recruiterProcedure
    .input(
      z.object({
        query: z.string().optional(),
        requiredSkills: z.array(z.string()).optional(),
        minReadiness: z.number().min(0).max(100).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const recruiter = await getRecruiterProfileByUserId(ctx.user!.id);

      // Fetch all candidate profiles
      const candidates = await db
        .select({
          id: schema.studentProfiles.id,
          userId: schema.studentProfiles.userId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          department: schema.studentProfiles.department,
          program: schema.studentProfiles.program,
          graduationYear: schema.studentProfiles.graduationYear,
          readinessScore: schema.studentProfiles.readinessScore,
          targetRoles: schema.studentProfiles.targetRoles,
          recruiterVisibility: schema.studentProfiles.recruiterVisibility,
        })
        .from(schema.studentProfiles)
        .innerJoin(schema.users, eq(schema.studentProfiles.userId, schema.users.id))
        .orderBy(desc(schema.studentProfiles.readinessScore));

      // Fetch skills for all students
      const studentSkills = await db
        .select({
          studentId: schema.studentSkills.studentId,
          skillName: schema.skills.name,
          verified: schema.studentSkills.verified,
        })
        .from(schema.studentSkills)
        .innerJoin(schema.skills, eq(schema.studentSkills.skillId, schema.skills.id));

      const skillsByStudent: Record<number, string[]> = {};
      for (const ss of studentSkills) {
        if (!skillsByStudent[ss.studentId]) skillsByStudent[ss.studentId] = [];
        skillsByStudent[ss.studentId].push(ss.skillName);
      }

      // Record recruiter search history for audit & privacy compliance
      if (recruiter && input) {
        db.insert(schema.recruiterSearches).values({
          recruiterId: recruiter.id,
          searchParams: input,
          resultCount: candidates.length,
        }).catch(() => {});
      }

      const q = (input?.query || "").toLowerCase();
      const reqSkills = (input?.requiredSkills || []).map((s: string) => s.toLowerCase());
      const minReadiness = input?.minReadiness ?? 0;

      return candidates
        .filter((c: any) => {
          // Consent enforcement check
          const hasConsent = c.recruiterVisibility === "CONSENTED" || c.recruiterVisibility === "PUBLIC";
          if (!hasConsent) return false;

          if (minReadiness > 0 && (c.readinessScore || 0) < minReadiness) return false;

          const studentSkillsList = skillsByStudent[c.id] || [];
          if (reqSkills.length > 0) {
            const hasRequired = reqSkills.some((rs: string) => studentSkillsList.some((s: string) => s.toLowerCase().includes(rs)));
            if (!hasRequired) return false;
          }

          if (q) {
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            const role = (c.targetRoles?.[0] || "").toLowerCase();
            const skillMatch = studentSkillsList.some((s: string) => s.toLowerCase().includes(q));
            if (!fullName.includes(q) && !role.includes(q) && !skillMatch) return false;
          }

          return true;
        })
        .map((c: any) => {
          const studentSkillsList = skillsByStudent[c.id] || [];
          // Role fit percentage based on skills
          return {
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            role: c.targetRoles?.[0] || null,
            readiness: c.readinessScore || 0,
            skills: studentSkillsList,
            institution: null,
            shared: true,
          };
        });
    }),

  // 4. Candidate Details
  getCandidateProfile: recruiterProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const [student] = await db
        .select({
          id: schema.studentProfiles.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          department: schema.studentProfiles.department,
          program: schema.studentProfiles.program,
          graduationYear: schema.studentProfiles.graduationYear,
          readinessScore: schema.studentProfiles.readinessScore,
          targetRoles: schema.studentProfiles.targetRoles,
          recruiterVisibility: schema.studentProfiles.recruiterVisibility,
          bio: schema.studentProfiles.bio,
        })
        .from(schema.studentProfiles)
        .innerJoin(schema.users, eq(schema.studentProfiles.userId, schema.users.id))
        .where(eq(schema.studentProfiles.id, input.studentId))
        .limit(1);

      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });

      // Privacy check: student must have granted consent
      if (student.recruiterVisibility !== "CONSENTED" && student.recruiterVisibility !== "PUBLIC") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Candidate has chosen to keep their profile private from recruiters.",
        });
      }

      // Fetch only consented records: projects, certifications, verified skills, verified evidence
      const [skills, projects, certifications, evidenceList] = await Promise.all([
        db.select({ skillName: schema.skills.name, proficiency: schema.studentSkills.proficiency })
          .from(schema.studentSkills)
          .innerJoin(schema.skills, eq(schema.studentSkills.skillId, schema.skills.id))
          .where(and(eq(schema.studentSkills.studentId, student.id), eq(schema.studentSkills.verified, true))),
        db.select().from(schema.projects).where(eq(schema.projects.studentId, student.id)),
        db.select().from(schema.certifications).where(eq(schema.certifications.studentId, student.id)),
        db.select({
          id: schema.evidence.id,
          title: schema.evidence.title,
          type: schema.evidence.type,
          source: schema.evidence.source,
          skills: schema.evidence.skills,
          verificationStatus: schema.evidence.verificationStatus,
        }).from(schema.evidence).where(and(eq(schema.evidence.studentId, student.id), eq(schema.evidence.verificationStatus, "VERIFIED"))),
      ]);

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        department: student.department,
        graduationYear: student.graduationYear,
        readinessScore: student.readinessScore,
        targetRole: student.targetRoles?.[0] || null,
        bio: student.bio,
        verifiedSkills: skills,
        projects,
        certifications,
        verifiedEvidence: evidenceList,
      };
    }),
});
