import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb, schema, getStudentProfileByUserId } from "../db";
import { saveDocument } from "../services/storage/storageService";
import { processDocumentOCR } from "../services/ocr/ocrService";
import { qwen3 } from "../services/ai/qwen3";
import { logAudit } from "../services/audit/auditService";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

export const documentsRouter = router({
  // 1. Upload & Process Document
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        mimeType: z.string(),
        fileBase64: z.string().min(1),
        documentType: z.enum(["RESUME", "CERTIFICATE", "TRANSCRIPT", "PROJECT_REPORT"]).default("RESUME"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found" });

      // Convert base64 to Buffer
      const buffer = Buffer.from(input.fileBase64.replace(/^data:.*?;base64,/, ""), "base64");

      // Save document to secure storage
      const savedFile = await saveDocument(buffer, input.fileName, input.mimeType);

      // Create document record in database
      const [doc] = await db
        .insert(schema.documents)
        .values({
          userId: ctx.user.id,
          documentType: input.documentType,
          fileName: input.fileName,
          filePath: savedFile.filePath,
          fileUrl: savedFile.fileUrl,
          mimeType: input.mimeType,
          fileSize: savedFile.fileSize,
          processingStatus: "UPLOADED",
          ocrStatus: "PENDING",
        })
        .returning();

      logAudit(ctx.user.id, "DOCUMENT_UPLOADED", "documents", doc.id, { fileName: input.fileName });

      // Trigger PaddleOCR pipeline
      const ocrResult = await processDocumentOCR(doc.id, savedFile.filePath, input.mimeType);

      // Trigger Qwen3 analysis if resume and text extracted
      let aiResult = null;
      if (ocrResult.success && ocrResult.extractedText && input.documentType === "RESUME") {
        aiResult = await qwen3.analyzeResume(ocrResult.extractedText, profile.id, doc.id);
      }

      return {
        success: true,
        documentId: doc.id,
        fileUrl: savedFile.fileUrl,
        ocr: ocrResult,
        ai: aiResult?.data || null,
      };
    }),

  // 2. List Documents
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.userId, ctx.user.id))
      .orderBy(desc(schema.documents.uploadedAt));
  }),

  // 3. Re-run OCR
  processOCR: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const [doc] = await db
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.id, input.documentId))
        .limit(1);

      if (!doc || doc.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const result = await processDocumentOCR(doc.id, doc.filePath, doc.mimeType);
      return result;
    }),

  // 4. Run AI Analysis
  analyzeWithAI: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getStudentProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const [doc] = await db
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.id, input.documentId))
        .limit(1);

      if (!doc || doc.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      if (!doc.extractedText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No extracted text available for AI analysis. Please run OCR first.",
        });
      }

      const aiResponse = await qwen3.analyzeResume(doc.extractedText, profile.id, doc.id);
      return aiResponse;
    }),
});
