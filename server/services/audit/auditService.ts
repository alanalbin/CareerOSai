import { getDb, schema } from "../../db";

export async function logAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId?: number,
  metadata?: Record<string, any>,
  ipAddress?: string
) {
  try {
    const db = await getDb();
    // Sanitize metadata: never store password or tokens
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.passwordHash;
    delete safeMetadata.token;
    delete safeMetadata.sessionSecret;

    await db.insert(schema.auditLogs).values({
      userId: userId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: safeMetadata,
      ipAddress: ipAddress ?? null,
    });
  } catch (err) {
    console.warn("[Audit] Failed to record audit log:", err);
  }
}
