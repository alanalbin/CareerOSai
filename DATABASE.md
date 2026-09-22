# Database Schema & Architecture Guide

**Platform**: Vantage — Career Readiness Intelligence Platform  
**ORM**: Drizzle ORM (`drizzle-orm/pg-core`)  
**Engines**: Dual Engine — PostgreSQL 15+ (Production) & PGlite (Local Zero-Config)  

---

## 🗄️ 1. Architecture & Dual-Engine Strategy

Vantage supports two database operation modes via a unified connection factory in `server/db.ts`:

1. **Local Persistent Mode (`@electric-sql/pglite`)**:
   - Stored in `./data/vantage_pg`.
   - Requires zero external database server installation.
   - Executes real PostgreSQL engine within the Node.js process using WebAssembly/C compiled Postgres.
2. **Production Mode (`pg.Pool`)**:
   - Activated automatically whenever `DATABASE_URL` is set in the environment.
   - Employs connection pooling for high-throughput enterprise scale.

---

## 📊 2. Entity Relationship Overview

The schema is defined across 21 relational tables in `drizzle/schema.ts`:

```
                       +-------------------+
                       |       users       |
                       +---------+---------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
+-----------------+     +-----------------+     +-----------------+
| student_profiles|     | college_profiles|     |recruiter_profiles|
+--------+--------+     +-----------------+     +--------+--------+
         |                                               |
         +------------------+                            v
         |                  |                     +--------------+
         v                  v                     |     jobs     |
+-----------------+  +--------------+             +-------+------+
| academic_records|  |   projects   |                     |
+-----------------+  +------+-------+                     v
                            |                     +-----------------+
                            v                     | job_applications|
                     +--------------+             +-----------------+
                     |   evidence   |
                     +------+-------+
                            |
                            v
                     +--------------+
                     |reviews/audits|
                     +--------------+
```

---

## 📋 3. Schema Catalog (21 Tables)

### Authentication & Identities
1. **`users`**: Master identity table storing email, bcrypt password hash, role (`STUDENT`, `COLLEGE_ADMIN`, `RECRUITER`, `SUPER_ADMIN`), verification state, and timestamps.
2. **`sessions`**: Active JWT session tokens with device metadata and expiration tracking.
3. **`password_resets`**: Secure single-use tokens for password recovery.
4. **`email_verifications`**: OTP codes for onboarding email confirmation.

### Profile Layer
5. **`student_profiles`**: Student metadata, CGPA, graduation year, target roles, readiness scores, and `recruiter_visibility` (`CONSENTED` vs `PRIVATE`).
6. **`college_profiles`**: Higher education institutions, departments, and accreditation status.
7. **`recruiter_profiles`**: Enterprise hiring companies, industries, and verification statuses.

### Academic & Project Evidence
8. **`academic_records`**: Semester-by-semester courses, credit hours, grades, and backlogs.
9. **`projects`**: Student engineering projects, GitHub repositories, live demo links, and tech stacks.
10. **`evidence`**: File uploads linked to projects, degrees, or certifications with verification status (`PENDING`, `VERIFIED`, `REJECTED`).
11. **`evidence_reviews`**: Institutional audit records documenting staff approval/rejection notes and criteria.

### Documents & OCR
12. **`documents`**: Document storage records tracking file path, MIME type, size, and OCR lifecycle (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
13. **`ocr_results`**: Extracted plain text, confidence scores, bounding boxes, and parsing engine metadata.

### Competency & Intelligence
14. **`skills`**: Normalized catalog of verified competencies and categories.
15. **`student_skills`**: Join table mapping students to verified skills, proficiency levels, and verification origins.
16. **`career_recommendations`**: Qwen3 AI role-fit analyses, missing skill gap lists, and action items.
17. **`readiness_history`**: Temporal tracking of Career Readiness Score changes over time for trajectory analytics.
18. **`ai_analysis`**: Audit log of all generative extractions and raw model outputs for institutional review.

### Enterprise Placement
19. **`jobs`**: Requisitions posted by verified recruiters with required skills and minimum readiness threshold.
20. **`job_applications`**: Candidate submissions, application stages, and recruiter ratings.
21. **`audit_logs`**: Immutable platform audit trail recording all administrative and security actions.

---

## ⚙️ 4. Multi-Statement DDL Initialization

Upon application startup, `initDatabase()` in `server/db.ts`:
1. Executes `CREATE TYPE` and `CREATE TABLE IF NOT EXISTS` for all 21 tables.
2. Creates foreign key constraints with `ON DELETE CASCADE` where applicable.
3. Seeds canonical skills (React, TypeScript, Python, Node.js, SQL, Machine Learning, Docker, AWS, etc.).
