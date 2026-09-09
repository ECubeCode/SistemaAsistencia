import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "ATTENDANCE_SELF_CREATE"
  | "ATTENDANCE_ADMIN_CREATE"
  | "ATTENDANCE_ADMIN_UPDATE"
  | "ATTENDANCE_ADMIN_DELETE"
  | "INITIAL_HOURS_SET_BY_STUDENT"
  | "INITIAL_HOURS_UPDATED_BY_ADMIN"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DEACTIVATED"
  | "USER_REACTIVATED";

export async function logAudit(params: {
  actorId?: string | null;
  action: AuditAction;
  targetId?: string | null;
  details?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      targetId: params.targetId ?? null,
      details: params.details ?? null,
    },
  });
}
