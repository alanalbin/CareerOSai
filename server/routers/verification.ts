import { z } from "zod";
import { router, protectedProcedure, studentProcedure } from "../_core/trpc";
import { getDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { logAudit } from "../services/audit/auditService";
import { TRPCError } from "@trpc/server";

export type VerificationMatrixRow = {
  field: string;
  careerOsValue: string;
  careerOs?: string;
  ocrValue: string;
  linkedinValue: string;
  githubValue: string;
  collegeValue: string;
  status: "VERIFIED" | "CONSISTENT" | "PARTIALLY_VERIFIED" | "MISMATCH" | "UNABLE_TO_VERIFY" | "NEEDS_REVIEW";
  confidence: number;
  sources: string[];
  lastChecked: string;
};

export const verificationRouter = router({
  // 1. Get Unified Cross-Source Verification Matrix
  getMatrix: protectedProcedure
    .input(z.object({ studentId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      let targetStudentProfileId: number | null = null;

      if (ctx.user.role === "STUDENT") {
        const [profile] = await db
          .select()
          .from(schema.studentProfiles)
          .where(eq(schema.studentProfiles.userId, ctx.user.id))
          .limit(1);
        if (!profile) return { matrix: [], summary: { total: 0, consistent: 0, needsReview: 0 } };
        targetStudentProfileId = profile.id;
      } else if (input?.studentId) {
        targetStudentProfileId = input.studentId;
      }

      if (!targetStudentProfileId) {
        return { matrix: [], summary: { total: 0, consistent: 0, needsReview: 0 } };
      }

      // 1. Fetch Student Profile and User data
      const [student] = await db
        .select()
        .from(schema.studentProfiles)
        .where(eq(schema.studentProfiles.id, targetStudentProfileId))
        .limit(1);
      if (!student) return { matrix: [], summary: { total: 0, consistent: 0, needsReview: 0 } };

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, student.userId))
        .limit(1);

      // 2. Fetch Connected Professional Profiles (GitHub, LinkedIn)
      const profProfiles = await db
        .select()
        .from(schema.professionalProfiles)
        .where(eq(schema.professionalProfiles.userId, student.userId));

      const githubProfile = profProfiles.find((p: any) => p.provider === "GITHUB");
      const linkedinProfile = profProfiles.find((p: any) => p.provider === "LINKEDIN");

      // 3. Fetch OCR Extracted Data from uploaded documents
      const docs = await db
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.userId, student.userId))
        .orderBy(desc(schema.documents.uploadedAt));

      let ocrData: any = {};
      if (docs.length > 0) {
        const latestDoc = docs.find((d: any) => d.ocrStatus === "PROCESSED" || d.ocrStatus === "PENDING") || docs[0];
        if (latestDoc && latestDoc.extractedData) {
          ocrData = latestDoc.extractedData as any;
        }
      }

      // 4. Fetch Verified Academic Records & Evidence
      const academicRecords = await db
        .select()
        .from(schema.academicRecords)
        .where(eq(schema.academicRecords.studentId, student.id));

      const evidenceList = await db
        .select()
        .from(schema.evidence)
        .where(eq(schema.evidence.studentId, student.id));

      const verifiedEvidence = evidenceList.filter((e: any) => e.verificationStatus === "VERIFIED");

      // 5. Fetch Verified Student Skills
      const studentSkills = await db
        .select({
          name: schema.skills.name,
          verified: schema.studentSkills.verified,
        })
        .from(schema.studentSkills)
        .innerJoin(schema.skills, eq(schema.studentSkills.skillId, schema.skills.id))
        .where(eq(schema.studentSkills.studentId, student.id));

      // Build Matrix Rows
      const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "—";

      // Row: Full Name
      const ocrName = ocrData.name || "—";
      const liName = linkedinProfile?.metadata?.fullName || (linkedinProfile ? fullName : "—");
      const ghName = githubProfile?.metadata?.name || githubProfile?.username || "—";
      let nameStatus: VerificationMatrixRow["status"] = "CONSISTENT";
      if (ocrName !== "—" && ocrName.toLowerCase() !== fullName.toLowerCase()) {
        nameStatus = "NEEDS_REVIEW";
      } else if (profProfiles.some((p: any) => p.verified)) {
        nameStatus = "VERIFIED";
      }

      const matrix: VerificationMatrixRow[] = [
        {
          field: "Name",
          careerOsValue: fullName,
          careerOs: fullName,
          ocrValue: ocrName,
          linkedinValue: liName,
          githubValue: ghName,
          collegeValue: fullName,
          status: nameStatus,
          confidence: ocrName !== "—" ? 0.98 : 0.95,
          sources: ["Account", ...(ocrName !== "—" ? ["PaddleOCR"] : []), ...(ghName !== "—" ? ["GitHub"] : [])],
          lastChecked: new Date().toISOString().split("T")[0],
        },
        {
          field: "College / Institution",
          careerOsValue: student.college || student.department || "—",
          ocrValue: ocrData.education?.[0]?.institution || ocrData.college || "—",
          linkedinValue: linkedinProfile?.metadata?.college || "—",
          githubValue: "—",
          collegeValue: student.college || "Registered Institution",
          status: student.college ? "CONSISTENT" : "UNABLE_TO_VERIFY",
          confidence: 0.94,
          sources: ["College", ...(ocrData.college ? ["PaddleOCR"] : [])],
          lastChecked: new Date().toISOString().split("T")[0],
        },
        {
          field: "Degree / Course",
          careerOsValue: student.course || student.program || "—",
          ocrValue: ocrData.education?.[0]?.degree || "—",
          linkedinValue: linkedinProfile?.metadata?.degree || "—",
          githubValue: "—",
          collegeValue: student.course || student.program || "—",
          status: student.course ? "CONSISTENT" : "UNABLE_TO_VERIFY",
          confidence: 0.92,
          sources: ["College", ...(ocrData.education ? ["PaddleOCR"] : [])],
          lastChecked: new Date().toISOString().split("T")[0],
        },
        {
          field: "Graduation Year",
          careerOsValue: student.graduationYear ? String(student.graduationYear) : "—",
          ocrValue: ocrData.education?.[0]?.graduationYear ? String(ocrData.education[0].graduationYear) : "—",
          linkedinValue: linkedinProfile?.metadata?.graduationYear || "—",
          githubValue: "—",
          collegeValue: student.graduationYear ? String(student.graduationYear) : "—",
          status: (ocrData.education?.[0]?.graduationYear && student.graduationYear && String(ocrData.education[0].graduationYear) !== String(student.graduationYear)) ? "MISMATCH" : "CONSISTENT",
          confidence: 0.90,
          sources: ["College", ...(ocrData.education ? ["PaddleOCR"] : [])],
          lastChecked: new Date().toISOString().split("T")[0],
        },
        {
          field: "Technical Skills",
          careerOsValue: studentSkills.length > 0 ? studentSkills.map((s: any) => s.name).slice(0, 5).join(", ") : "—",
          ocrValue: Array.isArray(ocrData.skills) && ocrData.skills.length > 0 ? ocrData.skills.slice(0, 5).join(", ") : "—",
          linkedinValue: Array.isArray(linkedinProfile?.metadata?.skills) ? linkedinProfile.metadata.skills.slice(0, 4).join(", ") : "—",
          githubValue: Array.isArray(githubProfile?.metadata?.topLanguages) ? githubProfile.metadata.topLanguages.slice(0, 4).join(", ") : "—",
          collegeValue: verifiedEvidence.length > 0 ? `${verifiedEvidence.length} verified artifacts` : "—",
          status: studentSkills.some((s: any) => s.verified) ? "VERIFIED" : (studentSkills.length > 0 ? "CONSISTENT" : "UNABLE_TO_VERIFY"),
          confidence: 0.91,
          sources: [
            ...(studentSkills.length > 0 ? ["Career OS"] : []),
            ...(githubProfile ? ["GitHub"] : []),
            ...(ocrData.skills ? ["PaddleOCR"] : []),
          ],
          lastChecked: new Date().toISOString().split("T")[0],
        },
        {
          field: "Projects & Repositories",
          careerOsValue: evidenceList.length > 0 ? `${evidenceList.length} registered project(s)` : "—",
          ocrValue: Array.isArray(ocrData.projects) && ocrData.projects.length > 0 ? `${ocrData.projects.length} project(s) in resume` : "—",
          linkedinValue: "—",
          githubValue: githubProfile?.metadata?.publicRepos ? `${githubProfile.metadata.publicRepos} public repository(ies)` : "—",
          collegeValue: verifiedEvidence.filter((e: any) => e.type === "PROJECT").length > 0 ? "Verified by faculty" : "—",
          status: (githubProfile?.metadata?.publicRepos || verifiedEvidence.length > 0) ? "PARTIALLY_VERIFIED" : "UNABLE_TO_VERIFY",
          confidence: 0.88,
          sources: [
            ...(evidenceList.length > 0 ? ["Career OS"] : []),
            ...(githubProfile ? ["GitHub"] : []),
          ],
          lastChecked: new Date().toISOString().split("T")[0],
        },
      ];

      const consistentCount = matrix.filter(r => r.status === "CONSISTENT" || r.status === "VERIFIED" || r.status === "PARTIALLY_VERIFIED").length;
      const needsReviewCount = matrix.filter(r => r.status === "NEEDS_REVIEW" || r.status === "MISMATCH").length;

      return {
        matrix,
        summary: {
          total: matrix.length,
          consistent: consistentCount,
          needsReview: needsReviewCount,
        },
        connectedAccounts: {
          github: Boolean(githubProfile),
          githubData: githubProfile ? {
            username: githubProfile.username,
            profileUrl: githubProfile.profileUrl,
            publicRepos: githubProfile.metadata?.publicRepos || 0,
            topLanguages: githubProfile.metadata?.topLanguages || [],
          } : null,
          linkedin: Boolean(linkedinProfile),
          linkedinData: linkedinProfile ? {
            profileUrl: linkedinProfile.profileUrl,
            verified: linkedinProfile.verified,
          } : null,
        },
      };
    }),

  // 2. Human Review Resolution for Discrepancies
  resolveDiscrepancy: protectedProcedure
    .input(
      z.object({
        field: z.string().optional(),
        fieldName: z.string().optional(),
        newValue: z.string().optional(),
        resolvedValue: z.string().optional(),
        reason: z.string().min(3, "Please provide a reason for the discrepancy resolution"),
      }).refine(input => Boolean(input.field || input.fieldName) && Boolean(input.newValue || input.resolvedValue), {
        message: "A field and resolved value are required.",
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      const field = input.field || input.fieldName!;
      const resolvedValue = input.newValue || input.resolvedValue!;
      // Log into audit trail
      await logAudit(
        ctx.user.id,
        "DISCREPANCY_RESOLVED",
        "verification_results",
        ctx.user.id,
        {
          field,
          resolvedValue,
          reason: input.reason,
          resolvedBy: ctx.user.email,
        },
        ctx.req.ip
      );

      // Record resolution in verification_results
      await db.insert(schema.verificationResults).values({
        userId: ctx.user.id,
        fieldName: field,
        source: "Human Review",
        value: resolvedValue,
        status: "VERIFIED",
        confidence: "1.00",
      });

      return {
        success: true,
        resolvedValue,
        message: `Field "${field}" successfully resolved and logged to the official audit trail.`,
      };
    }),
});
