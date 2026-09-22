import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb, schema, findUserByEmail, findUserById, createUser, getStudentProfileByUserId, getCollegeProfileByUserId, getRecruiterProfileByUserId } from "../db";
import { hashPassword, verifyPassword, createSessionToken } from "../services/auth/authService";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { logAudit } from "../services/audit/auditService";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email/emailService";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export const authRouter = router({
  // 1. Current Session
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    let profile: any = null;
    if (ctx.user.role === "STUDENT") {
      profile = await getStudentProfileByUserId(ctx.user.id);
    } else if (ctx.user.role === "COLLEGE_ADMIN") {
      profile = await getCollegeProfileByUserId(ctx.user.id);
    } else if (ctx.user.role === "RECRUITER") {
      profile = await getRecruiterProfileByUserId(ctx.user.id);
    }

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        role: ctx.user.role,
        firstName: ctx.user.firstName,
        lastName: ctx.user.lastName,
        phone: ctx.user.phone,
        avatarUrl: ctx.user.avatarUrl,
        isEmailVerified: ctx.user.isEmailVerified,
      },
      profile,
    };
  }),

  // 2. Register
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please provide a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["STUDENT", "COLLEGE_ADMIN", "RECRUITER"]),
        fullName: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        // Student specific fields
        college: z.string().optional(),
        studentId: z.string().optional(),
        course: z.string().optional(),
        graduationYear: z.number().optional(),
        department: z.string().optional(),
        targetRole: z.string().optional(),
        // College specific fields
        collegeName: z.string().optional(),
        collegeId: z.string().optional(),
        contactPerson: z.string().optional(),
        institutionName: z.string().optional(),
        // Recruiter specific fields
        recruiterName: z.string().optional(),
        company: z.string().optional(),
        companyName: z.string().optional(),
        designation: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const email = input.email.toLowerCase().trim();
      const existingUser = await findUserByEmail(email);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email address is already registered. Please log in.",
        });
      }

      // Resolve first and last name
      let firstName = input.firstName?.trim() || "";
      let lastName = input.lastName?.trim() || "";
      const fullName = input.fullName || input.contactPerson || input.recruiterName;
      if ((!firstName || !lastName) && fullName) {
        const parts = fullName.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
      if (!firstName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A contact name is required." });
      }

      if (input.role === "COLLEGE_ADMIN" && !(input.collegeName || input.institutionName)?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "College name is required." });
      }
      if (input.role === "RECRUITER" && !(input.company || input.companyName)?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Company name is required." });
      }

      const passwordHash = await hashPassword(input.password);
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");

      const [newUser] = await db
        .insert(schema.users)
        .values({
          email,
          passwordHash,
          role: input.role,
          firstName,
          lastName,
          phone: input.phone,
          isEmailVerified: false,
          emailVerificationToken,
        })
        .returning();

      // Automatically create matching profile record with role-specific fields
      if (input.role === "STUDENT") {
        await db.insert(schema.studentProfiles).values({
          userId: newUser.id,
          studentId: input.studentId,
          college: input.college,
          course: input.course,
          department: input.department || input.course || null,
          program: input.course || null,
          graduationYear: input.graduationYear || null,
          targetRoles: input.targetRole ? [input.targetRole] : [],
          profileCompletion: 0,
          readinessScore: 0,
        });
      } else if (input.role === "COLLEGE_ADMIN") {
        await db.insert(schema.collegeProfiles).values({
          userId: newUser.id,
          collegeName: (input.collegeName || input.institutionName)!.trim(),
          institutionCode: input.collegeId,
          placementOfficer: fullName || `${firstName} ${lastName}`,
          contactEmail: email,
        });
      } else if (input.role === "RECRUITER") {
        await db.insert(schema.recruiterProfiles).values({
          userId: newUser.id,
          companyName: (input.company || input.companyName)!.trim(),
          companyEmail: email,
          designation: input.designation || null,
          verificationStatus: "PENDING",
        });
      }

      // Generate Session Token & Set Cookies
      const token = await createSessionToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      ctx.res.cookie("career_os_session", token, cookieOptions);
      ctx.res.cookie("vantage_session", token, cookieOptions);

      sendVerificationEmail(newUser.email, emailVerificationToken).catch(() => {});
      logAudit(newUser.id, "USER_REGISTERED", "users", newUser.id, { role: input.role }, ctx.req.ip);

      return {
        success: true,
        // Returned only to the calling client; the browser session still uses
        // the HTTP-only cookie and the UI never persists this value.
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      };
    }),

  // 3. Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().optional(),
        identifier: z.string().optional(),
        password: z.string().min(1, "Password is required"),
        role: z.enum(["STUDENT", "COLLEGE_ADMIN", "RECRUITER"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const rawIdentifier = (input.identifier || input.email || "").trim();

      if (!rawIdentifier) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide an email or identification number.",
        });
      }

      let user: any = null;

      if (rawIdentifier.includes("@")) {
        user = await findUserByEmail(rawIdentifier);
      } else {
        // Look up by Student ID in student_profiles
        const [studentProfile] = await db
          .select()
          .from(schema.studentProfiles)
          .where(eq(schema.studentProfiles.studentId, rawIdentifier))
          .limit(1);

        if (studentProfile) {
          user = await findUserById(studentProfile.userId);
        } else {
          // Look up by College ID in college_profiles
          const [collegeProfile] = await db
            .select()
            .from(schema.collegeProfiles)
            .where(eq(schema.collegeProfiles.institutionCode, rawIdentifier))
            .limit(1);

          if (collegeProfile) {
            user = await findUserById(collegeProfile.userId);
          }
        }
      }

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with these credentials. Please check spelling or register.",
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account has been deactivated. Please contact support.",
        });
      }

      const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        logAudit(user.id, "LOGIN_FAILED", "users", user.id, { reason: "wrong_password" }, ctx.req.ip);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect email or password.",
        });
      }

      // Update lastLoginAt
      await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

      const token = await createSessionToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      ctx.res.cookie("career_os_session", token, cookieOptions);
      ctx.res.cookie("vantage_session", token, cookieOptions);

      logAudit(user.id, "LOGIN_SUCCESS", "users", user.id, {}, ctx.req.ip);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }),

  // 4. Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
    ctx.res.clearCookie("career_os_session", cookieOptions);
    ctx.res.clearCookie("vantage_session", cookieOptions);

    if (ctx.user) {
      logAudit(ctx.user.id, "LOGOUT", "users", ctx.user.id, {}, ctx.req.ip);
    }

    return { success: true };
  }),

  // 5. Request Password Reset
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const user = await findUserByEmail(input.email);
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour
        await db.update(schema.users).set({
          passwordResetToken: token,
          passwordResetExpires: expires,
        }).where(eq(schema.users.id, user.id));

        sendPasswordResetEmail(user.email, token).catch(() => {});
      }
      return { success: true, message: "If an account exists, a reset link has been dispatched." };
    }),

  // 6. Reset Password
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.passwordResetToken, input.token))
        .limit(1);

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Password reset link is invalid or has expired.",
        });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await db.update(schema.users).set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      }).where(eq(schema.users.id, user.id));

      logAudit(user.id, "PASSWORD_RESET_SUCCESS", "users", user.id);
      return { success: true, message: "Password updated successfully. You can now log in." };
    }),
});
