import { describe, expect, it } from "vitest";
import { saveDocument, sanitizeFileName } from "./services/storage/storageService";
import { processDocumentOCR } from "./services/ocr/ocrService";

describe("Document Storage & Sanitization", () => {
  it("sanitizes filenames preventing path traversal", () => {
    const malicious = "../../../etc/passwd.pdf";
    const clean = sanitizeFileName(malicious);
    expect(clean).not.toContain("/");
    expect(clean).not.toContain("\\");
    expect(clean).not.toContain("..");
  });

  it("rejects unauthorized file MIME types", async () => {
    const exeBuffer = Buffer.from("MZ malicious executable");
    await expect(saveDocument(exeBuffer, "virus.exe", "application/x-msdownload")).rejects.toThrow(
      /Unsupported document MIME type/
    );
  });

  it("accepts valid PDF buffer and writes to storage", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4 sample pdf content stream test endstream");
    const saved = await saveDocument(pdfBuffer, "my_resume.pdf", "application/pdf");
    expect(saved.fileName).toBeDefined();
    expect(saved.filePath).toBeDefined();
    expect(saved.fileUrl).toContain("/api/documents/file/");
  });
});

describe("OCR Pipeline Error Handling", () => {
  it("gracefully marks failure and preserves document if file is missing", async () => {
    const result = await processDocumentOCR(99999, "non_existent_file.pdf", "application/pdf");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
