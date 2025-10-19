import { HttpFetcher, ManagedBrowser, extractProductsHTML, BrowserClient } from "./tools";
import { PageObservation, Product, TProduct, TPageObservation } from "./schemas";
import { askClaudeForDecision } from "./brain";

type Cfg = { anthropicKey: string; browser?: BrowserClient; maxTotalPages?: number; logs?: string[] };

export async function scrapeProducts(startUrl: string, goal: string, cfg: Cfg) {
  if (!cfg.anthropicKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const logs: string[] = cfg.logs ?? [];
  const results: TProduct[] = [];
  const visited = new Set<string>();
  const q: string[] = [startUrl];
  let pagesProcessed = 0;

  while (q.length && pagesProcessed < (cfg.maxTotalPages ?? 20)) {
    const url = q.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    logs.push(`Fetch HTTP: ${url}`);
    const observation: TPageObservation = await HttpFetcher.fetch(url);
    const decision = await askClaudeForDecision(observation, goal, cfg.anthropicKey);
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
      if (!res.html) { logs.push("No HTML returned"); continue; }

      let products: TProduct[] = [];

      // Phase 1: Try fast extraction methods first
      if (action.parseStrategy === "JSONLD" || action.parseStrategy === "HYBRID") {
        products = products.concat(parseJsonLd(res.html));
      }
      if ((action.parseStrategy === "CSS" || action.parseStrategy === "HYBRID") && action.selectors) {
        products = products.concat(extractProductsHTML(res.html, res.url, action.selectors).map(p => Product.parse(p)));
      }

      // Phase 2: If no products found, use direct Claude extraction (2025 upgrade)
      if (products.length === 0 && cfg.anthropicKey) {
        logs.push("→ No products from selectors, trying direct Claude extraction...");
        const { extractWithClaude } = await import("./direct-extraction");
        const claudeProducts = await extractWithClaude(res.html, res.url, goal, cfg.anthropicKey);
        products = products.concat(claudeProducts);
        if (claudeProducts.length > 0) {
          logs.push(`✓ Claude extracted ${claudeProducts.length} products directly`);
        }
      }

      const before = results.length;
      merge(results, products);
      logs.push(`Parsed +${results.length - before} items (total ${results.length})`);

      // Try simple pagination link discovery
      const nexts = findNextLinks(res.html!, res.url, action.pagination?.selector);
      for (const n of nexts) if (!visited.has(n)) q.push(n);

      if (results.length >= (action.stopCriteria?.minProducts ?? 10)) {
        logs.push(`Stop criterion met: ${results.length} >= ${action.stopCriteria?.minProducts}`);
        return results;
      }
    }
  }
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
