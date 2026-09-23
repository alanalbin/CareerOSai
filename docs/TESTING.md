# Automated Testing & Quality Assurance Guide

**Platform**: Vantage — Career Readiness Intelligence Platform  
**Test Framework**: Vitest v2.1.9  
**Coverage Areas**: Authentication, Authorization, Privacy Consent, Scoring Algorithms, OCR Failover, and AI Ingestion  

---

## 🧪 1. Test Suite Architecture

Vantage ships with an automated test suite comprising 7 dedicated test specifications and 22 assertions:

| Test File | Test Cases | Objective |
| :--- | :---: | :--- |
| [`server/auth.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/auth.test.ts) | 5 | Validates user registration with password hashing, login token generation, role-specific profile provisioning (Student vs Recruiter vs College), duplicate email rejection, and invalid credential rejection. |
| [`server/auth.logout.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/auth.logout.test.ts) | 1 | Verifies active session invalidation in the database and HTTP session cookie clearance. |
| [`server/readiness.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/readiness.test.ts) | 3 | Verifies mathematical score computation (0-100) across 4 pillars, confirming higher scores for students with verified evidence and high CGPAs. |
| [`server/consent.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/consent.test.ts) | 2 | Verifies that candidate search strictly filters to students with `CONSENTED` visibility, excluding `PRIVATE` students and redacting raw transcripts. |
| [`server/platform.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/platform.test.ts) | 4 | Verifies student evidence submission, college admin verification approval/rejection workflows, and institutional roster population. |
| [`server/ocr.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/ocr.test.ts) | 4 | Tests document creation, mock OCR microservice response handling, fallback parser invocation, and graceful failure on missing files. |
| [`server/ai.test.ts`](file:///c:/Users/User/Downloads/career-readiness-platform/career-readiness-platform/server/ai.test.ts) | 3 | Tests Qwen3 structured entity extraction, project complexity grading, and persistence into the `ai_analysis` review log. |

---

## 🏃 2. Executing Tests

### Run All Test Suites
```bash
npx vitest run
```

### Run Tests in Watch Mode (During Development)
```bash
npx vitest
```

### Run a Specific Test Suite
```bash
npx vitest run server/readiness.test.ts
```

---

## 🔍 3. Type Checking & Production Validation

Ensure complete TypeScript type safety and production build readiness:

```bash
# TypeScript verification (no emission)
npm run check

# Full production build (Vite client + Node bundle)
npm run build
```

---

## ✍️ 4. Writing New Tests

When adding new domain features or API endpoints, follow the established Vitest patterns:
1. Import `describe`, `it`, `expect` from `vitest`.
2. Leverage the hybrid database connector in `server/db.ts` which automatically utilizes persistent PGlite during test runs without needing a running external PostgreSQL server.
3. Assert both positive paths and security edge cases (unauthorized access, invalid inputs, privacy boundaries).
