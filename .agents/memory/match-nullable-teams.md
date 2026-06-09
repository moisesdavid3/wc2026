---
name: Match schema nullable teams
description: Knockout placeholder matches have null team IDs; OpenAPI and Zod must allow nullable
---

## Rule
`homeTeamId`, `awayTeamId`, `homeTeam`, `awayTeam` in the `Match` and `MatchDetail` OpenAPI schemas must be nullable (not required).

**Why:** World Cup 2026 knockout bracket matches are seeded before teams are determined. The DB rows have `null` for `home_team_id` / `away_team_id`. If the spec marks these as required integers, `ListMatchesResponse.parse()` throws a ZodError for every knockout placeholder, causing the `/api/matches` endpoint to 500.

**How to apply:** In `lib/api-spec/openapi.yaml`, set `type: ["integer", "null"]` for the IDs and use `oneOf: [$ref: Team, type: "null"]` for the team objects. Remove them from `required`. Re-run codegen after.
