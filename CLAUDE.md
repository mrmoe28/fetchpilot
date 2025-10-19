# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FetchPilot is an autonomous web intelligence agent that extracts structured product data from websites using LLM-guided scraping strategies. The system intelligently chooses between HTTP-first scraping and browser-based scraping (via optional Playwright worker) based on page characteristics.

**Core Architecture:**
- **Next.js 14** frontend with TypeScript, Tailwind, and shadcn-like UI components
- **LLM-Powered Decision Engine** (Claude 3.5 Sonnet) analyzes page structure and recommends optimal scraping strategies
- **Dual-Mode Extraction**: HTTP-first for server-rendered content, browser fallback for JS-heavy/lazy-loaded content
- **Optional Playwright Worker**: Separate service for browser-based scraping with infinite scroll and dynamic content support

## Development Commands

```bash
# Install dependencies
npm install

# Development server (Next.js app on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Start optional Playwright browser worker (on http://localhost:8787)
npm run worker
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Set `ANTHROPIC_API_KEY` (required for LLM decision-making)
3. Optionally set `BROWSER_WORKER_URL=http://localhost:8787/openPage` to enable browser mode
4. If browser worker not running, system defaults to HTTP-only mode

## Architecture Deep Dive

### Core Scraping Flow (lib/agent.ts)

The `scrapeProducts()` function orchestrates the entire scraping pipeline:

1. **Queue-based crawler**: Starts with initial URL, processes pages breadth-first
2. **HTTP-first observation**: Fetches page via `HttpFetcher` (lib/tools.ts) to analyze DOM signals
3. **LLM decision**: Sends observation to `askClaudeForDecision()` (lib/brain.ts) which returns structured `AgentDecision`
4. **Strategy execution**: Processes actions from LLM decision:
   - If `mode: "BROWSER"` and worker available → sends to Playwright worker for JS rendering/scrolling
   - Parses products using chosen strategy (JSONLD, CSS selectors, or HYBRID)
   - Discovers pagination links and adds to queue
5. **Deduplication**: Merges results using `url::title` composite key
6. **Stop criteria**: Exits when `minProducts` threshold met or max pages reached

### LLM Decision Engine (lib/brain.ts)

`askClaudeForDecision()` sends page observations to Claude API with this prompt structure:
- **System**: Defines role as "Scraping Strategist" requesting strict JSON conforming to `AgentDecision` schema
- **User**: Provides goal + observation (URL, status, HTML snippet, DOM signals like link count, image count, JSON-LD presence)
- **Response**: Returns structured decision including mode, parseStrategy, CSS selectors, pagination config, anti-lazy loading settings, retry logic, and stop criteria
- **Fallback**: If JSON parse fails, uses sensible defaults (HTTP + HYBRID parsing with common product selectors)

### Zod Schemas (lib/schemas.ts)

All data structures are type-safe via Zod:
- `Product`: url, title, price, image, inStock, sku, currency, breadcrumbs, extra metadata
- `PageObservation`: url, status, html, domSignals (numLinks, numImages, hasJsonLd, scrollHeight)
- `AgentAction`: Comprehensive action config with mode, parseStrategy, selectors, pagination, antiLazy, retry, stopCriteria
- `AgentDecision`: Contains rationale + array of AgentActions

### Extraction Tools (lib/tools.ts)

**HttpFetcher**:
- Fetches pages with User-Agent spoofing
- Parses HTML with cheerio to extract DOM signals (link count, image count, JSON-LD presence)
- Returns `FetchResult` with url, status, html, domSignals

**ManagedBrowser**:
- Optional client that proxies requests to browser worker when `BROWSER_WORKER_URL` is set
- Sends `{ url, scroll?, clickSelector?, waitMs? }` to worker
- Returns same `FetchResult` interface as HttpFetcher

**extractProductsHTML()**:
- Takes HTML + CSS selectors from LLM decision
- Extracts products using cheerio with configurable selectors for item container, link, title, price, image
- Handles relative URL resolution
- Supports multiple image attributes (src, data-src, srcset)

### Browser Worker (worker/browser-worker.ts)

Standalone HTTP server (port 8787) that:
- Launches headless Chromium via Playwright
- Navigates to URL with configurable timeouts
- Supports infinite scroll simulation (scrolls to bottom N times with delays)
- Captures final HTML after JS execution
- Returns DOM statistics (link count, image count, scroll height)
- Auto-closes browser to prevent memory leaks

**Important**: Worker is optional. System gracefully degrades to HTTP-only mode if not running.

### API Route (app/api/scrape/route.ts)

Single POST endpoint `/api/scrape`:
- Accepts: `{ url: string, goal?: string }`
- Defaults goal to "Extract product cards and canonical links"
- Calls `scrapeProducts()` with `maxTotalPages: 12` limit
- Returns: `{ products: TProduct[], logs: string[] }`
- Error handling: Returns 400 with error message on failure

## Key Design Patterns

1. **LLM-as-Strategy-Engine**: Rather than hardcoding selectors, the LLM analyzes each page and generates optimal extraction strategy
2. **Progressive Enhancement**: Starts with cheap HTTP requests, only uses browser when LLM determines it's necessary
3. **Structured Output**: All LLM responses conform to strict Zod schemas, with fallback defaults if parsing fails
4. **Separation of Concerns**:
   - `agent.ts` = orchestration logic
   - `brain.ts` = LLM decision-making
   - `tools.ts` = extraction primitives
   - `schemas.ts` = type definitions
5. **Stateless Worker**: Browser worker is a separate process, can be scaled independently or disabled entirely

## Common Modifications

**Adding new product fields**:
1. Update `Product` schema in `lib/schemas.ts`
2. Modify selector extraction in `lib/tools.ts:extractProductsHTML()`
3. Update JSON-LD parser in `lib/agent.ts:parseJsonLd()`
4. Adjust LLM prompt in `lib/brain.ts` to request new selectors

**Changing scraping limits**:
- `maxTotalPages` in `app/api/scrape/route.ts:20`
- `minProducts` stop criteria in LLM decision fallback (`lib/brain.ts:39`)

**Improving LLM accuracy**:
- Enhance system prompt in `lib/brain.ts:4-5` with examples
- Increase `max_tokens` in API call (`lib/brain.ts:21`)
- Add few-shot examples to user prompt

**Browser worker configuration**:
- Timeout: `worker/browser-worker.ts:14` (45s default)
- Headless mode: `worker/browser-worker.ts:12`
- Port: `worker/browser-worker.ts:9`

## Testing the System

1. Start dev server: `npm run dev`
2. (Optional) Start browser worker: `npm run worker`
3. Navigate to http://localhost:3000
4. Enter target URL and custom goal (or use default)
5. Submit form to trigger scrape
6. View results table and logs

**Quick API test**:
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/products","goal":"Extract all product listings"}'
```

## Important Notes

- **API Key Required**: System cannot function without `ANTHROPIC_API_KEY` in `.env.local`
- **Rate Limiting**: No built-in rate limiting. LLM calls cost money - implement throttling for production
- **Error Recovery**: System has retry logic in LLM decisions but no persistent queue. Failed scrapes must be manually retried
- **Browser Worker Lifecycle**: Each browser worker request launches new Chromium instance. For high-volume production use, implement browser instance pooling
- **Pagination Limits**: Hard-coded to prevent infinite loops. Adjust `maxPages` in LLM fallback or via LLM-generated decisions
- **Memory**: Large HTML responses can consume significant memory. Consider streaming or chunking for very large sites
