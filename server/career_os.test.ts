import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Career OS — Complete Authentication & Role Isolation", () => {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@test.edu`;
  const collegeEmail = `admin_${timestamp}@engineering.edu`;
  const recruiterEmail = `recruiter_${timestamp}@techcorp.com`;
  const password = "ProductionSecurePassword123!";

  let studentUser: any = null;
  let collegeUser: any = null;
  let recruiterUser: any = null;

  const makeContext = (user: any = null): TrpcContext => ({
    user,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  });

  it("registers a student with student-specific academic fields", async () => {
    const caller = appRouter.createCaller(makeContext());
    const res = await caller.auth.register({
      role: "STUDENT",
      email: studentEmail,
      password,
      firstName: "Aarav",
      lastName: "Patel",
      phone: "+91-9876543210",
      college: "Institute of Technology",
      studentId: `STU_${timestamp}`,
      course: "Computer Science Engineering",
      graduationYear: 2026,
    });

    expect(res.user).toBeDefined();
    expect(res.user.role).toBe("STUDENT");
    expect(res.user.email).toBe(studentEmail);
    studentUser = res.user;
  });

  it("registers a college administrator with institutional credentials", async () => {
    const caller = appRouter.createCaller(makeContext());
    const res = await caller.auth.register({
      role: "COLLEGE_ADMIN",
      email: collegeEmail,
      password,
      firstName: "Dr. Sarah",
      lastName: "Jenkins",
      phone: "+1-555-0199",
      collegeName: "Apex University",
      collegeId: `COL_${timestamp}`,
      contactPerson: "Dr. Sarah Jenkins",
    });

    expect(res.user).toBeDefined();
    expect(res.user.role).toBe("COLLEGE_ADMIN");
    collegeUser = res.user;
  });

  it("registers a recruiter with corporate designation", async () => {
    const caller = appRouter.createCaller(makeContext());
    const res = await caller.auth.register({
      role: "RECRUITER",
      email: recruiterEmail,
      password,
      firstName: "Marcus",
      lastName: "Vance",
      companyName: "HyperScale Tech",
      designation: "Lead Technical Recruiter",
    });

    expect(res.user).toBeDefined();
    expect(res.user.role).toBe("RECRUITER");
    recruiterUser = res.user;
  });

  it("authenticates student via email and verifies role", async () => {
    const caller = appRouter.createCaller(makeContext());
    const res = await caller.auth.login({
      email: studentEmail,
      password,
      role: "STUDENT",
    });

    expect(res.user.id).toBe(studentUser.id);
    expect(res.user.role).toBe("STUDENT");
    expect(res.token).toBeDefined();
  });

  it("authenticates student via Student ID", async () => {
    const caller = appRouter.createCaller(makeContext());
    const res = await caller.auth.login({
      email: `STU_${timestamp}`, // login supports studentId in the email/identifier field
      password,
      role: "STUDENT",
    });

    expect(res.user.id).toBe(studentUser.id);
    expect(res.user.role).toBe("STUDENT");
  });

  it("rejects login with incorrect password", async () => {
    const caller = appRouter.createCaller(makeContext());
    await expect(
      caller.auth.login({
        email: studentEmail,
        password: "WrongPassword!999",
      })
    ).rejects.toThrow("Incorrect email or password");
  });

  it("prevents duplicate registration with the same email", async () => {
    const caller = appRouter.createCaller(makeContext());
    await expect(
      caller.auth.register({
        role: "STUDENT",
        email: studentEmail,
        password,
        firstName: "Duplicate",
        lastName: "User",
      })
    ).rejects.toThrow("already registered");
  });
});

describe("Career OS — Role-Based Authorization Enforcement", () => {
  const studentUser = {
    id: 1001,
    email: "student_auth@test.edu",
    role: "STUDENT" as const,
    firstName: "Student",
    lastName: "Tester",
    phone: null,
    avatarUrl: null,
    isEmailVerified: true,
  };

  const recruiterUser = {
    id: 1002,
    email: "recruiter_auth@test.com",
    role: "RECRUITER" as const,
    firstName: "Recruiter",
    lastName: "Tester",
    phone: null,
    avatarUrl: null,
    isEmailVerified: true,
  };

  const makeContext = (user: any): TrpcContext => ({
    user,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  });

  it("blocks student from accessing college institutional overview", async () => {
    const caller = appRouter.createCaller(makeContext(studentUser));
    await expect(caller.college.getOverview()).rejects.toThrow("Institutional administrator access required");
  });

  it("blocks student from accessing recruiter candidate search", async () => {
    const caller = appRouter.createCaller(makeContext(studentUser));
    await expect(caller.recruiter.getCandidates()).rejects.toThrow("Recruiter access required");
  });

  it("blocks recruiter from accessing college student roster", async () => {
    const caller = appRouter.createCaller(makeContext(recruiterUser));
    await expect(caller.college.getStudents()).rejects.toThrow("Institutional administrator access required");
  });
});

describe("Career OS — Professional Profiles & Cross-Source Verification", () => {
  it("manages privacy settings toggles", async () => {
    const timestamp = Date.now();
    const email = `privacy_${timestamp}@test.edu`;
    const makeContext = (user: any = null): TrpcContext => ({
      user,
      req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const regCaller = appRouter.createCaller(makeContext());
    const { user } = await regCaller.auth.register({
      role: "STUDENT",
      email,
      password: "TestPassword123!",
      firstName: "Privacy",
      lastName: "Student",
    });

    const studentCaller = appRouter.createCaller(makeContext(user));
    const initialSettings = await studentCaller.student.getPrivacySettings();
    expect(initialSettings).toBeDefined();

    const updated = await studentCaller.student.updatePrivacySettings({
      recruiters: false,
      linkedin: false,
      github: true,
      resume: true,
      academicDocs: false,
    });

    expect(updated.success).toBe(true);
    expect(updated.privacySettings.recruiters).toBe(false);
    expect(updated.privacySettings.linkedin).toBe(false);
  });

  it("generates cross-source verification matrix and resolves discrepancies", async () => {
    const timestamp = Date.now();
    const email = `verify_${timestamp}@test.edu`;
    const makeContext = (user: any = null): TrpcContext => ({
      user,
      req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const regCaller = appRouter.createCaller(makeContext());
    const { user } = await regCaller.auth.register({
      role: "STUDENT",
      email,
      password: "TestPassword123!",
      firstName: "Dev",
      lastName: "Verification",
      college: "Global Institute of Technology",
      graduationYear: 2026,
    });

    const studentCaller = appRouter.createCaller(makeContext(user));
    const matrixData = await studentCaller.verification.getMatrix();

    expect(matrixData.matrix).toBeDefined();
    expect(Array.isArray(matrixData.matrix)).toBe(true);

    // Verify Name field status calculation
    const nameRow = matrixData.matrix.find((r: any) => r.field === "Name");
    expect(nameRow).toBeDefined();
    expect(nameRow?.careerOs).toContain("Dev Verification");

    // Test Human discrepancy review resolution
    const resolveRes = await studentCaller.verification.resolveDiscrepancy({
      fieldName: "Graduation Year",
      resolvedValue: "2026",
      reason: "Official verified degree certificate confirmed by student registry",
    });

    expect(resolveRes.success).toBe(true);
    expect(resolveRes.resolvedValue).toBe("2026");
  });
});
