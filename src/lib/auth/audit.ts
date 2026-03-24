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

const SYSTEM_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

export async function createAuditEntry(entry: AuditEntry): Promise<void> {
	try {
		await db.insert(auditLog).values({
			workspaceId: entry.workspaceId ?? SYSTEM_WORKSPACE_ID,
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
