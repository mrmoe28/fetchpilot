# FetchPilot
Autonomous web intelligence agent that reasons, adapts, and extracts.
- Next.js + Tailwind + shadcn-like components
- LLM-guided selectors & pagination
- HTTP-first with optional Playwright browser worker
- API: `POST /api/scrape` with JSON body: `{ url, goal? }`

## Quickstart
1) `cp .env.example .env.local` and set `ANTHROPIC_API_KEY`.
2) (Optional) `npm run worker` to start a local Playwright worker (requires Chrome & headful or headless).
3) `npm i && npm run dev`
4) Open http://localhost:3000

---
