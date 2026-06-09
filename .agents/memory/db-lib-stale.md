---
name: DB lib stale declarations
description: After schema changes, typecheck:libs must run before api-server typecheck
---

## Rule
Run `pnpm run typecheck:libs` before running `pnpm --filter @workspace/api-server exec tsc --noEmit`. Otherwise TypeScript reports that table names like `usersTable`, `matchesTable`, etc. don't exist in `@workspace/db` even though they do.

**Why:** `@workspace/db` is a composite lib that emits declarations. If the `.d.ts` files are stale (e.g. after adding new schema exports), api-server sees the old declarations and reports missing exports. `typecheck:libs` rebuilds the declarations first.

**How to apply:** The codegen script already does this automatically (`pnpm --filter @workspace/api-spec run codegen` calls `typecheck:libs` at the end). For manual schema changes, explicitly run `pnpm run typecheck:libs` first.
