import { getDb, schema } from "../../db";
import { eq, and } from "drizzle-orm";
import { qwen3 } from "../ai/qwen3";

export interface ReadinessBreakdown {
  overallScore: number;
  placementReadiness: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  roleAlignmentScore: number;
  evidenceStrengthScore: number;
  academicScore: number;
  projectScore: number;
  experienceScore: number;
  factors: {
    verifiedEvidenceCount: number;
    totalEvidenceCount: number;
    verifiedSkillsCount: number;
    projectCount: number;
    certificationCount: number;
    internshipCount: number;
    cgpa: number;
    profileCompletion: number;
  };
  explanation: string;
}

export async function calculateStudentReadiness(studentId: number): Promise<ReadinessBreakdown> {
  const db = await getDb();

  // 1. Fetch all student records
  const [profile] = await db.select().from(schema.studentProfiles).where(eq(schema.studentProfiles.id, studentId)).limit(1);
  if (!profile) {
    throw new Error(`Student profile ${studentId} not found`);
  }

  const studentSkills = await db.select().from(schema.studentSkills).where(eq(schema.studentSkills.studentId, studentId));
  const projects = await db.select().from(schema.projects).where(eq(schema.projects.studentId, studentId));
  const certifications = await db.select().from(schema.certifications).where(eq(schema.certifications.studentId, studentId));
  const internships = await db.select().from(schema.internships).where(eq(schema.internships.studentId, studentId));
  const evidenceList = await db.select().from(schema.evidence).where(eq(schema.evidence.studentId, studentId));
  const academics = await db.select().from(schema.academicRecords).where(eq(schema.academicRecords.studentId, studentId));

  // 2. Compute component scores

  // A. Academic Score (15%): CGPA (scale 0-10 or 0-4) + verified semester records
  const rawCgpa = profile.cgpa ? parseFloat(String(profile.cgpa)) : 7.0;
  const normalizedCgpa = rawCgpa <= 4.0 ? (rawCgpa / 4.0) * 100 : Math.min(100, (rawCgpa / 10.0) * 100);
  const academicRecordsBonus = Math.min(15, academics.filter((a: any) => a.verified).length * 3);
  const academicScore = Math.round(Math.min(100, normalizedCgpa * 0.85 + academicRecordsBonus));

  // B. Technical Skills Score (30%): Count, proficiency, and verification
  let skillPoints = 0;
  for (const s of studentSkills) {
    let base = s.proficiency === "EXPERT" ? 25 : s.proficiency === "ADVANCED" ? 20 : s.proficiency === "INTERMEDIATE" ? 15 : 10;
    if (s.verified) base *= 1.25;
    skillPoints += base;
  }
  const technicalScore = Math.round(Math.min(100, (skillPoints / 120) * 100));

  // C. Projects Score (20%): Count, verified status, repository/live links
  let projectPoints = 0;
  for (const p of projects) {
    let pVal = 25;
    if (p.repositoryUrl) pVal += 10;
    if (p.liveUrl) pVal += 10;
    if (p.verificationStatus === "VERIFIED") pVal += 15;
    projectPoints += pVal;
  }
  const projectScore = Math.round(Math.min(100, (projectPoints / 120) * 100));

  // D. Evidence Strength Score (15%): Ratio of verified evidence claims
  const totalEvidence = evidenceList.length;
  const verifiedEvidence = evidenceList.filter((e: any) => e.verificationStatus === "VERIFIED").length;
  const evidenceRatio = totalEvidence > 0 ? (verifiedEvidence / totalEvidence) : 0;
  const evidenceStrengthScore = Math.round(Math.min(100, verifiedEvidence * 15 + evidenceRatio * 25));

  // E. Experience / Internships & Certifications (10%)
  const expPoints = internships.length * 35 + certifications.length * 20;
  const experienceScore = Math.round(Math.min(100, expPoints));

  // F. Problem Solving & Communication Signals
  const communicationSkills = studentSkills.filter((s: any) =>
    ["communication", "presentation", "leadership", "teamwork", "writing"].some(k => s.source.toLowerCase().includes(k))
  );
  const communicationScore = Math.round(Math.min(100, 50 + communicationSkills.length * 15));
  const problemSolvingScore = Math.round(Math.min(100, technicalScore * 0.6 + projectScore * 0.4));

  // G. Target Role Alignment (10%)
  const targetRoles = profile.targetRoles || [];
  const primaryRole = targetRoles[0] || "Software Engineer";
  // Check overlap with primary role heuristics
  const roleKeywords: Record<string, string[]> = {
    "product engineer": ["react", "python", "fastapi", "system design", "testing", "sql"],
    "frontend engineer": ["react", "typescript", "javascript", "css", "html", "testing"],
    "backend engineer": ["python", "node.js", "sql", "postgresql", "fastapi", "docker", "aws"],
    "data analyst": ["sql", "python", "analytics", "postgresql", "machine learning"],
    "cloud associate": ["aws", "docker", "linux", "system design"],
  };

  const expected = roleKeywords[primaryRole.toLowerCase()] || ["python", "sql", "git"];
  const allStudentSkillNames = studentSkills.map((s: any) => String(s.skillId).toLowerCase());
  const matched = expected.filter((exp: string) =>
    allStudentSkillNames.some((name: string) => name.includes(exp)) || projects.some((p: any) => p.description.toLowerCase().includes(exp))
  );
  const roleAlignmentScore = Math.round(Math.min(100, (matched.length / expected.length) * 100));

  // 3. Overall Weighted Career Readiness Score (0-100)
  const weightedTotal =
    technicalScore * 0.30 +
    projectScore * 0.20 +
    academicScore * 0.15 +
    evidenceStrengthScore * 0.15 +
    experienceScore * 0.10 +
    roleAlignmentScore * 0.10;

  const overallScore = Math.max(0, Math.min(100, Math.round(weightedTotal)));
  const placementReadiness = Math.max(0, Math.min(100, Math.round(overallScore * 0.92)));

  // Profile completion calculation
  let completion = 20; // baseline for created profile
  if (profile.department && profile.program) completion += 15;
  if (profile.cgpa) completion += 10;
  if (studentSkills.length > 0) completion += 15;
  if (projects.length > 0) completion += 15;
  if (evidenceList.length > 0) completion += 15;
  if (certifications.length > 0 || internships.length > 0) completion += 10;
  const profileCompletion = Math.min(100, completion);

  const breakdown: ReadinessBreakdown = {
    overallScore,
    placementReadiness,
    technicalScore,
    communicationScore,
    problemSolvingScore,
    roleAlignmentScore,
    evidenceStrengthScore,
    academicScore,
    projectScore,
    experienceScore,
    factors: {
      verifiedEvidenceCount: verifiedEvidence,
      totalEvidenceCount: totalEvidence,
      verifiedSkillsCount: studentSkills.filter((s: any) => s.verified).length,
      projectCount: projects.length,
      certificationCount: certifications.length,
      internshipCount: internships.length,
      cgpa: rawCgpa,
      profileCompletion,
    },
    explanation: "",
  };

  // Generate explanation via Qwen3 or transparent rule
  breakdown.explanation = await qwen3.generateReadinessExplanation(breakdown);

  // 4. Persist assessment record & update student profile
  await db.insert(schema.readinessAssessments).values({
    studentId,
    overallScore,
    technicalScore,
    communicationScore,
    problemSolvingScore,
    roleAlignmentScore,
    evidenceStrengthScore,
    academicScore,
    projectScore,
    experienceScore,
    confidence: "0.90",
    model: "CareerOS-Readiness-Engine-v2",
    explanation: breakdown.explanation,
    factors: breakdown.factors,
  });

  await db.update(schema.studentProfiles).set({
    readinessScore: overallScore,
    readinessUpdatedAt: new Date(),
    profileCompletion,
  }).where(eq(schema.studentProfiles.id, studentId));

  return breakdown;
}
