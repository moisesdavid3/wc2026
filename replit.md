# World Cup 2026 Predictor Pool

A prediction pool app for FIFA World Cup 2026 — users predict match scores, earn points, and compete on a live leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env (for auto-sync): `FOOTBALL_DATA_KEY` — API key from https://www.football-data.org (free tier: 10 req/min, includes FIFA World Cup)
- The sync uses smart polling: polls at each match's estimated end time (kickoff + 2h), retrying every 10min if no final result yet

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, path `/api`)
- Frontend: React + Vite (port 24323, path `/`)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (via `@clerk/express` + `@clerk/react`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema (teams, matches, predictions, users)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validators
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/predictor/src/pages/` — all frontend pages
- `scripts/src/seed.ts` — DB seed script (teams + fixtures)

## Architecture decisions

- Contract-first: OpenAPI spec → Zod validators + React Query hooks via Orval. Never hand-write API types.
- Scoring: 5 pts exact score, 3 pts correct outcome (win/draw/loss), 0 pts wrong. Calculated server-side on result entry.
- Predictions locked once match date passes (checked server-side).
- Admin role stored in `users.role` column; admins can enter results and manage roles.
- Clerk auth: `publishableKeyFromHost` for dev/prod key switching, proxy URL via `VITE_CLERK_PROXY_URL`.

## Product

- **Home**: landing page with hero + leaderboard preview (public)
- **Dashboard**: personal stats, countdown to next matches, leaderboard preview (auth required)
- **Matches**: full fixture list with prediction status + filters (auth required)
- **Match Detail**: submit/edit score prediction, see community prediction stats (auth required)
- **Leaderboard**: full ranked standings with podium (auth required)
- **Groups**: group stage standings table with live GD/points (auth required)
- **Bracket**: knockout stage visual bracket (auth required)
- **Profile**: personal history + prediction breakdown (auth required)
- **Admin**: enter official results, manage user roles (admin only)

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change.
- Run `pnpm --filter @workspace/db run push` after any schema change.
- `db.userId` column name in DB is `user_id`; Drizzle maps it as `userId`.
- The API server uses `req.log` (pino) — never `console.log` in route files.
- `@workspace/api-zod` exports both response and param schemas used for server-side validation.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
