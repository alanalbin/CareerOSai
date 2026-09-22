import { z } from "zod";
import { router, protectedProcedure, studentProcedure } from "../_core/trpc";
import { getDb, schema, getStudentProfileByUserId, upsertProfessionalProfile, getProfessionalProfilesByUserId } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { calculateStudentReadiness } from "../services/scoring/readiness";
import { qwen3 } from "../services/ai/qwen3";
import { logAudit } from "../services/audit/auditService";
import { TRPCError } from "@trpc/server";

export const studentRouter = router({
  // 1. Dashboard Overview
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    let profile = await getStudentProfileByUserId(ctx.user.id);

    if (!profile) {
      // Auto-create student profile if user is student
      const [newProfile] = await db
        .insert(schema.studentProfiles)
        .values({
          userId: ctx.user.id,
          targetRoles: ["Product Engineer"],
          department: "Computer Science",
          program: "B.Tech",
          graduationYear: 2026,
          profileCompletion: 25,
          readinessScore: 0,
        })
        .returning();
      profile = newProfile;
    }

    const [studentSkills, projects, certifications, internships, evidenceList, recommendations, recentAssessments] = await Promise.all([
      db.select({
        id: schema.studentSkills.id,
        skillId: schema.studentSkills.skillId,
        skillName: schema.skills.name,
        category: schema.skills.category,
        proficiency: schema.studentSkills.proficiency,
        verified: schema.studentSkills.verified,
        confidence: schema.studentSkills.confidence,
      })
      .from(schema.studentSkills)
      .innerJoin(schema.skills, eq(schema.studentSkills.skillId, schema.skills.id))
      .where(eq(schema.studentSkills.studentId, profile.id)),

      db.select().from(schema.projects).where(eq(schema.projects.studentId, profile.id)).orderBy(desc(schema.projects.createdAt)),
      db.select().from(schema.certifications).where(eq(schema.certifications.studentId, profile.id)),
      db.select().from(schema.internships).where(eq(schema.internships.studentId, profile.id)),
      db.select().from(schema.evidence).where(eq(schema.evidence.studentId, profile.id)).orderBy(desc(schema.evidence.createdAt)),
      db.select().from(schema.careerRecommendations).where(eq(schema.careerRecommendations.studentId, profile.id)).orderBy(desc(schema.careerRecommendations.createdAt)).limit(1),
      db.select().from(schema.readinessAssessments).where(eq(schema.readinessAssessments.studentId, profile.id)).orderBy(desc(schema.readinessAssessments.createdAt)).limit(1),
    ]);

    const latestAssessment = recentAssessments[0];
    const verifiedEvidenceCount = evidenceList.filter((e: any) => e.verificationStatus === "VERIFIED").length;

    return {
      profile: {
        id: profile.id,
        name: `${ctx.user.firstName} ${ctx.user.lastName}`.trim(),
        email: ctx.user.email,
        department: profile.department || "General Engineering",
        program: profile.program || "Undergraduate",
        graduationYear: profile.graduationYear || 2026,
        cgpa: profile.cgpa ? parseFloat(String(profile.cgpa)) : 0,
        targetRole: profile.targetRoles?.[0] || "Product Engineer",
        targetRoles: profile.targetRoles || ["Product Engineer"],
        careerInterests: profile.careerInterests || [],
        employabilityScore: profile.readinessScore || 0,
        placementReadiness: Math.max(0, Math.round((profile.readinessScore || 0) * 0.92)),
        verifiedEvidence: verifiedEvidenceCount,
        totalEvidence: evidenceList.length,
        profileCompletion: profile.profileCompletion,
        recruiterVisibility: profile.recruiterVisibility,
      },
      assessment: latestAssessment ? {
        overallScore: latestAssessment.overallScore,
        technicalScore: latestAssessment.technicalScore,
        communicationScore: latestAssessment.communicationScore,
        problemSolvingScore: latestAssessment.problemSolvingScore,
        roleAlignmentScore: latestAssessment.roleAlignmentScore,
        evidenceStrengthScore: latestAssessment.evidenceStrengthScore,
        academicScore: latestAssessment.academicScore,
        projectScore: latestAssessment.projectScore,
        experienceScore: latestAssessment.experienceScore,
        explanation: latestAssessment.explanation,
      } : null,
      skills: studentSkills,
      projects,
      certifications,
      internships,
      evidence: evidenceList,
      recommendations: recommendations[0] ?? null,
    };
  }),

  // 2. Profile Management
  updateProfile: protectedProcedure
    .input(
      z.object({
        department: z.string().optional(),
        program: z.string().optional(),
        graduationYear: z.number().optional(),
        cgpa: z.number().min(0).max(10).optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
        targetRoles: z.array(z.string()).optional(),
        careerInterests: z.array(z.string()).optional(),
        recruiterVisibility: z.enum(["PRIVATE", "COLLEGE_ONLY", "CONSENTED", "PUBLIC"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (input.department !== undefined) updateData.department = input.department;
      if (input.program !== undefined) updateData.program = input.program;
      if (input.graduationYear !== undefined) updateData.graduationYear = input.graduationYear;
      if (input.cgpa !== undefined) updateData.cgpa = input.cgpa.toFixed(2);
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.targetRoles !== undefined) updateData.targetRoles = input.targetRoles;
      if (input.careerInterests !== undefined) updateData.careerInterests = input.careerInterests;
      if (input.recruiterVisibility !== undefined) {
        updateData.recruiterVisibility = input.recruiterVisibility;
        // Record in consent_records
        await db.insert(schema.consentRecords).values({
          studentId: profile.id,
          scope: "RECRUITER_DISCOVERY",
          granted: input.recruiterVisibility === "CONSENTED" || input.recruiterVisibility === "PUBLIC",
          revokedAt: (input.recruiterVisibility === "PRIVATE" || input.recruiterVisibility === "COLLEGE_ONLY") ? new Date() : null,
        });
      }

      await db.update(schema.studentProfiles).set(updateData).where(eq(schema.studentProfiles.id, profile.id));
      logAudit(ctx.user.id, "PROFILE_UPDATED", "student_profiles", profile.id);

      // Recalculate readiness
      await calculateStudentReadiness(profile.id);

      return { success: true };
    }),

  // 3. Evidence Operations
  getEvidence: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const profile = await getStudentProfileByUserId(ctx.user.id);
    if (!profile) return [];
    return db.select().from(schema.evidence).where(eq(schema.evidence.studentId, profile.id)).orderBy(desc(schema.evidence.createdAt));
  }),

  addEvidence: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2),
        type: z.enum(["PROJECT", "CERTIFICATE", "INTERNSHIP", "ACHIEVEMENT", "ACADEMIC", "DOCUMENT"]),
        source: z.string().min(2),
        sourceUrl: z.string().url().optional().or(z.literal("")),
        description: z.string().optional(),
        skills: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });

      const [newEv] = await db.insert(schema.evidence).values({
        studentId: profile.id,
        title: input.title,
        type: input.type,
        source: input.source,
        sourceUrl: input.sourceUrl || null,
        description: input.description || null,
        skills: input.skills,
        verificationStatus: "PENDING",
        aiAnalysisStatus: "NOT_REQUESTED",
      }).returning();

      // Recalculate readiness
      await calculateStudentReadiness(profile.id);
      logAudit(ctx.user.id, "EVIDENCE_CREATED", "evidence", newEv.id);

      return { success: true, evidence: newEv };
    }),

  deleteEvidence: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      await db.delete(schema.evidence).where(and(eq(schema.evidence.id, input.id), eq(schema.evidence.studentId, profile.id)));
      await calculateStudentReadiness(profile.id);
      return { success: true };
    }),

  // 4. Projects Operations
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const profile = await getStudentProfileByUserId(ctx.user.id);
    if (!profile) return [];
    return db.select().from(schema.projects).where(eq(schema.projects.studentId, profile.id)).orderBy(desc(schema.projects.createdAt));
  }),

  addProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2),
        description: z.string().min(10),
        technologies: z.array(z.string()).min(1),
        role: z.string().optional(),
        repositoryUrl: z.string().url().optional().or(z.literal("")),
        liveUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const [project] = await db.insert(schema.projects).values({
        studentId: profile.id,
        title: input.title,
        description: input.description,
        technologies: input.technologies,
        role: input.role || "Lead Developer",
        repositoryUrl: input.repositoryUrl || null,
        liveUrl: input.liveUrl || null,
        verificationStatus: "PENDING",
      }).returning();

      // Also create matching evidence item
      await db.insert(schema.evidence).values({
        studentId: profile.id,
        title: input.title,
        type: "PROJECT",
        source: input.repositoryUrl ? "GitHub" : "Project Submission",
        sourceUrl: input.repositoryUrl || input.liveUrl || null,
        description: input.description,
        skills: input.technologies,
        verificationStatus: "PENDING",
      });

      // Recalculate readiness
      await calculateStudentReadiness(profile.id);
      return { success: true, project };
    }),

  // 5. Skills Confirmation & Management
  confirmExtractedSkills: protectedProcedure
    .input(
      z.object({
        skills: z.array(z.string()),
        proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).default("INTERMEDIATE"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      for (const skillName of input.skills) {
        const cleanName = skillName.trim();
        if (!cleanName) continue;

        // Upsert skill in catalog
        let [skillRecord] = await db.select().from(schema.skills).where(eq(schema.skills.name, cleanName)).limit(1);
        if (!skillRecord) {
          [skillRecord] = await db.insert(schema.skills).values({
            name: cleanName,
            category: "TECHNICAL",
            description: "Confirmed demonstrable capability",
          }).returning();
        }

        // Check if student already has this skill
        const [existing] = await db.select().from(schema.studentSkills)
          .where(and(eq(schema.studentSkills.studentId, profile.id), eq(schema.studentSkills.skillId, skillRecord.id)))
          .limit(1);

        if (!existing) {
          await db.insert(schema.studentSkills).values({
            studentId: profile.id,
            skillId: skillRecord.id,
            proficiency: input.proficiency,
            confidence: "0.90",
            verified: true, // Confirmed by user
            source: "AI_CONFIRMED",
          });
        }
      }

      await calculateStudentReadiness(profile.id);
      return { success: true, count: input.skills.length };
    }),

  // 6. Recalculate Readiness explicitly
  recalculateReadiness: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getStudentProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
    const breakdown = await calculateStudentReadiness(profile.id);
    return { success: true, breakdown };
  }),

  // 7. Update Recruiter Consent
  updateConsent: protectedProcedure
    .input(z.object({ consent: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const newVisibility = input.consent ? "CONSENTED" : "PRIVATE";
      await db.update(schema.studentProfiles).set({
        recruiterVisibility: newVisibility,
      }).where(eq(schema.studentProfiles.id, profile.id));

      await db.insert(schema.consentRecords).values({
        studentId: profile.id,
        scope: "RECRUITER_DISCOVERY",
        granted: input.consent,
        revokedAt: input.consent ? null : new Date(),
      });

      logAudit(ctx.user.id, "CONSENT_UPDATED", "consent_records", profile.id, { granted: input.consent });
      return { success: true, recruiterVisibility: newVisibility };
    }),

  // 8. Connect GitHub Account (Official GitHub REST API integration)
  connectGithub: protectedProcedure
    .input(z.object({ username: z.string().trim().min(1, "GitHub username is required") }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const sanitizedUsername = input.username.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");

      try {
        // Fetch user from GitHub API
        const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(sanitizedUsername)}`, {
          headers: {
            "User-Agent": "Career-OS-Platform",
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!userRes.ok) {
          if (userRes.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `GitHub user "${sanitizedUsername}" was not found. Please verify the username.`,
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to verify GitHub account. Please try again later.",
          });
        }

        const ghUser = await userRes.json() as any;

        // Fetch user's public repositories
        const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(sanitizedUsername)}/repos?sort=updated&per_page=8`, {
          headers: {
            "User-Agent": "Career-OS-Platform",
            Accept: "application/vnd.github.v3+json",
          },
        });

        let topLanguages: string[] = [];
        let recentRepos: any[] = [];

        if (reposRes.ok) {
          const reposData = await reposRes.json() as any[];
          const langCounts: Record<string, number> = {};
          recentRepos = reposData.map(r => {
            if (r.language) {
              langCounts[r.language] = (langCounts[r.language] || 0) + 1;
            }
            return {
              id: r.id,
              name: r.name,
              description: r.description || "No description provided",
              language: r.language || "Other",
              stars: r.stargazers_count,
              forks: r.forks_count,
              url: r.html_url,
              updatedAt: r.updated_at,
            };
          });

          topLanguages = Object.entries(langCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang);
        }

        const profileRecord = await upsertProfessionalProfile({
          userId: ctx.user.id,
          provider: "GITHUB",
          profileUrl: ghUser.html_url || `https://github.com/${sanitizedUsername}`,
          username: ghUser.login,
          providerUserId: String(ghUser.id),
          verified: true,
          metadata: {
            name: ghUser.name || ghUser.login,
            bio: ghUser.bio || "",
            avatarUrl: ghUser.avatar_url,
            publicRepos: ghUser.public_repos || 0,
            followers: ghUser.followers || 0,
            topLanguages,
            recentRepos,
          },
        });

        logAudit(ctx.user.id, "GITHUB_CONNECTED", "professional_profiles", profileRecord.id, { username: ghUser.login });

        return {
          success: true,
          profile: profileRecord,
          message: `Connected GitHub account @${ghUser.login} with ${ghUser.public_repos} repositories.`,
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to connect GitHub account",
        });
      }
    }),

  // 9. Disconnect GitHub Account
  disconnectGithub: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    await db
      .delete(schema.professionalProfiles)
      .where(and(eq(schema.professionalProfiles.userId, ctx.user.id), eq(schema.professionalProfiles.provider, "GITHUB")));

    logAudit(ctx.user.id, "GITHUB_DISCONNECTED", "professional_profiles", ctx.user.id, {});
    return { success: true };
  }),

  // 10. Connect LinkedIn Profile
  connectLinkedin: protectedProcedure
    .input(z.object({ profileUrl: z.string().url("Please provide a valid LinkedIn URL") }))
    .mutation(async ({ input, ctx }) => {
      let cleanedUrl = input.profileUrl.trim();
      if (!cleanedUrl.startsWith("http")) {
        cleanedUrl = `https://${cleanedUrl}`;
      }

      const profileRecord = await upsertProfessionalProfile({
        userId: ctx.user.id,
        provider: "LINKEDIN",
        profileUrl: cleanedUrl,
        username: cleanedUrl.split("/in/")[1]?.replace(/\/$/, "") || "linkedin-user",
        verified: true,
        metadata: {
          profileUrl: cleanedUrl,
          connectedMethod: "AUTHORIZED_PROFILE_LINK",
        },
      });

      logAudit(ctx.user.id, "LINKEDIN_CONNECTED", "professional_profiles", profileRecord.id, { url: cleanedUrl });

      return {
        success: true,
        profile: profileRecord,
        message: "LinkedIn profile connected successfully.",
      };
    }),

  // 11. Disconnect LinkedIn Profile
  disconnectLinkedin: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    await db
      .delete(schema.professionalProfiles)
      .where(and(eq(schema.professionalProfiles.userId, ctx.user.id), eq(schema.professionalProfiles.provider, "LINKEDIN")));

    logAudit(ctx.user.id, "LINKEDIN_DISCONNECTED", "professional_profiles", ctx.user.id, {});
    return { success: true };
  }),

  // 12. Get Connected Professional Profiles
  getProfessionalProfiles: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await getProfessionalProfilesByUserId(ctx.user.id);
    const github = profiles.find((p: any) => p.provider === "GITHUB");
    const linkedin = profiles.find((p: any) => p.provider === "LINKEDIN");

    return {
      github: github ? {
        id: github.id,
        username: github.username,
        profileUrl: github.profileUrl,
        verified: github.verified,
        connectedAt: github.connectedAt,
        data: github.metadata as any,
      } : null,
      linkedin: linkedin ? {
        id: linkedin.id,
        username: linkedin.username,
        profileUrl: linkedin.profileUrl,
        verified: linkedin.verified,
        connectedAt: linkedin.connectedAt,
        data: linkedin.metadata as any,
      } : null,
    };
  }),

  // 13. Get Data Access & Privacy Settings
  getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getStudentProfileByUserId(ctx.user.id);
    const defaultSettings = {
      recruiters: profile?.recruiterVisibility !== "PRIVATE",
      linkedin: true,
      github: true,
      resume: true,
      academicDocs: false,
    };

    return profile?.privacySettings || defaultSettings;
  }),

  // 14. Update Data Access & Privacy Settings
  updatePrivacySettings: protectedProcedure
    .input(
      z.object({
        recruiters: z.boolean(),
        linkedin: z.boolean(),
        github: z.boolean(),
        resume: z.boolean(),
        academicDocs: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const newVisibility = input.recruiters ? "CONSENTED" : "PRIVATE";

      await db
        .update(schema.studentProfiles)
        .set({
          privacySettings: input,
          recruiterVisibility: newVisibility,
        })
        .where(eq(schema.studentProfiles.id, profile.id));

      logAudit(ctx.user.id, "PRIVACY_SETTINGS_UPDATED", "student_profiles", profile.id, input);

      return { success: true, privacySettings: input };
    }),
});
