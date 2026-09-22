import { z } from "zod";
import { router, protectedProcedure, collegeProcedure } from "../_core/trpc";
import { getDb, schema, getCollegeProfileByUserId } from "../db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { calculateStudentReadiness } from "../services/scoring/readiness";
import { logAudit } from "../services/audit/auditService";
import { TRPCError } from "@trpc/server";

export const collegeRouter = router({
  // 1. College Intelligence Overview
  getOverview: collegeProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    let college = await getCollegeProfileByUserId(ctx.user!.id);

    if (!college) {
      const [newCol] = await db.insert(schema.collegeProfiles).values({
        userId: ctx.user!.id,
        collegeName: "Riverview Institute of Technology",
        placementOfficer: `${ctx.user!.firstName} ${ctx.user!.lastName}`,
        contactEmail: ctx.user!.email,
      }).returning();
      college = newCol;
    }

    // Real aggregate metrics from database
    const allStudents = await db.select({
      id: schema.studentProfiles.id,
      department: schema.studentProfiles.department,
      readinessScore: schema.studentProfiles.readinessScore,
    }).from(schema.studentProfiles);

    const totalStudents = allStudents.length;
    const placementReady = allStudents.filter((s: any) => s.readinessScore >= 70).length;
    const placementReadyPercent = totalStudents > 0 ? Math.round((placementReady / totalStudents) * 100) : 0;

    const allEvidence = await db.select({
      id: schema.evidence.id,
      verificationStatus: schema.evidence.verificationStatus,
    }).from(schema.evidence);

    const totalEvidence = allEvidence.length;
    const verifiedEvidence = allEvidence.filter((e: any) => e.verificationStatus === "VERIFIED").length;
    const evidenceVerifiedPercent = totalEvidence > 0 ? Math.round((verifiedEvidence / totalEvidence) * 100) : 0;
    const pendingEvidenceCount = allEvidence.filter((e: any) => e.verificationStatus === "PENDING").length;

    // Department breakdown
    const deptMap: Record<string, { count: number; totalReadiness: number }> = {};
    for (const s of allStudents) {
      const dept = s.department || "General Engineering";
      if (!deptMap[dept]) deptMap[dept] = { count: 0, totalReadiness: 0 };
      deptMap[dept].count += 1;
      deptMap[dept].totalReadiness += (s.readinessScore || 0);
    }

    const departmentStats = Object.entries(deptMap).map(([department, data]) => ({
      department,
      studentCount: data.count,
      avgReadiness: Math.round(data.totalReadiness / data.count),
    }));

    return {
      collegeName: college.collegeName,
      metrics: {
        totalStudents,
        placementReadyPercent,
        evidenceVerifiedPercent,
        pendingEvidenceCount,
        openSkillGaps: Math.max(0, totalStudents * 2 - verifiedEvidence),
      },
      departmentStats,
    };
  }),

  // 2. Student Directory
  getStudents: collegeProcedure
    .input(
      z.object({
        search: z.string().optional(),
        department: z.string().optional(),
        minReadiness: z.number().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const students = await db
        .select({
          id: schema.studentProfiles.id,
          userId: schema.studentProfiles.userId,
          studentId: schema.studentProfiles.studentId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          department: schema.studentProfiles.department,
          program: schema.studentProfiles.program,
          graduationYear: schema.studentProfiles.graduationYear,
          cgpa: schema.studentProfiles.cgpa,
          readinessScore: schema.studentProfiles.readinessScore,
          targetRole: schema.studentProfiles.targetRoles,
          recruiterVisibility: schema.studentProfiles.recruiterVisibility,
        })
        .from(schema.studentProfiles)
        .innerJoin(schema.users, eq(schema.studentProfiles.userId, schema.users.id))
        .orderBy(desc(schema.studentProfiles.readinessScore));

      const filtered = students.filter((s: any) => {
        if (input?.search) {
          const q = input.search.toLowerCase();
          const name = `${s.firstName} ${s.lastName}`.toLowerCase();
          if (!name.includes(q) && !s.email.toLowerCase().includes(q)) return false;
        }
        if (input?.department && input.department !== "all") {
          if (s.department !== input.department) return false;
        }
        if (input?.minReadiness && (s.readinessScore || 0) < input.minReadiness) {
          return false;
        }
        return true;
      });

      return filtered.map((s: any) => ({
        ...s,
        name: `${s.firstName} ${s.lastName}`.trim(),
        targetRole: Array.isArray(s.targetRole) ? s.targetRole[0] || "Product Engineer" : "Product Engineer",
      }));
    }),

  // 3. Evidence Review Queue
  getPendingEvidence: collegeProcedure.query(async () => {
    const db = await getDb();
    const rows = await db
      .select({
        id: schema.evidence.id,
        studentId: schema.evidence.studentId,
        studentName: sql<string>`concat(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
        studentEmail: schema.users.email,
        department: schema.studentProfiles.department,
        title: schema.evidence.title,
        type: schema.evidence.type,
        source: schema.evidence.source,
        sourceUrl: schema.evidence.sourceUrl,
        documentUrl: schema.evidence.documentUrl,
        skills: schema.evidence.skills,
        verificationStatus: schema.evidence.verificationStatus,
        createdAt: schema.evidence.createdAt,
      })
      .from(schema.evidence)
      .innerJoin(schema.studentProfiles, eq(schema.evidence.studentId, schema.studentProfiles.id))
      .innerJoin(schema.users, eq(schema.studentProfiles.userId, schema.users.id))
      .where(eq(schema.evidence.verificationStatus, "PENDING"))
      .orderBy(desc(schema.evidence.createdAt));

    return rows;
  }),

  // 4. Review Evidence (Approve / Reject)
  reviewEvidence: collegeProcedure
    .input(
      z.object({
        evidenceId: z.number(),
        decision: z.enum(["VERIFIED", "REJECTED"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const [ev] = await db.select().from(schema.evidence).where(eq(schema.evidence.id, input.evidenceId)).limit(1);
      if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence record not found" });

      await db.update(schema.evidence).set({
        verificationStatus: input.decision,
        updatedAt: new Date(),
      }).where(eq(schema.evidence.id, input.evidenceId));

      // If verified, verify associated student skills
      if (input.decision === "VERIFIED" && Array.isArray(ev.skills)) {
        for (const skillName of ev.skills) {
          const [skillRecord] = await db.select().from(schema.skills).where(eq(schema.skills.name, skillName)).limit(1);
          if (skillRecord) {
            await db.update(schema.studentSkills).set({
              verified: true,
            }).where(and(eq(schema.studentSkills.studentId, ev.studentId), eq(schema.studentSkills.skillId, skillRecord.id)));
          }
        }
      }

      // Notify the student
      const [studentProfile] = await db.select().from(schema.studentProfiles).where(eq(schema.studentProfiles.id, ev.studentId)).limit(1);
      if (studentProfile) {
        await db.insert(schema.notifications).values({
          userId: studentProfile.userId,
          type: "EVIDENCE_REVIEWED",
          title: `Evidence ${input.decision === "VERIFIED" ? "Verified" : "Review Update"}`,
          message: `Your evidence "${ev.title}" has been ${input.decision.toLowerCase()} by college administration.${input.notes ? ` Reviewer note: ${input.notes}` : ""}`,
        });

        // Recalculate readiness
        await calculateStudentReadiness(ev.studentId);
      }

      logAudit(ctx.user!.id, `EVIDENCE_${input.decision}`, "evidence", input.evidenceId, { decision: input.decision, notes: input.notes });
      return { success: true };
    }),

  // 5. Skill Heatmap
  getSkillHeatmap: collegeProcedure.query(async () => {
    const db = await getDb();
    const students = await db.select({
      id: schema.studentProfiles.id,
      department: schema.studentProfiles.department,
    }).from(schema.studentProfiles);

    const skills = ["Python", "React", "SQL", "Cloud", "Testing", "Analytics"];
    const deptMap: Record<string, Record<string, number>> = {};

    for (const s of students) {
      const dept = s.department || "General Engineering";
      if (!deptMap[dept]) {
        deptMap[dept] = { Python: 0, React: 0, SQL: 0, Cloud: 0, Testing: 0, Analytics: 0, total: 0 };
      }
      deptMap[dept].total += 1;
    }

    // Retrieve verified skills per department
    const studentSkillRows = await db.select({
      studentId: schema.studentSkills.studentId,
      skillName: schema.skills.name,
      verified: schema.studentSkills.verified,
    })
    .from(schema.studentSkills)
    .innerJoin(schema.skills, eq(schema.studentSkills.skillId, schema.skills.id));

    for (const ss of studentSkillRows) {
      const student = students.find((s: any) => s.id === ss.studentId);
      if (!student) continue;
      const dept = student.department || "General Engineering";
      for (const sk of skills) {
        if (ss.skillName.toLowerCase().includes(sk.toLowerCase())) {
          if (deptMap[dept]) deptMap[dept][sk] = (deptMap[dept][sk] || 0) + (ss.verified ? 1 : 0.5);
        }
      }
    }

    return Object.entries(deptMap).map(([department, data]) => ({
      department,
      skills: skills.map(sk => ({
        skill: sk,
        percentage: data.total > 0 ? Math.min(100, Math.round(((data[sk] || 0) / data.total) * 100)) : 0,
      })),
    }));
  }),
});
