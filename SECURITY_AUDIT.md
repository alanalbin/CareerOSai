# Security Architecture & Audit Report

**Platform**: Vantage — Career Readiness Intelligence Platform  
**Target Standard**: Production Enterprise / Institutional Grade  
**Scope**: Authentication, Authorization, Privacy Sovereignty, Input Sanitization, File Ingestion, and AI Governance  

---

## 🛡️ 1. Authentication & Session Security

### Findings & Implementation Details
- **Password Hashing**: Passwords are saved strictly as bcrypt hashes utilizing a salt factor of `10` (`server/services/auth/authService.ts`). Raw passwords never enter database tables or log files.
- **Session Tokens**: Implemented with standard cryptographic Jose JWT signed using `HS256` with a minimum 256-bit server secret key (`JWT_SECRET`).
- **Token Storage & Transport**:
  - Transported in `httpOnly`, `secure` (in production), and `SameSite=Lax` cookies.
  - Also supported via standard `Authorization: Bearer <token>` headers for automated clients or mobile API consumption.
- **Session Revocation**:
  - Active session records are stored in the database `sessions` table.
  - On logout (`auth.logout`), the session token is explicitly deleted from the database and the client cookie is cleared, neutralizing stolen or replay tokens immediately.

---

## 🔒 2. Authorization & Role-Based Access Control (RBAC)

### Access Control Matrix
| Feature / Route | Public | Student | College Admin | Recruiter | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Marketing & Sign In | ✅ | ✅ | ✅ | ✅ | ✅ |
| Student Dashboard & Records | ❌ | ✅ (Self) | ✅ (Enrolled) | ❌ | ✅ |
| Upload Evidence & Projects | ❌ | ✅ (Self) | ❌ | ❌ | ✅ |
| Audit / Verify Student Evidence | ❌ | ❌ | ✅ | ❌ | ✅ |
| Institutional Roster & Heatmaps | ❌ | ❌ | ✅ | ❌ | ✅ |
| Job Requisitions Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Privacy-Filtered Candidate Search | ❌ | ❌ | ❌ | ✅ (Consented) | ✅ |

### Enforcement Mechanism
RBAC is enforced on every backend mutation and query using specialized tRPC middleware procedures (`server/_core/trpc.ts`):
- `protectedProcedure`: Verifies active session token.
- `studentProcedure`: Enforces `ctx.user.role === 'STUDENT'`.
- `collegeProcedure`: Enforces `ctx.user.role === 'COLLEGE_ADMIN' || ctx.user.role === 'SUPER_ADMIN'`.
- `recruiterProcedure`: Enforces `ctx.user.role === 'RECRUITER' || ctx.user.role === 'SUPER_ADMIN'`.

---

## 👤 3. Student Data Sovereignty & Recruiter Privacy

### Privacy Architecture
- **Consent-Gated Discovery**: Students possess direct authority over their recruiter visibility via `recruiterVisibility` in `student_profiles`:
  - `CONSENTED`: Profile visible in recruiter candidate discovery.
  - `PRIVATE`: Profile completely excluded from all recruiter search results.
- **Data Redaction**:
  - The recruiter search procedure (`server/routers/recruiter.ts`) explicitly queries and returns only candidates with `CONSENTED` or `PUBLIC` visibility.
  - Sensitive student data (personal email, phone number, physical home address, raw grade transcripts) are **omitted by design** from candidate discovery models. Recruiters receive only verified competency lists, institutional affiliation, target roles, and readiness scores.

---

## 🗄️ 4. Injection Defense & Input Validation

- **SQL Injection**: Vantage strictly utilizes **Drizzle ORM** with parameterized queries across both PostgreSQL and PGlite. No raw user string concatenations are used in database operations.
- **Input Validation**: All incoming tRPC requests are validated using strict **Zod** schemas defining expected types, regex constraints, and length limits.
- **Path Traversal Defense**:
  - Uploaded files are renamed using cryptographic `UUIDv4` identifiers.
  - The storage service (`server/services/storage/storageService.ts`) validates that all resolved file paths strictly remain within the canonical upload root directory (`path.resolve(UPLOAD_DIR)`), rejecting any paths containing `../` or arbitrary system paths.

---

## 📄 5. Document Ingestion & File Security

- **MIME Whitelisting**: Supported file types are strictly restricted to:
  - `application/pdf`
  - `image/png`
  - `image/jpeg`
  - `image/webp`
- **File Size Quotas**: Default maximum upload size is capped at 25MB per file to mitigate Denial of Service (DoS) and memory exhaustion attacks.
- **Execution Prevention**: The upload directory is isolated and served exclusively via a controlled storage proxy endpoint (`/api/documents/file/:filename`) that strictly streams binary content without executing server-side scripts.

---

## 🤖 6. AI Safety & Governance (Qwen3 & OCR)

- **Prompt Injection Defense**: All user-submitted text injected into Qwen3 prompts is sanitized and wrapped in demarcated JSON payloads.
- **Structured Outputs**: Prompts mandate JSON format responses adhering to strict TypeScript schemas (`qwen3.ts`), eliminating hallucinated shell code or arbitrary instructions.
- **Human-in-the-Loop Review**: All AI inferences are logged into `ai_analysis` with status `PENDING_REVIEW`. Critical educational or employment credentials require administrative or student confirmation before mutating primary profile states.

---

## 📜 7. Audit Logging & Compliance

All sensitive actions trigger synchronous writes to the `audit_logs` table (`server/services/audit/auditService.ts`):
- User authentication events (login, logout, password change).
- Profile modifications and recruiter consent updates.
- Document uploads and OCR processing outcomes.
- College staff verification actions (evidence approval and rejection with audit reasoning).
- Job requisition creation and candidate status updates.
