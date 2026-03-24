import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

interface AuditEntry {
	workspaceId?: string;
	userId?: string;
	action: string;
	targetType: string;
	targetId: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
}

export async function createAuditEntry(entry: AuditEntry): Promise<void> {
	if (!entry.workspaceId) return;

	try {
		await db.insert(auditLog).values({
			workspaceId: entry.workspaceId,
			userId: entry.userId ?? null,
			action: entry.action,
			targetType: entry.targetType,
			targetId: entry.targetId,
			metadata: entry.metadata ?? null,
			ipAddress: entry.ipAddress ?? null,
		});
	} catch (err) {
		logger.error({ err, entry }, "Failed to create audit log entry");
	}
}
