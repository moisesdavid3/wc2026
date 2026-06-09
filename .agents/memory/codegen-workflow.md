---
name: Codegen workflow
description: Order of operations after OpenAPI spec changes
---

## Rule
After any change to `lib/api-spec/openapi.yaml`:
1. `pnpm --filter @workspace/api-spec run codegen` — regenerates hooks, Zod schemas, and rebuilds lib declarations
2. Restart the api-server workflow — picks up new Zod validators
3. The predictor (Vite) workflow auto-HMRs the new hooks; restart only if Vite cache issues appear

**Why:** Codegen cleans the output folder before writing. If the api-server is running with old bundled code and you restart after codegen, it rebuilds with new Zod validators. The frontend Vite dev server resolves lib sources directly, so HMR picks up changes immediately.

**How to apply:** Never skip step 1 before typechecking. `api-zod` validators are used server-side for input/output validation; stale schemas will silently pass or fail validation in unexpected ways.
