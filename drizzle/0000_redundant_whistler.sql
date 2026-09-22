CREATE TYPE "public"."ai_status" AS ENUM('NOT_REQUESTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED');--> statement-breakpoint
CREATE TYPE "public"."cross_verification_status" AS ENUM('VERIFIED', 'CONSISTENT', 'PARTIALLY_VERIFIED', 'MISMATCH', 'UNABLE_TO_VERIFY', 'NEEDS_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('PROJECT', 'CERTIFICATE', 'INTERNSHIP', 'ACHIEVEMENT', 'ACADEMIC', 'DOCUMENT');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."ocr_status" AS ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'NOT_APPLICABLE');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVIEW_REQUIRED');--> statement-breakpoint
CREATE TYPE "public"."professional_provider" AS ENUM('GITHUB', 'LINKEDIN');--> statement-breakpoint
CREATE TYPE "public"."recruiter_visibility" AS ENUM('PRIVATE', 'COLLEGE_ONLY', 'CONSENTED', 'PUBLIC');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'COLLEGE_ADMIN', 'RECRUITER', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "academic_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"semester" integer NOT NULL,
	"subject" varchar(200) NOT NULL,
	"subject_code" varchar(40),
	"credits" numeric(3, 1),
	"marks" numeric(5, 2),
	"grade" varchar(10),
	"grade_point" numeric(4, 2),
	"source" varchar(80) DEFAULT 'MANUAL' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_id" integer,
	"evidence_id" integer,
	"model" varchar(80) NOT NULL,
	"model_version" varchar(40) NOT NULL,
	"prompt_version" varchar(40) NOT NULL,
	"analysis_type" varchar(60) NOT NULL,
	"input_hash" varchar(64) NOT NULL,
	"output_json" jsonb NOT NULL,
	"confidence" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" integer,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"target_role" varchar(160) NOT NULL,
	"match_score" integer NOT NULL,
	"missing_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"name" varchar(240) NOT NULL,
	"issuer" varchar(200) NOT NULL,
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"credential_id" varchar(200),
	"credential_url" text,
	"document_url" text,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"institution_code" varchar(64),
	"university" varchar(255),
	"address" text,
	"state" varchar(100),
	"country" varchar(100),
	"website" varchar(255),
	"contact_email" varchar(320),
	"placement_officer" varchar(160),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "college_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"recruiter_id" integer,
	"scope" varchar(80) DEFAULT 'RECRUITER_DISCOVERY' NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"document_type" varchar(60) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"processing_status" "processing_status" DEFAULT 'UPLOADED' NOT NULL,
	"ocr_status" "ocr_status" DEFAULT 'PENDING' NOT NULL,
	"extracted_text" text,
	"extracted_data" jsonb,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"type" "evidence_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text,
	"source" varchar(120) NOT NULL,
	"source_url" text,
	"document_url" text,
	"extracted_text" text,
	"extracted_metadata" jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"ai_analysis_status" "ai_status" DEFAULT 'NOT_REQUESTED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extracted_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_value" text NOT NULL,
	"confidence" numeric(5, 2) DEFAULT '0.90' NOT NULL,
	"source" varchar(80) DEFAULT 'PaddleOCR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"company" varchar(240) NOT NULL,
	"role" varchar(160) NOT NULL,
	"description" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"document_url" text,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"status" "application_status" DEFAULT 'APPLIED' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(160) NOT NULL,
	"employment_type" varchar(60) DEFAULT 'FULL_TIME' NOT NULL,
	"experience_level" varchar(60) DEFAULT 'ENTRY_LEVEL' NOT NULL,
	"required_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"salary_range" varchar(100),
	"min_readiness" integer DEFAULT 0 NOT NULL,
	"application_deadline" timestamp,
	"status" "job_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(60) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" "professional_provider" NOT NULL,
	"profile_url" varchar(500) NOT NULL,
	"username" varchar(120),
	"provider_user_id" varchar(120),
	"verified" boolean DEFAULT false NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_synced" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"role" varchar(160),
	"start_date" timestamp,
	"end_date" timestamp,
	"repository_url" text,
	"live_url" text,
	"documentation_url" text,
	"status" varchar(40) DEFAULT 'COMPLETED' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"technical_score" integer NOT NULL,
	"communication_score" integer NOT NULL,
	"problem_solving_score" integer NOT NULL,
	"role_alignment_score" integer NOT NULL,
	"evidence_strength_score" integer NOT NULL,
	"academic_score" integer NOT NULL,
	"project_score" integer NOT NULL,
	"experience_score" integer NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"model" varchar(80) NOT NULL,
	"explanation" text,
	"factors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"company_website" varchar(255),
	"designation" varchar(160),
	"industry" varchar(160),
	"company_email" varchar(320),
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recruiter_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "recruiter_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"search_params" jsonb NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" varchar(80) NOT NULL,
	"description" text,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"student_id" varchar(64),
	"college_id" integer,
	"college" varchar(255),
	"department" varchar(160),
	"program" varchar(160),
	"course" varchar(160),
	"semester" integer,
	"graduation_year" integer,
	"cgpa" numeric(4, 2),
	"bio" text,
	"location" varchar(160),
	"target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"career_interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profile_completion" integer DEFAULT 0 NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"readiness_updated_at" timestamp,
	"recruiter_visibility" "recruiter_visibility" DEFAULT 'CONSENTED' NOT NULL,
	"privacy_settings" jsonb DEFAULT '{"recruiters":true,"linkedin":true,"github":true,"resume":true,"academicDocs":true}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "student_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"proficiency" varchar(40) DEFAULT 'INTERMEDIATE' NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '0.80' NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"source" varchar(80) DEFAULT 'SELF_REPORTED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'STUDENT' NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"phone" varchar(30),
	"avatar_url" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" varchar(255),
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"source" varchar(80) NOT NULL,
	"value" text NOT NULL,
	"status" "cross_verification_status" DEFAULT 'CONSISTENT' NOT NULL,
	"confidence" numeric(5, 2) DEFAULT '0.90' NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_records" ADD CONSTRAINT "academic_records_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_profiles" ADD CONSTRAINT "college_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_data" ADD CONSTRAINT "extracted_data_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_searches" ADD CONSTRAINT "recruiter_searches_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;