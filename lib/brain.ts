import { AgentDecision, PageObservation, TAgentDecision } from "./schemas";

export async function askClaudeForDecision(obs: typeof PageObservation._type, goal: string, anthropicKey: string): Promise<TAgentDecision> {
  const system = `ROLE: Scraping Strategist
Return STRICT JSON conforming to AgentDecision schema. Choose mode (HTTP/BROWSER), parseStrategy (CSS/XPATH/JSONLD/HYBRID), selectors, pagination plan, anti-lazy, retry, stop criteria. Prefer HTTP when content appears server-rendered or JSON-LD present; else BROWSER.`;

  const user = `
Goal: ${goal}
Observation: ${JSON.stringify(obs)}
Schema keys: AgentDecision { rationale?, actions[] { mode, parseStrategy, selectors{item,link,title,price,image}, pagination{type,selector?,paramKey?,maxPages}, antiLazy{scroll,waitMs,maxScrolls}, retry{maxAttempts,strategy}, stopCriteria{minProducts} }}
Return JSON only.
`.trim();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: "claude-3-5-sonnet-latest", max_tokens: 1200, system, messages: [{ role: "user", content: user }] }),
  });

  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    // Fallback decision if JSON parse fails
    return {
      rationale: "Fallback to HTTP + HYBRID selectors",
      actions: [{
        mode: "HTTP",
        parseStrategy: "HYBRID",
        selectors: { item: "[data-product], .product-card, li.product, .item", link: "a[href]", title: "h2, .title, .product-title", price: ".price, [class*='price']", image: "img" },
        pagination: { type: "LINK", selector: "a[rel='next'], .pagination a.next, a:contains('Next')", maxPages: 5 },
        antiLazy: { scroll: false, waitMs: 600, maxScrolls: 0 },
        retry: { maxAttempts: 3, strategy: "JITTER" },
        stopCriteria: { minProducts: 10 }
      }]
    };
  }
}
