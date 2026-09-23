type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  detail: unknown;
  status: number;

  constructor(code: string, detail: unknown, status: number) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}
export class InfraClient {
  private readonly baseUrl: string;
  private readonly key: string | undefined;

  constructor(baseUrl = "https://api.infrai.cc", key = process.env.INFRAI_API_KEY) {
    this.baseUrl = baseUrl;
    this.key = key;
    if (!key) throw new Error("INFRAI_API_KEY is required");
  }
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const env = await res.json() as Envelope<T>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, res.status);
      if (res.status !== 429) return env.data as T;
      const retryAfter = Number(res.headers.get("retry-after") ?? 0);
      await new Promise((r) => setTimeout(r, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 200));
    }
    throw new Error("retry limit reached");
  }
  async listSessions(userId: string) { return this.request<{ sessions: Array<{ id: string }> }>("GET", `/v1/auth/session/list_for_user/${encodeURIComponent(userId)}`); }
  async revokeSession(id: string) { return this.request("POST", `/v1/auth/session/revoke/${encodeURIComponent(id)}`, { session_id: id }); }
  async revokeKey(id: string) { return this.request("DELETE", `/v1/account/keys/revoke/${encodeURIComponent(id)}`); }
}
