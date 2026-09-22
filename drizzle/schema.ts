import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "STUDENT",
  "COLLEGE_ADMIN",
  "RECRUITER",
  "SUPER_ADMIN",
]);

export const recruiterVisibilityEnum = pgEnum("recruiter_visibility", [
  "PRIVATE",
  "COLLEGE_ONLY",
  "CONSENTED",
  "PUBLIC",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export const crossVerificationStatusEnum = pgEnum("cross_verification_status", [
  "VERIFIED",
  "CONSISTENT",
  "PARTIALLY_VERIFIED",
  "MISMATCH",
  "UNABLE_TO_VERIFY",
  "NEEDS_REVIEW",
]);

export const professionalProviderEnum = pgEnum("professional_provider", [
  "GITHUB",
  "LINKEDIN",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "PROJECT",
  "CERTIFICATE",
  "INTERNSHIP",
  "ACHIEVEMENT",
  "ACADEMIC",
  "DOCUMENT",
]);

export const aiStatusEnum = pgEnum("ai_status", [
  "NOT_REQUESTED",
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const processingStatusEnum = pgEnum("processing_status", [
  "UPLOADED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
  "REVIEW_REQUIRED",
]);

export const ocrStatusEnum = pgEnum("ocr_status", [
  "PENDING",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
  "NOT_APPLICABLE",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "DRAFT",
  "OPEN",
  "CLOSED",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "APPLIED",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "ACCEPTED",
]);

// 1. Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("STUDENT").notNull(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  avatarUrl: text("avatar_url"),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// 2. Student Profiles
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 64 }),
  collegeId: integer("college_id"),
  college: varchar("college", { length: 255 }),
  department: varchar("department", { length: 160 }),
  program: varchar("program", { length: 160 }),
  course: varchar("course", { length: 160 }),
  semester: integer("semester"),
  graduationYear: integer("graduation_year"),
  cgpa: numeric("cgpa", { precision: 4, scale: 2 }),
  bio: text("bio"),
  location: varchar("location", { length: 160 }),
  targetRoles: jsonb("target_roles").$type<string[]>().default([]).notNull(),
  careerInterests: jsonb("career_interests").$type<string[]>().default([]).notNull(),
  profileCompletion: integer("profile_completion").default(0).notNull(),
  readinessScore: integer("readiness_score").default(0).notNull(),
  readinessUpdatedAt: timestamp("readiness_updated_at"),
  recruiterVisibility: recruiterVisibilityEnum("recruiter_visibility").default("CONSENTED").notNull(),
  privacySettings: jsonb("privacy_settings").$type<{ recruiters: boolean; linkedin: boolean; github: boolean; resume: boolean; academicDocs: boolean }>().default({ recruiters: true, linkedin: true, github: true, resume: true, academicDocs: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. College Profiles
export const collegeProfiles = pgTable("college_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  collegeName: varchar("college_name", { length: 255 }).notNull(),
  institutionCode: varchar("institution_code", { length: 64 }),
  university: varchar("university", { length: 255 }),
  address: text("address"),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  website: varchar("website", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  placementOfficer: varchar("placement_officer", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Recruiter Profiles
export const recruiterProfiles = pgTable("recruiter_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyWebsite: varchar("company_website", { length: 255 }),
  designation: varchar("designation", { length: 160 }),
  industry: varchar("industry", { length: 160 }),
  companyEmail: varchar("company_email", { length: 320 }),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Academic Records
export const academicRecords = pgTable("academic_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  semester: integer("semester").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  subjectCode: varchar("subject_code", { length: 40 }),
  credits: numeric("credits", { precision: 3, scale: 1 }),
  marks: numeric("marks", { precision: 5, scale: 2 }),
  grade: varchar("grade", { length: 10 }),
  gradePoint: numeric("grade_point", { precision: 4, scale: 2 }),
  source: varchar("source", { length: 80 }).default("MANUAL").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Skills
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  category: varchar("category", { length: 80 }).notNull(), // TECHNICAL, FRAMEWORK, SOFT_SKILL, DOMAIN, TOOL
  description: text("description"),
});

// 7. Student Skills
export const studentSkills = pgTable("student_skills", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  proficiency: varchar("proficiency", { length: 40 }).default("INTERMEDIATE").notNull(),
  confidence: numeric("confidence", { precision: 3, scale: 2 }).default("0.80").notNull(),
  evidenceCount: integer("evidence_count").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
  source: varchar("source", { length: 80 }).default("SELF_REPORTED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description").notNull(),
  technologies: jsonb("technologies").$type<string[]>().default([]).notNull(),
  role: varchar("role", { length: 160 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  repositoryUrl: text("repository_url"),
  liveUrl: text("live_url"),
  documentationUrl: text("documentation_url"),
  status: varchar("status", { length: 40 }).default("COMPLETED").notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Certifications
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 240 }).notNull(),
  issuer: varchar("issuer", { length: 200 }).notNull(),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  credentialId: varchar("credential_id", { length: 200 }),
  credentialUrl: text("credential_url"),
  documentUrl: text("document_url"),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Internships
export const internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  company: varchar("company", { length: 240 }).notNull(),
  role: varchar("role", { length: 160 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  skills: jsonb("skills").$type<string[]>().default([]).notNull(),
  documentUrl: text("document_url"),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Evidence
export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  type: evidenceTypeEnum("type").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  source: varchar("source", { length: 120 }).notNull(),
  sourceUrl: text("source_url"),
  documentUrl: text("document_url"),
  extractedText: text("extracted_text"),
  extractedMetadata: jsonb("extracted_metadata"),
  skills: jsonb("skills").$type<string[]>().default([]).notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  aiAnalysisStatus: aiStatusEnum("ai_analysis_status").default("NOT_REQUESTED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 12. Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 60 }).notNull(), // RESUME, CERTIFICATE, TRANSCRIPT, PROJECT_REPORT
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  processingStatus: processingStatusEnum("processing_status").default("UPLOADED").notNull(),
  ocrStatus: ocrStatusEnum("ocr_status").default("PENDING").notNull(),
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// 13. AI Analysis
export const aiAnalysis = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "set null" }),
  evidenceId: integer("evidence_id").references(() => evidence.id, { onDelete: "set null" }),
  model: varchar("model", { length: 80 }).notNull(),
  modelVersion: varchar("model_version", { length: 40 }).notNull(),
  promptVersion: varchar("prompt_version", { length: 40 }).notNull(),
  analysisType: varchar("analysis_type", { length: 60 }).notNull(),
  inputHash: varchar("input_hash", { length: 64 }).notNull(),
  outputJson: jsonb("output_json").notNull(),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Readiness Assessments
export const readinessAssessments = pgTable("readiness_assessments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  technicalScore: integer("technical_score").notNull(),
  communicationScore: integer("communication_score").notNull(),
  problemSolvingScore: integer("problem_solving_score").notNull(),
  roleAlignmentScore: integer("role_alignment_score").notNull(),
  evidenceStrengthScore: integer("evidence_strength_score").notNull(),
  academicScore: integer("academic_score").notNull(),
  projectScore: integer("project_score").notNull(),
  experienceScore: integer("experience_score").notNull(),
  confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  explanation: text("explanation"),
  factors: jsonb("factors"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Career Recommendations
export const careerRecommendations = pgTable("career_recommendations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  targetRole: varchar("target_role", { length: 160 }).notNull(),
  matchScore: integer("match_score").notNull(),
  missingSkills: jsonb("missing_skills").$type<string[]>().default([]).notNull(),
  recommendedActions: jsonb("recommended_actions").$type<Array<{ title: string; skill: string; time: string; reason: string }>>().default([]).notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 16. Jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  employmentType: varchar("employment_type", { length: 60 }).default("FULL_TIME").notNull(),
  experienceLevel: varchar("experience_level", { length: 60 }).default("ENTRY_LEVEL").notNull(),
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]).notNull(),
  preferredSkills: jsonb("preferred_skills").$type<string[]>().default([]).notNull(),
  salaryRange: varchar("salary_range", { length: 100 }),
  minReadiness: integer("min_readiness").default(0).notNull(),
  applicationDeadline: timestamp("application_deadline"),
  status: jobStatusEnum("status").default("OPEN").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 17. Job Applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").default("APPLIED").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 18. Recruiter Searches
export const recruiterSearches = pgTable("recruiter_searches", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  searchParams: jsonb("search_params").notNull(),
  resultCount: integer("result_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 19. Consent Records
export const consentRecords = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  recruiterId: integer("recruiter_id").references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  scope: varchar("scope", { length: 80 }).default("RECRUITER_DISCOVERY").notNull(),
  granted: boolean("granted").default(true).notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

// 20. Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 60 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 21. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: integer("entity_id"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// 22. Extracted Data (OCR Structured Fields)
export const extractedData = pgTable("extracted_data", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldValue: text("field_value").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("0.90").notNull(),
  source: varchar("source", { length: 80 }).default("PaddleOCR").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 23. Verification Results (Cross-Source Matrix)
export const verificationResults = pgTable("verification_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  value: text("value").notNull(),
  status: crossVerificationStatusEnum("status").default("CONSISTENT").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("0.90").notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

// 24. Professional Profiles (GitHub & LinkedIn Integrations)
export const professionalProfiles = pgTable("professional_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: professionalProviderEnum("provider").notNull(),
  profileUrl: varchar("profile_url", { length: 500 }).notNull(),
  username: varchar("username", { length: 120 }),
  providerUserId: varchar("provider_user_id", { length: 120 }),
  verified: boolean("verified").default(false).notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastSynced: timestamp("last_synced"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}).notNull(),
});

// Type Exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;
export type CollegeProfile = typeof collegeProfiles.$inferSelect;
export type InsertCollegeProfile = typeof collegeProfiles.$inferInsert;
export type RecruiterProfile = typeof recruiterProfiles.$inferSelect;
export type InsertRecruiterProfile = typeof recruiterProfiles.$inferInsert;
export type AcademicRecord = typeof academicRecords.$inferSelect;
export type InsertAcademicRecord = typeof academicRecords.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;
export type StudentSkill = typeof studentSkills.$inferSelect;
export type InsertStudentSkill = typeof studentSkills.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;
export type Internship = typeof internships.$inferSelect;
export type InsertInternship = typeof internships.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type ExtractedData = typeof extractedData.$inferSelect;
export type InsertExtractedData = typeof extractedData.$inferInsert;
export type VerificationResult = typeof verificationResults.$inferSelect;
export type InsertVerificationResult = typeof verificationResults.$inferInsert;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type InsertProfessionalProfile = typeof professionalProfiles.$inferInsert;
export type AIAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertAIAnalysis = typeof aiAnalysis.$inferInsert;
export type ReadinessAssessment = typeof readinessAssessments.$inferSelect;
export type InsertReadinessAssessment = typeof readinessAssessments.$inferInsert;
export type CareerRecommendation = typeof careerRecommendations.$inferSelect;
export type InsertCareerRecommendation = typeof careerRecommendations.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;
export type RecruiterSearch = typeof recruiterSearches.$inferSelect;
export type InsertRecruiterSearch = typeof recruiterSearches.$inferInsert;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = typeof consentRecords.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

