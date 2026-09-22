import fs from "fs";
import path from "path";
import axios from "axios";
import { getDb, schema } from "../../db";
import { eq } from "drizzle-orm";

export interface OCRResult {
  success: boolean;
  extractedText: string;
  confidence: number;
  structuredFields: {
    candidateName?: string | null;
    email?: string | null;
    phone?: string | null;
    cgpa?: number | null;
    detectedSkills: string[];
    detectedEducation: any[];
    detectedProjects: any[];
  };
  error?: string;
}

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8000";

export async function processDocumentOCR(
  documentId: number,
  filePath: string,
  mimeType: string
): Promise<OCRResult> {
  const db = await getDb();

  // 1. Mark status as PROCESSING
  await db.update(schema.documents).set({
    processingStatus: "PROCESSING",
    ocrStatus: "PROCESSING",
  }).where(eq(schema.documents.id, documentId));

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found at path: ${filePath}`);
    }

    let ocrResult: OCRResult | null = null;

    // 2. Try calling remote PaddleOCR microservice if available
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const fileName = path.basename(filePath);
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
      const formData = new FormData();
      formData.append("file", blob, fileName);

      const res = await fetch(`${OCR_SERVICE_URL}/ocr/process`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data && data.extractedText) {
          ocrResult = {
            success: true,
            extractedText: data.extractedText,
            confidence: data.confidence ?? 0.85,
            structuredFields: data.structuredFields ?? { detectedSkills: [], detectedEducation: [], detectedProjects: [] },
          };
        }
      }
    } catch (paddleErr: any) {
      console.warn(`[OCR Service] PaddleOCR microservice call failed (${paddleErr.message}), running local document extraction engine...`);
    }

    // 3. If remote PaddleOCR wasn't reached, run local parser
    if (!ocrResult) {
      ocrResult = await extractTextLocally(filePath, mimeType);
    }

    if (!ocrResult || !ocrResult.success || !ocrResult.extractedText.trim()) {
      // Mark as FAILED, keep document intact
      await db.update(schema.documents).set({
        processingStatus: "FAILED",
        ocrStatus: "FAILED",
      }).where(eq(schema.documents.id, documentId));

      return {
        success: false,
        extractedText: "",
        confidence: 0,
        structuredFields: { detectedSkills: [], detectedEducation: [], detectedProjects: [] },
        error: "Document OCR could not extract legible text. You may enter data manually.",
      };
    }

    // 4. Update document record with extracted text and structured data
    await db.update(schema.documents).set({
      processingStatus: "PROCESSED",
      ocrStatus: "PROCESSED",
      extractedText: ocrResult.extractedText,
      extractedData: ocrResult.structuredFields,
      processedAt: new Date(),
    }).where(eq(schema.documents.id, documentId));

    return ocrResult;
  } catch (err: any) {
    console.error("[OCR Service] Fatal processing error:", err);
    await db.update(schema.documents).set({
      processingStatus: "FAILED",
      ocrStatus: "FAILED",
    }).where(eq(schema.documents.id, documentId));

    return {
      success: false,
      extractedText: "",
      confidence: 0,
      structuredFields: { detectedSkills: [], detectedEducation: [], detectedProjects: [] },
      error: err.message || "Failed to process document OCR",
    };
  }
}

async function extractTextLocally(filePath: string, mimeType: string): Promise<OCRResult> {
  const content = await fs.promises.readFile(filePath);
  let extractedText = "";

  if (mimeType.includes("text") || filePath.endsWith(".txt")) {
    extractedText = content.toString("utf-8");
  } else if (mimeType.includes("pdf") || filePath.endsWith(".pdf")) {
    // Basic PDF stream text extraction for standard printable PDF streams
    const raw = content.toString("latin1");
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    const chunks: string[] = [];

    while ((match = streamRegex.exec(raw)) !== null) {
      const chunk = match[1];
      // Search for text operators in the PDF stream (Tj, TJ, ')
      const textMatches = chunk.match(/\((.*?)\)\s*Tj/g);
      if (textMatches) {
        for (const tm of textMatches) {
          const sub = tm.slice(1, tm.lastIndexOf(")"));
          chunks.push(sub);
        }
      }
    }

    if (chunks.length > 0) {
      extractedText = chunks.join(" ");
    } else {
      // Clean ASCII string extraction fallback
      const asciiStrings = raw.match(/[\x20-\x7E]{4,}/g);
      if (asciiStrings) {
        extractedText = asciiStrings
          .filter(s => !s.startsWith("obj") && !s.startsWith("endobj") && !s.includes("Font") && !s.includes("XObject"))
          .join("\n");
      }
    }
  }

  // Scan skills and basic structure
  const skillsList = [
    "Python", "React", "TypeScript", "JavaScript", "Node.js", "FastAPI",
    "SQL", "PostgreSQL", "AWS", "Docker", "Machine Learning", "System Design",
    "Testing & QA", "Analytics", "Communication", "Leadership", "Git"
  ];

  const detectedSkills = skillsList.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i").test(extractedText)
  );

  const emailMatch = extractedText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const cgpaMatch = extractedText.match(/(?:CGPA|GPA)[:\s]*([0-9]\.[0-9]{1,2})/i);

  return {
    success: extractedText.trim().length > 0,
    extractedText: extractedText.trim(),
    confidence: extractedText.trim().length > 50 ? 0.85 : 0.4,
    structuredFields: {
      email: emailMatch ? emailMatch[0] : null,
      cgpa: cgpaMatch ? parseFloat(cgpaMatch[1]) : null,
      detectedSkills,
      detectedEducation: [],
      detectedProjects: [],
    },
  };
}
