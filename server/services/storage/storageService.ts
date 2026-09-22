import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_BASE = path.resolve(process.cwd(), "uploads");
const DOCUMENTS_DIR = path.join(UPLOAD_BASE, "documents");
const AVATARS_DIR = path.join(UPLOAD_BASE, "avatars");

// Ensure directories exist
for (const dir of [UPLOAD_BASE, DOCUMENTS_DIR, AVATARS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "text/plain",
]);

const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15MB

export interface SavedFile {
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name);
  return base.replace(/\.\./g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveDocument(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<SavedFile> {
  if (!ALLOWED_DOCUMENT_MIMES.has(mimeType.toLowerCase())) {
    throw new Error(`Unsupported document MIME type: ${mimeType}. Allowed formats: PDF, PNG, JPG, JPEG, TXT`);
  }

  if (fileBuffer.length > MAX_DOCUMENT_SIZE) {
    throw new Error(`File size exceeds limit of 15MB (actual: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB)`);
  }

  const ext = path.extname(originalName) || (mimeType.includes("pdf") ? ".pdf" : ".png");
  const safeBaseName = sanitizeFileName(path.basename(originalName, ext));
  const uniqueId = crypto.randomUUID();
  const storedFileName = `${uniqueId}_${safeBaseName}${ext}`;
  const targetPath = path.join(DOCUMENTS_DIR, storedFileName);

  // Path traversal prevention check
  if (!targetPath.startsWith(DOCUMENTS_DIR)) {
    throw new Error("Security violation: Invalid storage path traversal detected");
  }

  await fs.promises.writeFile(targetPath, fileBuffer);

  return {
    fileName: storedFileName,
    originalName,
    filePath: targetPath,
    fileUrl: `/api/documents/file/${storedFileName}`,
    mimeType,
    fileSize: fileBuffer.length,
  };
}

export function getDocumentPath(fileName: string): string {
  const safeName = path.basename(fileName);
  const fullPath = path.join(DOCUMENTS_DIR, safeName);
  if (!fullPath.startsWith(DOCUMENTS_DIR)) {
    throw new Error("Security violation: Invalid path access");
  }
  if (!fs.existsSync(fullPath)) {
    throw new Error("Document not found");
  }
  return fullPath;
}

export async function deleteDocumentFile(filePath: string): Promise<void> {
  try {
    if (filePath && filePath.startsWith(DOCUMENTS_DIR) && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn("[Storage] Failed to unlink file:", filePath, err);
  }
}
