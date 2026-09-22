import { eq, desc, and, ilike, sql, inArray } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import path from "path";
import fs from "fs";

let _db: any = null;
let _rawClient: any = null;
let _initPromise: Promise<any> | null = null;

export async function getDb() {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl && dbUrl.startsWith("postgres")) {
      try {
        const { Pool } = await import("pg");
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const pool = new Pool({ connectionString: dbUrl });
        _rawClient = pool;
        _db = drizzle(pool, { schema });
        console.log("[Database] Connected to PostgreSQL via node-postgres");
      } catch (err) {
        console.warn("[Database] Failed to connect to PostgreSQL URL, falling back to PGlite:", err);
      }
    }

    if (!_db) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL is required in production. PGlite is intended for local development only.");
      }
      try {
        const dataDir = path.resolve(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const { PGlite } = await import("@electric-sql/pglite");
        const { drizzle } = await import("drizzle-orm/pglite");
        const pgliteDbPath = path.join(dataDir, "vantage_pg");
        const client = new PGlite(pgliteDbPath);
        _rawClient = client;
        _db = drizzle(client, { schema });
        console.log("[Database] Connected to local persistent PostgreSQL via PGlite:", pgliteDbPath);
      } catch (err) {
        console.error("[Database] Failed to initialize PGlite:", err);
        throw err;
      }
    }

    await ensureSchemaInitialized(_db);
    return _db;
  })();

  return _initPromise;
}

// SQL DDL to initialize all 21 tables in PostgreSQL/PGlite if not already present
async function ensureSchemaInitialized(db: any) {
  try {
    const ddl = `
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('STUDENT', 'COLLEGE_ADMIN', 'RECRUITER', 'SUPER_ADMIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE recruiter_visibility AS ENUM ('PRIVATE', 'COLLEGE_ONLY', 'CONSENTED', 'PUBLIC');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE evidence_type AS ENUM ('PROJECT', 'CERTIFICATE', 'INTERNSHIP', 'ACHIEVEMENT', 'ACADEMIC', 'DOCUMENT');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE ai_status AS ENUM ('NOT_REQUESTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE processing_status AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVIEW_REQUIRED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE ocr_status AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'NOT_APPLICABLE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE application_status AS ENUM ('APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE cross_verification_status AS ENUM ('VERIFIED', 'CONSISTENT', 'PARTIALLY_VERIFIED', 'MISMATCH', 'UNABLE_TO_VERIFY', 'NEEDS_REVIEW');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE professional_provider AS ENUM ('GITHUB', 'LINKEDIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(320) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role user_role DEFAULT 'STUDENT' NOT NULL,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        phone VARCHAR(30),
        avatar_url TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_login_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS college_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        college_name VARCHAR(255) NOT NULL,
        institution_code VARCHAR(64),
        university VARCHAR(255),
        address TEXT,
        state VARCHAR(100),
        country VARCHAR(100),
        website VARCHAR(255),
        contact_email VARCHAR(320),
        placement_officer VARCHAR(160),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recruiter_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        company_website VARCHAR(255),
        designation VARCHAR(160),
        industry VARCHAR(160),
        company_email VARCHAR(320),
        verification_status verification_status DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        student_id VARCHAR(64),
        college_id INTEGER,
        college VARCHAR(255),
        department VARCHAR(160),
        program VARCHAR(160),
        course VARCHAR(160),
        semester INTEGER,
        graduation_year INTEGER,
        cgpa NUMERIC(4, 2),
        bio TEXT,
        location VARCHAR(160),
        target_roles JSONB DEFAULT '[]'::jsonb NOT NULL,
        career_interests JSONB DEFAULT '[]'::jsonb NOT NULL,
        profile_completion INTEGER DEFAULT 0 NOT NULL,
        readiness_score INTEGER DEFAULT 0 NOT NULL,
        readiness_updated_at TIMESTAMP,
        recruiter_visibility recruiter_visibility DEFAULT 'CONSENTED' NOT NULL,
        privacy_settings JSONB DEFAULT '{"recruiters": true, "linkedin": true, "github": true, "resume": true, "academicDocs": true}'::jsonb NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS academic_records (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        semester INTEGER NOT NULL,
        subject VARCHAR(200) NOT NULL,
        subject_code VARCHAR(40),
        credits NUMERIC(3, 1),
        marks NUMERIC(5, 2),
        grade VARCHAR(10),
        grade_point NUMERIC(4, 2),
        source VARCHAR(80) DEFAULT 'MANUAL' NOT NULL,
        verified BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL UNIQUE,
        category VARCHAR(80) NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS student_skills (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        proficiency VARCHAR(40) DEFAULT 'INTERMEDIATE' NOT NULL,
        confidence NUMERIC(3, 2) DEFAULT 0.80 NOT NULL,
        evidence_count INTEGER DEFAULT 0 NOT NULL,
        verified BOOLEAN DEFAULT FALSE NOT NULL,
        source VARCHAR(80) DEFAULT 'SELF_REPORTED' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        title VARCHAR(240) NOT NULL,
        description TEXT NOT NULL,
        technologies JSONB DEFAULT '[]'::jsonb NOT NULL,
        role VARCHAR(160),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        repository_url TEXT,
        live_url TEXT,
        documentation_url TEXT,
        status VARCHAR(40) DEFAULT 'COMPLETED' NOT NULL,
        verification_status verification_status DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        name VARCHAR(240) NOT NULL,
        issuer VARCHAR(200) NOT NULL,
        issue_date TIMESTAMP,
        expiry_date TIMESTAMP,
        credential_id VARCHAR(200),
        credential_url TEXT,
        document_url TEXT,
        verification_status verification_status DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS internships (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        company VARCHAR(240) NOT NULL,
        role VARCHAR(160) NOT NULL,
        description TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        skills JSONB DEFAULT '[]'::jsonb NOT NULL,
        document_url TEXT,
        verification_status verification_status DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evidence (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        type evidence_type NOT NULL,
        title VARCHAR(240) NOT NULL,
        description TEXT,
        source VARCHAR(120) NOT NULL,
        source_url TEXT,
        document_url TEXT,
        extracted_text TEXT,
        extracted_metadata JSONB,
        skills JSONB DEFAULT '[]'::jsonb NOT NULL,
        verification_status verification_status DEFAULT 'PENDING' NOT NULL,
        ai_analysis_status ai_status DEFAULT 'NOT_REQUESTED' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(60) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        processing_status processing_status DEFAULT 'UPLOADED' NOT NULL,
        ocr_status ocr_status DEFAULT 'PENDING' NOT NULL,
        extracted_text TEXT,
        extracted_data JSONB,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
        processed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
        evidence_id INTEGER REFERENCES evidence(id) ON DELETE SET NULL,
        model VARCHAR(80) NOT NULL,
        model_version VARCHAR(40) NOT NULL,
        prompt_version VARCHAR(40) NOT NULL,
        analysis_type VARCHAR(60) NOT NULL,
        input_hash VARCHAR(64) NOT NULL,
        output_json JSONB NOT NULL,
        confidence NUMERIC(3, 2),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS readiness_assessments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        overall_score INTEGER NOT NULL,
        technical_score INTEGER NOT NULL,
        communication_score INTEGER NOT NULL,
        problem_solving_score INTEGER NOT NULL,
        role_alignment_score INTEGER NOT NULL,
        evidence_strength_score INTEGER NOT NULL,
        academic_score INTEGER NOT NULL,
        project_score INTEGER NOT NULL,
        experience_score INTEGER NOT NULL,
        confidence NUMERIC(3, 2) NOT NULL,
        model VARCHAR(80) NOT NULL,
        explanation TEXT,
        factors JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS career_recommendations (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        target_role VARCHAR(160) NOT NULL,
        match_score INTEGER NOT NULL,
        missing_skills JSONB DEFAULT '[]'::jsonb NOT NULL,
        recommended_actions JSONB DEFAULT '[]'::jsonb NOT NULL,
        reasoning TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        recruiter_id INTEGER NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(160) NOT NULL,
        employment_type VARCHAR(60) DEFAULT 'FULL_TIME' NOT NULL,
        experience_level VARCHAR(60) DEFAULT 'ENTRY_LEVEL' NOT NULL,
        required_skills JSONB DEFAULT '[]'::jsonb NOT NULL,
        preferred_skills JSONB DEFAULT '[]'::jsonb NOT NULL,
        salary_range VARCHAR(100),
        min_readiness INTEGER DEFAULT 0 NOT NULL,
        application_deadline TIMESTAMP,
        status job_status DEFAULT 'OPEN' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        status application_status DEFAULT 'APPLIED' NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recruiter_searches (
        id SERIAL PRIMARY KEY,
        recruiter_id INTEGER NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
        search_params JSONB NOT NULL,
        result_count INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS consent_records (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        recruiter_id INTEGER REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
        scope VARCHAR(80) DEFAULT 'RECRUITER_DISCOVERY' NOT NULL,
        granted BOOLEAN DEFAULT TRUE NOT NULL,
        granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        revoked_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(60) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(80) NOT NULL,
        entity_id INTEGER,
        metadata JSONB,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS extracted_data (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        field_name VARCHAR(100) NOT NULL,
        field_value TEXT NOT NULL,
        confidence NUMERIC(5, 2) DEFAULT 0.90 NOT NULL,
        source VARCHAR(80) DEFAULT 'PaddleOCR' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verification_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        field_name VARCHAR(100) NOT NULL,
        source VARCHAR(80) NOT NULL,
        value TEXT NOT NULL,
        status cross_verification_status DEFAULT 'CONSISTENT' NOT NULL,
        confidence NUMERIC(5, 2) DEFAULT 0.90 NOT NULL,
        checked_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS professional_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider professional_provider NOT NULL,
        profile_url VARCHAR(500) NOT NULL,
        username VARCHAR(120),
        provider_user_id VARCHAR(120),
        verified BOOLEAN DEFAULT FALSE NOT NULL,
        connected_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_synced TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL
      );

      ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS college VARCHAR(255);
      ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS course VARCHAR(160);
      ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"recruiters": true, "linkedin": true, "github": true, "resume": true, "academicDocs": true}'::jsonb;
    `;

    if (_rawClient && typeof _rawClient.exec === "function") {
      await _rawClient.exec(ddl);
    } else if (_rawClient && typeof _rawClient.query === "function") {
      await _rawClient.query(ddl);
    } else {
      await db.execute(sql.raw(ddl));
    }

    // A development convenience only. Production must not generate business
    // data that has not been supplied or approved by an administrator.
    if (process.env.NODE_ENV === "production") return;

    // Seed standard skills if skills table is empty
    const existingSkills = await db.select().from(schema.skills).limit(1);
    if (existingSkills.length === 0) {
      console.log("[Database] Seeding standard normalized platform skills...");
      const standardSkills = [
        { name: "Python", category: "TECHNICAL", description: "Core programming, backend services, scripting" },
        { name: "React", category: "FRAMEWORK", description: "Component-based web client development" },
        { name: "TypeScript", category: "TECHNICAL", description: "Statically typed JavaScript" },
        { name: "Node.js", category: "TECHNICAL", description: "Server-side JavaScript runtime" },
        { name: "FastAPI", category: "FRAMEWORK", description: "High-performance Python API framework" },
        { name: "SQL", category: "TECHNICAL", description: "Relational querying and schema design" },
        { name: "PostgreSQL", category: "TECHNICAL", description: "Enterprise relational database system" },
        { name: "AWS", category: "TOOL", description: "Cloud computing and managed services" },
        { name: "Docker", category: "TOOL", description: "Containerization and environment reproducibility" },
        { name: "OCR", category: "TECHNICAL", description: "Optical character recognition and document vision" },
        { name: "Machine Learning", category: "DOMAIN", description: "Statistical modeling, training, inference" },
        { name: "System Design", category: "DOMAIN", description: "Architectural modeling, scalability, reliability" },
        { name: "Testing & QA", category: "TECHNICAL", description: "Automated unit, integration, and e2e testing" },
        { name: "Analytics", category: "DOMAIN", description: "Data aggregation, metrics, and KPI tracking" },
        { name: "Communication", category: "SOFT_SKILL", description: "Technical articulation and stakeholder reporting" },
        { name: "Leadership", category: "SOFT_SKILL", description: "Team coordination, ownership, mentorship" },
      ];
      await db.insert(schema.skills).values(standardSkills);
    }
  } catch (err) {
    console.error("[Database] Error during schema initialization:", err);
  }
}

// User Helpers
export async function findUserByEmail(email: string) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim())).limit(1);
  return user;
}

export async function findUserById(id: number) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return user;
}

export async function createUser(user: schema.InsertUser) {
  const db = await getDb();
  const [newUser] = await db.insert(schema.users).values({
    ...user,
    email: user.email.toLowerCase().trim(),
  }).returning();
  return newUser;
}

export async function getStudentProfileByUserId(userId: number) {
  const db = await getDb();
  const [profile] = await db.select().from(schema.studentProfiles).where(eq(schema.studentProfiles.userId, userId)).limit(1);
  return profile;
}

export async function getCollegeProfileByUserId(userId: number) {
  const db = await getDb();
  const [profile] = await db.select().from(schema.collegeProfiles).where(eq(schema.collegeProfiles.userId, userId)).limit(1);
  return profile;
}

export async function getRecruiterProfileByUserId(userId: number) {
  const db = await getDb();
  const [profile] = await db.select().from(schema.recruiterProfiles).where(eq(schema.recruiterProfiles.userId, userId)).limit(1);
  return profile;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, openId)).limit(1);
  return user || null;
}

export async function upsertUser(data: { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: Date }) {
  const db = await getDb();
  if (data.email) {
    const existing = await findUserByEmail(data.email);
    if (existing) {
      const [updated] = await db.update(schema.users).set({ lastLoginAt: data.lastSignedIn || new Date() }).where(eq(schema.users.id, existing.id)).returning();
      return updated;
    }
  }
  return null;
}

export async function getProfessionalProfilesByUserId(userId: number) {
  const db = await getDb();
  return db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.userId, userId));
}

export async function upsertProfessionalProfile(data: schema.InsertProfessionalProfile) {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(schema.professionalProfiles)
    .where(and(eq(schema.professionalProfiles.userId, data.userId), eq(schema.professionalProfiles.provider, data.provider)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(schema.professionalProfiles)
      .set({
        profileUrl: data.profileUrl,
        username: data.username,
        providerUserId: data.providerUserId,
        verified: data.verified,
        lastSynced: new Date(),
        metadata: data.metadata,
      })
      .where(eq(schema.professionalProfiles.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(schema.professionalProfiles).values(data).returning();
  return inserted;
}

export async function getVerificationResultsByUserId(userId: number) {
  const db = await getDb();
  return db.select().from(schema.verificationResults).where(eq(schema.verificationResults.userId, userId));
}

export { schema };
