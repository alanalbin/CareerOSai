# Vantage — Career Readiness Intelligence Platform

> **Vantage** is an institutional-grade, AI-powered Career Readiness Intelligence Platform designed for higher education institutions, students, and enterprise recruiters. It unifies document intelligence, deterministic skill auditing, continuous verification, and privacy-first talent discovery into a single cohesive system.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Role Portals
- **Student Portal**:
  - Profile completion, semester-by-semester academic record tracking, and verified projects portfolio.
  - Multi-document upload (transcripts, certificates, resumes, portfolio PDFs) with automated OCR text extraction.
  - Skill confirmation and AI-driven skill-gap analysis.
  - Granular recruiter visibility toggle (`CONSENTED` vs `PRIVATE`), giving students total authority over who can discover their profiles.
- **College Administration Portal**:
  - Institutional cohort overview with placement readiness trends and departmental CGPA averages.
  - Verification queue for auditing student credentials, capstones, and certificates with single-click approval/rejection workflows.
  - Departmental skill heatmap aggregated directly from verified student artifacts.
  - Full institutional student roster with real-time career readiness indexing.
- **Enterprise Recruiter Portal**:
  - Role requisition management (job postings with required skillsets and minimum readiness scores).
  - Search & discovery engine strictly filtered to students who have granted active consent.
  - Privacy guardrail: Private contact information and raw grade transcripts are automatically redacted from recruiter candidate previews.
  - Candidate shortlisting and role-fit evaluation.

### 2. Document Processing & Intelligence (PaddleOCR)
- Standalone Python FastAPI microservice utilizing **PaddleOCR** for multilingual, rotated, and tabular text extraction.
- Resilient Node.js OCR dispatcher with automatic failover to local fallback parsers for development resilience.
- Document lifecycle tracking (`PENDING` ➔ `PROCESSING` ➔ `COMPLETED` / `FAILED`) preserving all original uploads in immutable storage.

### 3. AI Analysis Layer (Qwen3)
- Direct integration with **Qwen3** via OpenAI-compatible endpoints (`dashscope` or custom gateway).
- Structured prompt engineering with JSON Schema constraints for:
  - Resume & certificate entity extraction (skills, GPA, degrees, certifications).
  - Project complexity and tech stack evaluation.
  - Candidate-to-job requisition matching and skill-gap recommendations.
- **Review-First Architecture**: All AI extractions are persisted in the `ai_analysis` audit table, allowing institutional administrators and students to inspect, review, and confirm findings before applying them to official records.

### 4. Deterministic Career Readiness Engine
- Avoids arbitrary or synthetic scores.
- Mathematical composite index (0–100) calculated from 4 transparent pillars:
  - **Academic Performance (25%)**: Cumulative GPA normalized across completed semesters.
  - **Verified Project Portfolio (30%)**: Number, tech stack depth, and institutional approval of completed projects.
  - **Evidence & Document Verification (25%)**: Proportion of uploaded credentials verified by college staff.
  - **Platform Skills Depth (20%)**: Count and proficiency ratings of verified competencies.

### 5. Dual-Engine PostgreSQL Database (Drizzle ORM)
- **Zero-Config Local Run**: Integrated persistent `@electric-sql/pglite` engine storing data locally in `./data/vantage_pg`. Developers can clone and run the full database-backed system immediately without installing external database software.
- **Enterprise Production Run**: Seamlessly switches to standard PostgreSQL connection pool when `DATABASE_URL` is set in the environment.
- 21 comprehensive relational tables covering users, sessions, profiles, academic records, evidence, reviews, jobs, skills, audit logs, and analytics.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **pnpm** (or npm)
- *(Optional)* Python 3.10+ (if running the standalone PaddleOCR microservice)

### Installation
```bash
# 1. Clone repository and install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start development server
# Automatically initializes local PostgreSQL schema and seeds normalized platform skills
npm run dev
```

The application will be accessible at: `http://localhost:3000`

---

## 🛠️ Testing & Quality Assurance

Run the automated test suite covering authentication, session lifecycle, deterministic scoring, recruiter privacy consent, and OCR fallback pipelines:

```bash
# Run unit & integration test suites
npx vitest run

# Run TypeScript type verification
npm run check

# Build production bundle (client assets + Node server bundle)
npm run build
```

---

## 📁 Repository Structure

```
career-readiness-platform/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── components/         # Shared UI components (Radix, Tailwind)
│   │   │   └── auth/           # Vantage AuthModal (Sign In / Register / Role Selector)
│   │   ├── pages/
│   │   │   ├── Home.tsx        # Vantage marketing & platform entry page
│   │   │   ├── Platform.tsx    # Live authenticated Student, College, & Recruiter portals
│   │   │   └── NotFound.tsx    # 404 handler
│   │   └── lib/trpc.ts         # Type-safe tRPC client hooks
├── server/                     # Express & tRPC backend
│   ├── _core/                  # Server bootstrap, JWT context, & storage proxy
│   ├── routers/                # tRPC API Routers
│   │   ├── auth.ts             # User registration, login, logout, password reset
│   │   ├── student.ts          # Student profile, academic records, evidence, consent
│   │   ├── college.ts          # College dashboard, verification queues, roster, heatmap
│   │   ├── recruiter.ts        # Requisitions, privacy-filtered candidate discovery
│   │   ├── documents.ts        # Multi-document upload & OCR lifecycle
│   │   └── ai.ts               # Qwen3 recommendations & project analysis
│   ├── services/               # Core business services
│   │   ├── ai/                 # Qwen3 integration & structured output parsing
│   │   ├── auth/               # Bcrypt password hashing & Jose JWT session manager
│   │   ├── ocr/                # OCR pipeline & microservice HTTP dispatcher
│   │   ├── scoring/            # Deterministic career readiness calculation engine
│   │   ├── storage/            # File storage & path traversal guardrails
│   │   └── audit/              # Comprehensive activity & compliance logging
│   └── db.ts                   # Hybrid PostgreSQL / PGlite database connector & DDL
├── drizzle/                    # Drizzle ORM schema definitions (21 PostgreSQL tables)
├── services/
│   └── ocr/python_service/     # Standalone FastAPI PaddleOCR microservice
└── docs/                       # Architectural documentation (Database, AI, OCR, Security)
```

---

## 🔒 Security & Privacy Commitments

1. **Strict RBAC**: Every tRPC procedure is guarded by role-specific middleware (`studentProcedure`, `collegeProcedure`, `recruiterProcedure`, `adminProcedure`).
2. **Student Data Sovereignty**: Candidates can set their discovery visibility to `PRIVATE` at any time, instantly removing their profile from recruiter searches.
3. **Data Masking**: Recruiter candidate searches automatically strip raw grade transcripts, personal phone numbers, and home addresses.
4. **File Protection**: Uploaded files undergo MIME type validation, file size limits (25MB default), and strict path sanitization to prevent path-traversal attacks.
5. **Session Safety**: JWT session tokens are signed with HMAC-SHA256, issued with `httpOnly`, `sameSite=lax` cookie protections, and enforced via an active database revocation check.

---

## 📄 License
Proprietary — Vantage Career Readiness Intelligence Platform.
#   C a r e e r O S a i  
 