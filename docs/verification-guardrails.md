# Verification Guardrails

## Command

- Run `npm run verify` before closing a refactor ticket that changes routes, repositories, or screen-level data flow.
- `npm run verify` runs:
  - `npm run typecheck`
  - `npm run build`
  - `npm run smoke:api`
  - `npm run guard:architecture`

## Smoke API rules

- `npm run smoke:api` starts the built Next.js app with `next start`.
- The smoke suite should prefer non-mutating coverage:
  - read paths
  - validation failures
  - unauthorized paths
- Current route coverage includes:
  - `/api/feed/global`
  - `/api/feed/nearby`
  - `/api/feed/nearby/sync`
  - `/api/location/resolve`
  - `/api/posts`
  - `/api/posts/engagement`
  - `/api/candidate/first-message`
  - `/api/posts/[postId]/agree/toggle`
  - `/api/posts/[postId]/report`

## Architecture guard rules

- Do not use raw `fetch("/api/...")` inside `src/components`.
- Component route access should go through `fetchClientApiData(...)` and `*-api.ts` helpers.
- Do not read `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `NEXT_PUBLIC_SUPABASE_URL` directly inside `src/app/api/**/route.ts`.
- Do not compose Supabase REST paths such as `rest/v1/...` directly inside route handlers.
- Files above 300 lines in `src/components` or `src/lib` should be treated as exceptions. Split responsibilities before adding more logic, and only extend the allowlist deliberately.
