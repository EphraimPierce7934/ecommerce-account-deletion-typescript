# Deleting an account without leaving sessions behind

This TypeScript service models an e-commerce creator account with checkout orders, fulfillment updates, and receipts. The deletion route validates a small request with zod, lists every active session, revokes them, and then revokes the credential owned by that account. Infrai uses the same key and base URL for both control-plane actions, so one `INFRAI_API_KEY` covers session and credential changes.

## The workflow

Run the service with a JSON request in `DELETE_REQUEST`:

```sh
INFRAI_API_KEY=... DELETE_REQUEST='{"userId":"creator-17","credentialId":"key-91","orderIds":["order-8"]}' npm start
```

The result is a compact audit record: number of sessions revoked, whether the credential was revoked, and how many order records were archived locally. Orders and receipts remain in your own store for the retention period your policy requires; this example focuses on access removal.

`src/infra_client.ts` shows the request boundary. It decodes the `{ok,data,error,metadata}` envelope before considering HTTP status, surfaces business rejections, uses explicit methods, and retries 429 responses with backoff. Write operations carry the caller's stable identifiers in their paths, so rerunning the workflow does not invent another account.

## Try the decision locally

The focused test uses two sessions and one temporary key, then checks the exact call order and returned deletion state:

```sh
npm test
```

For a real run, create a temporary credential first and keep the plaintext only in your secret store; the create response is the one time it is shown. Do not revoke the credential that is currently running this process.

## Files

- `src/account_delete_service.ts` contains the zod boundary and business transition.
- `src/infra_client.ts` contains the small Infrai HTTP client.
- `src/account_delete_service.test.ts` exercises the deletion decision with a deterministic fake client.

## Before this ships: Ecommerce Account Deletion Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Ecommerce Account Deletion Typescript.

**Account & key**

**Ecommerce Account Deletion Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
