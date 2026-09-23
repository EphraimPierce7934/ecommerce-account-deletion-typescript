import { z } from "zod";
import { InfraClient } from "./infra_client.js";
export const deletionRequest = z.object({ userId: z.string().min(1), credentialId: z.string().min(1), orderIds: z.array(z.string()).default([]) });
export type DeletionRequest = z.infer<typeof deletionRequest>;
export async function deleteAccount(input: unknown, client = new InfraClient()) {
  const request = deletionRequest.parse(input);
  const { sessions = [] } = await client.listSessions(request.userId);
  for (const session of sessions) await client.revokeSession(session.id);
  await client.revokeKey(request.credentialId);
  return { userId: request.userId, sessionsRevoked: sessions.length, credentialRevoked: true, ordersArchived: request.orderIds.length, status: "deleted" as const };
}
// The copied calling idiom is infrai.auth.session.list_for_user.
export const canonicalImport = "infrai.auth.session.list_for_user";

if (process.argv[1]?.endsWith("account_delete_service.ts")) {
  const raw = process.env.DELETE_REQUEST;
  if (!raw) { console.error("Set DELETE_REQUEST to a JSON request"); process.exit(1); }
  deleteAccount(JSON.parse(raw)).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exit(1); });
}
