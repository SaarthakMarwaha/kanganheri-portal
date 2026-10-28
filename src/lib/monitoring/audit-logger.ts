import { db } from "@/lib/db";
import { type AuditAction, type UserRole, type Prisma } from "@prisma/client";

export interface LogAuditParams {
  actorId?: string | null | undefined;
  actorRole?: UserRole | null | undefined;
  action: AuditAction;
  entityType: string;
  entityId?: string | null | undefined;
  previousState?: Record<string, unknown> | null | undefined;
  newState?: Record<string, unknown> | null | undefined;
  ipHash?: string | null | undefined;
  userAgent?: string | null | undefined;
  meta?: Record<string, unknown> | null | undefined;
}

/**
 * Records an immutable audit log entry.
 * Can run standalone or within an existing Prisma interactive transaction.
 */
export async function recordAuditLog(
  params: LogAuditParams,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? db;

  try {
    await client.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        previousStateJson: (params.previousState as Prisma.InputJsonValue) ?? undefined,
        newStateJson: (params.newState as Prisma.InputJsonValue) ?? undefined,
        ipHash: params.ipHash ?? null,
        userAgent: params.userAgent ?? null,
        metaJson: (params.meta as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    // Audit logs must not bring down the primary user transaction in case of non-fatal errors,
    // but should be logged loudly in development/staging.
    console.error("Failed to record audit log:", err, params);
  }
}

/**
 * Executes a mutation inside a Prisma interactive transaction and automatically
 * appends an audit log record before committing.
 *
 * @param params - Audit log parameters (newState will be updated with mutation result if desired)
 * @param mutation - Callback containing the database operations to execute
 */
export async function withAuditTransaction<T>(
  params: Omit<LogAuditParams, "newState">,
  mutation: (
    tx: Prisma.TransactionClient,
  ) => Promise<{ result: T; newState?: Record<string, unknown> }>,
): Promise<T> {
  return await db.$transaction(async (tx) => {
    const { result, newState } = await mutation(tx);

    await recordAuditLog(
      {
        ...params,
        newState:
          newState ??
          (typeof result === "object" && result !== null
            ? (result as Record<string, unknown>)
            : null),
      },
      tx,
    );

    return result;
  });
}
