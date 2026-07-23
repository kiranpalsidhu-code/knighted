# Knighted

An AI-powered resume builder and job application tracker, plus a job board — for ambitious professionals.

The product has two web apps and a shared API:

- **Knighted Resume** (`artifacts/resume-ready`) — create and manage multiple resumes, AI-tailor them to job descriptions, get ATS feedback scores, generate cover letters, track applications in a pipeline, and prep for interviews. Pro tier via Stripe.
- **Knighted Jobs** (`artifacts/knighted-jobs`) — a job board with seeker and employer flows (listings, alerts, saved jobs, applications, employer dashboard/inbox/review, salary tools, post-a-job).
- **API server** (`artifacts/api-server`) — Express 5 API serving both apps.
- **Mobile** (`artifacts/resume-ready-mobile`) — an Expo React Native app (local-only in v1, no backend sync).

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **API:** Express 5
- **DB:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk (`@clerk/react` on the web, `@clerk/express` on the server)
- **Validation:** Zod (`zod/v4`), `drizzle-zod`
- **API codegen:** Orval, from the OpenAPI spec (contract-first)
- **Build:** esbuild (API server bundle), Vite (web apps)
- **AI:** Anthropic Claude. Uses **AWS Bedrock** when `AWS_BEDROCK_*` env vars are set, otherwise the **direct Anthropic API** (`ANTHROPIC_API_KEY`).
- **Payments:** Stripe (optional — billing endpoints return 503 if unset)

## Run & operate

- `pnpm install`
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

Each app reads `PORT` and (for the web apps) `BASE_PATH` from the environment. Defaults used previously:

| App | BASE_PATH | Serves |
|-----|-----------|--------|
| resume-ready | `/` | static SPA (`dist/public`) |
| knighted-jobs | `/knighted-jobs/` | static SPA (`dist/public`) |
| resume-ready-mobile | `/resume-ready-mobile/` | Expo |
| api-server | — (mounts at `/api`) | Node bundle (`dist/index.mjs`) |

## Environment variables

Required:
- `DATABASE_URL` — Postgres connection string
- `PORT` — per service
- `BASE_PATH` — per web app (see table above)
- `CLERK_PUBLISHABLE_KEY` (server) and `VITE_CLERK_PUBLISHABLE_KEY` (client) — same Clerk key in both

AI (pick one path):
- **Direct Anthropic API:** `ANTHROPIC_API_KEY` (optional `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`)
- **AWS Bedrock:** `AWS_BEDROCK_REGION`, `AWS_BEDROCK_ACCESS_KEY_ID`, `AWS_BEDROCK_SECRET_ACCESS_KEY` (optional `BEDROCK_MODEL_ID`)

Optional:
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`

## Build & deploy

The project is host-agnostic. To deploy:

1. `pnpm install --frozen-lockfile`
2. `pnpm run build`
3. Serve the API bundle: `node --enable-source-maps artifacts/api-server/dist/index.mjs` (set `PORT`, `DATABASE_URL`, Clerk + AI env).
4. Serve each web app's `dist/public` as static files under its `BASE_PATH`, with SPA rewrites (`/* → /index.html`). Set `BASE_PATH` and `VITE_CLERK_PUBLISHABLE_KEY` at build time.

Any Node host works (Railway, Render, Fly, a VM, etc.) plus a managed Postgres. A reverse proxy routes `/api` to the API server, `/knighted-jobs/` to the jobs SPA, and `/` to the resume SPA. The Clerk FAPI proxy middleware lets auth work on custom domains without CNAME setup.

## Where things live

- `artifacts/resume-ready/` — Knighted Resume web app (Vite + React)
- `artifacts/knighted-jobs/` — Knighted Jobs board (Vite + React)
- `artifacts/api-server/` — Express API (esbuild → `dist/index.mjs`; bundler is `build.mjs`)
- `artifacts/resume-ready-mobile/` — Expo app
- `lib/db/` — Drizzle schema and migrations
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — generated React Query hooks (do not edit manually; `custom-fetch.ts` is the hand-written fetch mutator)
- `lib/api-zod/` — generated Zod schemas (do not edit manually)
- `lib/integrations-anthropic-ai/` — Anthropic client (Bedrock or direct API) + batch helpers

## Architecture decisions

- **Contract-first API:** the OpenAPI spec gates all codegen. Update `openapi.yaml` before writing routes or hooks, then run codegen.
- **Clerk auth:** web uses `@clerk/react`; the API uses `@clerk/express` middleware. A proxy middleware fronts the Clerk Frontend API for custom domains.
- **Stripe billing is optional:** if `STRIPE_SECRET_KEY` is unset, billing endpoints return 503 gracefully.
- **Mobile** uses AsyncStorage for local persistence (no backend sync in v1).

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.
- **Codegen + zod/v4:** the installed Orval emits zod-v4 syntax (`z.email()`), and this project uses `zod/v4`. After codegen, the generated `lib/api-zod/src/generated/api.ts` import must be `zod/v4` (patch `from 'zod'` → `from 'zod/v4'`). Fold this into the codegen step if it recurs.
- **SEO prerendering:** `artifacts/*/seo-plugin.ts` currently contains placeholder no-op Vite plugins. The original per-route prerender logic was lost; static `index.html` meta and the runtime `useSEO` hook still work. Reimplement before relying on crawler SEO for individual routes.
