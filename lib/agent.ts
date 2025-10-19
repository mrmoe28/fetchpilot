import { HttpFetcher, ManagedBrowser, extractProductsHTML, BrowserClient } from "./tools";
import { Product, TProduct, TPageObservation } from "./schemas";
import { askClaudeForDecision } from "./brain";

type Cfg = { 
  anthropicKey: string; 
  browser?: BrowserClient; 
  maxTotalPages?: number; 
  logs?: string[];
  runId?: string;
  logger?: (event: any) => void;
  customSelectors?: {
    item?: string;
    link?: string;
    title?: string;
    price?: string;
    image?: string;
  };
};

export async function scrapeProducts(startUrl: string, goal: string, cfg: Cfg) {
  if (!cfg.anthropicKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const startTime = performance.now();
  const logs: string[] = cfg.logs ?? [];
  const results: TProduct[] = [];
  const visited = new Set<string>();
  const q: string[] = [startUrl];
  let pagesProcessed = 0;

  // Failure counters for summary
  const failureCounters = {
    httpErrors: 0,
    noHtml: 0,
    claudeErrors: 0,
    parsingErrors: 0,
    emptyResults: 0,
    totalPages: 0
  };

  cfg.logger?.({
    runId: cfg.runId,
    stage: 'scrape_start',
    timestamp: new Date().toISOString(),
    startUrl,
    goal: goal.substring(0, 100),
    maxPages: cfg.maxTotalPages ?? 20
  });

  while (q.length && pagesProcessed < (cfg.maxTotalPages ?? 20)) {
    const url = q.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    failureCounters.totalPages++;
    logs.push(`Fetch HTTP: ${url}`);
    
    let observation: TPageObservation;
    try {
      observation = await HttpFetcher.fetch(url);
      
      cfg.logger?.({
        runId: cfg.runId,
        stage: 'page_fetch',
        timestamp: new Date().toISOString(),
        url,
        status: observation.status,
        hasHtml: !!observation.html,
        pageNumber: failureCounters.totalPages
      });
      
      if (!observation.html) {
        failureCounters.noHtml++;
        logs.push("No HTML returned");
        continue;
      }
    } catch (error) {
      failureCounters.httpErrors++;
      logs.push(`HTTP fetch failed: ${error}`);
      cfg.logger?.({
        runId: cfg.runId,
        stage: 'page_fetch_error',
        timestamp: new Date().toISOString(),
        url,
        error: error instanceof Error ? error.message : String(error),
        pageNumber: failureCounters.totalPages
      });
      continue;
    }

    let decision;
    try {
      decision = await askClaudeForDecision(observation, goal, {
        anthropicKey: cfg.anthropicKey,
        runId: cfg.runId,
        logger: cfg.logger
      });
    } catch (error) {
      failureCounters.claudeErrors++;
      logs.push(`Claude decision failed: ${error}`);
      
      // Use custom selectors immediately if Claude fails
      if (cfg.customSelectors) {
        logs.push("→ Claude failed, using custom selectors as fallback");
        try {
          const customProducts = extractProductsHTML(observation.html || '', observation.url, cfg.customSelectors);
          const validProducts = customProducts.map(p => {
            try {
              return Product.parse(p);
            } catch (err) {
              return null;
            }
          }).filter(p => p !== null) as TProduct[];
          
          if (validProducts.length > 0) {
            const newProducts = results.length;
            merge(results, validProducts);
            logs.push(`✅ Custom selectors found ${results.length - newProducts} products`);
            
            cfg.logger?.({
              runId: cfg.runId,
              stage: 'extraction_results',
              timestamp: new Date().toISOString(),
              url: observation.url,
              newProducts: results.length - newProducts,
              totalProducts: results.length,
              parseStrategy: 'custom_selectors',
              hasSelectors: true
            });
          }
        } catch (customError) {
          logs.push(`Custom selectors also failed: ${customError}`);
        }
      }
      continue;
    }
    logs.push(`Decision: ${short(decision.rationale)}; actions=${decision.actions.length}`);

    for (const action of decision.actions) {
      let res = observation;
      if (action.mode === "BROWSER" && (cfg.browser || ManagedBrowser)) {
        const browser = cfg.browser ?? ManagedBrowser!;
        logs.push(`→ Browser mode for ${url}`);
        res = await browser.openPage({
          url,
          scroll: action.antiLazy.scroll ? { times: action.antiLazy.maxScrolls, waitMs: action.antiLazy.waitMs } : undefined,
          waitMs: action.antiLazy.waitMs
        });
      }

      pagesProcessed++;
      if (!res.html) { 
        failureCounters.noHtml++;
        logs.push("No HTML returned"); 
        continue; 
      }

      let products: TProduct[] = [];

      try {
        // Phase 1: Try custom selectors first if provided
        if (cfg.customSelectors) {
          logs.push("→ Using custom selectors");
          const customProducts = extractProductsHTML(res.html, res.url, cfg.customSelectors);
          logs.push(`→ Custom selectors extracted ${customProducts.length} raw products`);
          
          for (const p of customProducts) {
            try {
              const validated = Product.parse(p);
              products.push(validated);
            } catch (err) {
              logs.push(`⚠️ Invalid product from custom selectors: ${p.title} - ${err}`);
            }
          }
          logs.push(`→ Custom selectors validated ${products.length} products`);
        }
        
        // Phase 2: Try fast extraction methods
        if (products.length === 0 && (action.parseStrategy === "JSONLD" || action.parseStrategy === "HYBRID")) {
          products = products.concat(parseJsonLd(res.html));
        }
        if (products.length === 0 && (action.parseStrategy === "CSS" || action.parseStrategy === "HYBRID") && action.selectors) {
          products = products.concat(extractProductsHTML(res.html, res.url, action.selectors).map(p => Product.parse(p)));
        }

        // Phase 3: If no products found, use direct Claude extraction (2025 upgrade)
        if (products.length === 0 && cfg.anthropicKey) {
          logs.push("→ No products from selectors, trying direct Claude extraction...");
          const { extractWithClaude } = await import("./direct-extraction");
          const claudeProducts = await extractWithClaude(res.html, res.url, goal, cfg.anthropicKey);
          products = products.concat(claudeProducts);
          if (claudeProducts.length > 0) {
            logs.push(`✓ Claude extracted ${claudeProducts.length} products directly`);
          }
        }
      } catch (error) {
        failureCounters.parsingErrors++;
        logs.push(`Parsing failed: ${error}`);
        cfg.logger?.({
          runId: cfg.runId,
          stage: 'extraction_error',
          timestamp: new Date().toISOString(),
          url: res.url,
          error: error instanceof Error ? error.message : String(error),
          parseStrategy: action.parseStrategy
        });
      }

      const before = results.length;
      merge(results, products);
      const newProducts = results.length - before;
      
      if (products.length === 0) {
        failureCounters.emptyResults++;
      }
      
      logs.push(`Parsed +${newProducts} items (total ${results.length})`);

      cfg.logger?.({
        runId: cfg.runId,
        stage: 'extraction_results',
        timestamp: new Date().toISOString(),
        url: res.url,
        newProducts,
        totalProducts: results.length,
        parseStrategy: action.parseStrategy,
        hasSelectors: !!action.selectors
      });

      // Try simple pagination link discovery
      const nexts = findNextLinks(res.html!, res.url, action.pagination?.selector);
      for (const n of nexts) if (!visited.has(n)) q.push(n);

      cfg.logger?.({
        runId: cfg.runId,
        stage: 'pagination_links',
        timestamp: new Date().toISOString(),
        url: res.url,
        paginationLinks: nexts.length,
        queueSize: q.length
      });

      if (results.length >= (action.stopCriteria?.minProducts ?? 10)) {
        logs.push(`Stop criterion met: ${results.length} >= ${action.stopCriteria?.minProducts}`);
        
        const durationMs = Math.round(performance.now() - startTime);
        const summary = {
          runId: cfg.runId,
          stage: 'scrape_complete_early',
          timestamp: new Date().toISOString(),
          durationMs,
          totalProducts: results.length,
          pagesProcessed,
          stopReason: 'min_products_reached',
          failureCounters,
          successRate: pagesProcessed > 0 ? ((pagesProcessed - failureCounters.httpErrors - failureCounters.noHtml - failureCounters.claudeErrors) / pagesProcessed * 100).toFixed(1) + '%' : '0%'
        };
        
        cfg.logger?.(summary);
        logs.push(`Summary: ${JSON.stringify(summary)}`);
        return results;
      }
    }
  }
  
  const durationMs = Math.round(performance.now() - startTime);
  const summary = {
    runId: cfg.runId,
    stage: 'scrape_complete',
    timestamp: new Date().toISOString(),
    durationMs,
    totalProducts: results.length,
    pagesProcessed,
    stopReason: q.length === 0 ? 'no_more_pages' : 'max_pages_reached',
    failureCounters,
    successRate: pagesProcessed > 0 ? ((pagesProcessed - failureCounters.httpErrors - failureCounters.noHtml - failureCounters.claudeErrors) / pagesProcessed * 100).toFixed(1) + '%' : '0%'
  };
  
  cfg.logger?.(summary);
  logs.push(`Summary: ${JSON.stringify(summary)}`);
  return results;
}

function parseJsonLd(html: string): TProduct[] {
  const out: TProduct[] = [];
  const blocks = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const raw = block.replace(/^.*?>/, "").replace(/<\/script>.*$/, "");
    try {
      const json = JSON.parse(raw);
      const arr = Array.isArray(json) ? json : [json];
      for (const it of arr) {
        const g = it["@graph"] || [it];
        for (const node of g) {
          const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
          if (types?.includes("Product") && node.name) {
            const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            out.push({
              url: offer?.url || node.url || "",
              title: node.name,
              price: offer?.price ? String(offer.price) : undefined,
              image: Array.isArray(node.image) ? node.image[0] : node.image,
              currency: offer?.priceCurrency
            } as TProduct);
          }
        }
      }
    } catch {}
  }
  return out.filter(p => p.url && p.title);
}

function findNextLinks(html: string, base: string, selector?: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cheerio = require("cheerio");
  const $ = cheerio.load(html);
  const cand = selector
    ? $(selector).map((_: number, a: any) => $(a).attr("href") || "").get()
    : $("a[rel='next'], .pagination a.next, a:contains('Next')").map((_: number, a: any) => $(a).attr("href") || "").get();
  const out: string[] = [];
  for (const href of cand) {
    try { out.push(new URL(href, base).toString()); } catch {}
  }
  return [...new Set(out)];
}

function merge(dst: TProduct[], src: TProduct[]) {
  const seen = new Set(dst.map(p => (p.url || "") + "::" + (p.title || "")));
  for (const p of src) {
    const k = (p.url || "") + "::" + (p.title || "");
    if (!seen.has(k)) { dst.push(p); seen.add(k); }
  }
}
function short(s?: string) { return s ? (s.length > 120 ? s.slice(0,117) + "..." : s) : ""; }
