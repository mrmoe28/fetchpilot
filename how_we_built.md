# FetchPilot Buildback Kit

## 1. Working Feature Inventory
- Autonomous scraping orchestrator performs queue-based crawling, logging, selector fallback, and Claude recovery before returning validated products (lib/agent.ts:21).
- LLM decision engine samples DOM, enforces JSON schema, and logs token usage while calling `claude-3-5-sonnet-20241022` (lib/brain.ts:44).
- HTTP-first fetcher enriches requests with realistic headers, derives DOM signals, and falls back to a managed Playwright worker when configured (lib/tools.ts:10, lib/tools.ts:40).
- Product extraction utilities normalize relative URLs, parse CSS selectors, and provide JSON-LD support for hybrid strategies (lib/tools.ts:54, lib/agent.ts:177).
- API endpoint validates payloads with Zod, limits traversal depth, and forwards logs with the Claude-assisted scraper (app/api/scrape/route.ts:8).
- Authenticated homepage gates access with NextAuth, redirects guests to `/landing`, streams logs/results, and surfaces quick navigation cards (app/page.tsx:12, app/page.tsx:55, app/page.tsx:169).
- Scraper form enforces URL presence, seeds default goals, and exposes a loading state to prevent duplicate submits (components/scraper-form.tsx:9).
- Results table and log viewer render animated feedback, highlight errors/success, and provide deep links to scraped URLs (components/results-table.tsx:5, components/log-view.tsx:1).
- NextAuth config uses the Drizzle adapter, explicit `/api/auth` basePath, and routing callbacks to enforce dashboard redirects (lib/auth/index.ts:8).
- Middleware preserves callback URLs, keeps auth endpoints public, and blocks authenticated users from revisiting sign-in (middleware.ts:1).
- Drizzle schema models users, OAuth accounts, jobs, scheduled scrapes, and product storage with cascade rules (lib/db/schema.ts:1).
- Optional Playwright worker exposes `/openPage` over HTTP for JS-heavy pages with scroll automation (worker/browser-worker.ts:1).
- Playwright test suite asserts OAuth provider availability and middleware behavior, guarding against regressions (tests/auth-redirect.spec.ts:1).

## 2. Step-by-Step Rebuild Prompt (Error-Aware)
1. **Scaffold & Tooling** — Create a Next.js 15 App Router project with TypeScript and Tailwind; add the exact dependencies from `package.json` (package.json:1).
2. **Styling System** — Configure Tailwind with custom FetchPilot palette, shadows, and animation tokens matching `tailwind.config.ts` (tailwind.config.ts:1).
3. **Domain Schemas** — Implement product/page schemas and Drizzle table definitions for users, jobs, products, and schedules pulled from `lib/db/schema.ts` (lib/db/schema.ts:1).
4. **HTTP Fetch Layer** — Build `lib/tools.ts` with realistic headers, DOM signal extraction, and optional `ManagedBrowser` that POSTs to `/openPage` (lib/tools.ts:10, lib/tools.ts:40).
5. **Claude Decision Engine** — Reproduce `askClaudeForDecision` with HTML sampling, strict schema validation, and token telemetry (lib/brain.ts:44).
6. **Scraping Orchestrator** — Assemble `scrapeProducts` with BFS queueing, failure counters, selector fallbacks, and direct Claude extraction fallback (lib/agent.ts:21, lib/agent.ts:185).
7. **API Surface** — Expose `POST /api/scrape` that zod-validates input, injects `ANTHROPIC_API_KEY`, caps pages at 12, and returns logs plus products (app/api/scrape/route.ts:8).
8. **Authentication** — Configure NextAuth via Drizzle adapter, set `basePath: "/api/auth"`, `trustHost: true`, and redirect callback logic mirroring `lib/auth/index.ts` (lib/auth/index.ts:8).
9. **Route Protection** — Implement middleware that white-lists auth/privacy routes, preserves callback URLs, and diverts logged-in users away from sign-in (middleware.ts:1).
10. **Signed-In UI** — Recreate the dashboard-launcher homepage with quick actions, animated hero, scraper form, results table, and log stream (app/page.tsx:12, app/page.tsx:169, components/results-table.tsx:5).
11. **Auth UI & Tests** — Port sign-in screen with Google/GitHub buttons and run the Playwright auth redirect suite to confirm middleware + provider wiring (tests/auth-redirect.spec.ts:1).
12. **Optional Browser Worker** — Add the lightweight Playwright worker and wire `BROWSER_WORKER_URL` in `.env` for JS-rendered sites (worker/browser-worker.ts:1).
13. **Environment Hardening** — Load `.env.local` with Anthropic, NextAuth, database, and OAuth secrets before starting the dev server (OAUTH_FIX.md:8, docs/GOOGLE_OAUTH_SETUP.md:96, DEPLOYMENT.md:33).
14. **Database Lifecycle** — Run `npm run db:push`, verify with `npm run db:studio`, and seed any reference data required for dashboards (docs/GOOGLE_OAUTH_SETUP.md:126, DEPLOYMENT.md:80).
15. **Verification** — Execute `npm run lint`, `npm run build`, and the Playwright smoke tests to ensure no regressions (DEPLOYMENT.md:108, tests/auth-redirect.spec.ts:1).

## 3. Error Retrospective
- **Google redirect_uri_mismatch** — Triggered by missing NextAuth envs and absent OAuth callback in Google Console; solved by populating `.env.local` and authorizing `http(s)://.../api/auth/callback/google` (OAUTH_FIX.md:3, OAUTH_FIX.md:24, docs/GOOGLE_OAUTH_SETUP.md:47).
- **NextAuth callback 404s** — Caused by missing `basePath` and `trustHost` when upgrading to v5; fixed by setting both flags and ensuring redirect callback returns `/dashboard` (docs/GOOGLE_OAUTH_SETUP.md:5, lib/auth/index.ts:8).
- **Database session adapter errors** — Occurred before running migrations; resolved by pushing Drizzle schema to the database (docs/GOOGLE_OAUTH_SETUP.md:68, DEPLOYMENT.md:80).
- **Missing ANTHROPIC_API_KEY at runtime** — `scrapeProducts` throws immediately when the key is absent; prevented by copying `.env.example` values and exporting the key (lib/agent.ts:22, FEATURES.md:784).
- **Browser worker error** — Raised when the optional Playwright service was offline or misconfigured; addressed by starting `npm run worker` and pointing `BROWSER_WORKER_URL` at `/openPage` (lib/tools.ts:48, FEATURES.md:820).

## 4. Quick Reference Links
- Authentication success checklist (AUTHENTICATION_COMPLETE.md:3)
- Deployment/environment playbook (DEPLOYMENT.md:1)
- OAuth debugging procedure (OAUTH_DEBUG_INSTRUCTIONS.md:1)
- Feature-by-feature deep dive (FEATURES.md:1)
