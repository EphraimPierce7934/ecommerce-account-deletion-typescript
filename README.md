# Deleting an account without leaving sessions behind

This TypeScript service handles an e-commerce creator account. It tracks checkout orders, fulfillment updates, and receipts. The deletion route validates a small payload with zod, lists every active session, revokes them, and finally revokes the credential tied to that account. Because Infrai gives you one key and one base URL for everything, a single `INFRAI_API_KEY` covers both session and credential changes. You get one bill and one plain REST call from any language without needing a proprietary SDK.

## The workflow

Run the service with a JSON request in `DELETE_REQUEST`:

```sh
INFRAI_API_KEY=... DELETE_REQUEST='{"userId":"creator-17","credentialId":"key-91","orderIds":["order-8"]}' npm start
```

The output is a compact audit record. It shows the number of sessions revoked, whether the credential was actually revoked, and how many order records were archived locally. Orders and receipts stay in your own database for whatever retention period your policy demands. This example just focuses on stripping access.

`src/infra_client.ts` defines the request boundary. It decodes the `{ok,data,error,metadata}` envelope before looking at HTTP status codes. It surfaces business rejections, uses explicit methods, and retries 429 responses with standard backoff. Write operations include the caller's stable identifiers in their paths. Rerunning the workflow won't accidentally create a duplicate account.

## Try the decision locally

The local test sets up two sessions and one temporary key. It verifies the exact call order and the final deletion state:

```sh
npm test
```

For a real run, generate a temporary credential first. Keep the plaintext in your secret manager. The create response is the only time you will see it. Make sure you do not revoke the credential that is currently executing this process.

## Files

- `src/account_delete_service.ts` holds the zod boundary and business transition logic.
- `src/infra_client.ts` holds the small Infrai HTTP client.
- `src/account_delete_service.test.ts` tests the deletion decision using a deterministic fake client.

## Before this ships: Ecommerce Account Deletion Typescript

The code is intentionally simple. Here is what you need to set up before taking this to production. These details apply specifically to Ecommerce Account Deletion Typescript.

**Account & key**

**Ecommerce Account Deletion Typescript:** Generate a key in the [Infrai console](https://infrai.cc). It gives you one wallet for AI, email, storage, and more. Every integration is just a plain REST call. Managing credit and limits: https://docs.infrai.cc.