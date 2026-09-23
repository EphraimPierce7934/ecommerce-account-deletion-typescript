import assert from "node:assert/strict";
import { deleteAccount } from "./account_delete_service.js";
import { InfraClient } from "./infra_client.js";
class FakeClient { calls: string[] = []; async listSessions() { this.calls.push("list"); return { sessions: [{ id: "s1" }, { id: "s2" }] }; } async revokeSession(id: string) { this.calls.push(`session:${id}`); } async revokeKey(id: string) { this.calls.push(`key:${id}`); } }
const client = new FakeClient();
const result = await deleteAccount({ userId: "u-42", credentialId: "k-temp", orderIds: ["o-1"] }, client as never);
assert.deepEqual(result, { userId: "u-42", sessionsRevoked: 2, credentialRevoked: true, ordersArchived: 1, status: "deleted" });
assert.deepEqual(client.calls, ["list", "session:s1", "session:s2", "key:k-temp"]);
const requestClient = new InfraClient("https://example.invalid", "test-key");
const originalFetch = globalThis.fetch;
let revokeRequest: { url: string; init?: RequestInit } | undefined;
globalThis.fetch = async (input, init) => {
  revokeRequest = { url: String(input), init };
  return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200 });
};
try {
  await requestClient.revokeSession("session-1");
  assert.equal(revokeRequest?.url, "https://example.invalid/v1/auth/session/revoke/session-1");
  assert.equal(revokeRequest?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(revokeRequest?.init?.body)), { session_id: "session-1" });
} finally {
  globalThis.fetch = originalFetch;
}
console.log("account deletion decision passed");
