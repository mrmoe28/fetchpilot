import { AgentDecision, PageObservation, TAgentDecision } from "./schemas";
import * as cheerio from "cheerio";

/**
 * Preprocesses HTML to optimize for Claude token usage
 * Removes scripts, styles, comments and keeps only semantic content
 */
function preprocessHTML(html: string): string {
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, noscript, iframe, svg, meta, link[rel="stylesheet"]').remove();
  $('*').removeAttr('style').removeAttr('onclick').removeAttr('onload');

  // Remove comments
  $('*').contents().filter(function() {
    return this.type === 'comment';
  }).remove();

  // Get body content only
  const body = $('body').html() || $.html();

  // Simplify whitespace
  return body.replace(/\s+/g, ' ').substring(0, 50000); // Limit to ~50k chars
}

/**
 * Extracts sample HTML snippets that likely contain product information
 */
function extractSampleProducts(html: string): string {
  const $ = cheerio.load(html);

  // Look for common product container patterns
  const productSelectors = [
    '[data-product]', '[data-item]', '.product', '.product-card', '.product-item',
    '[itemtype*="Product"]', '.item', 'article', 'li[class*="product"]'
  ];

  let samples = '';
  for (const sel of productSelectors) {
    const elements = $(sel).slice(0, 3); // Get first 3 matches
    if (elements.length > 0) {
      samples += `\n<!-- Sample from selector: ${sel} -->\n`;
      elements.each((_, el) => {
        samples += $.html(el).substring(0, 1000) + '\n';
      });
      break; // Found products, don't need more selectors
    }
  }

  // If no products found, get general structure sample
  if (!samples) {
    samples = $('main, #main, .main, body').first().html()?.substring(0, 3000) || '';
  }

  return samples;
}

export async function askClaudeForDecision(obs: typeof PageObservation._type, goal: string, anthropicKey: string): Promise<TAgentDecision> {
  if (!obs.html) {
    throw new Error("No HTML content to analyze");
  }

  // Preprocess HTML for better Claude performance
  const sampleProducts = extractSampleProducts(obs.html);

  const system = `You are an expert web scraping strategist. Analyze HTML structure and generate optimal extraction strategies.

CRITICAL RULES:
1. Do NOT fabricate data or selectors - only use what you see in the HTML
2. Be SPECIFIC with selectors - use actual class names, data attributes, or IDs from the HTML
3. Prefer JSON-LD extraction when available (check hasJsonLd signal)
4. Test your selector strategy mentally before responding
5. If uncertain, ask for clarification rather than guessing

Your response MUST be valid JSON matching the AgentDecision schema.`;

  const user = `**GOAL:** ${goal}

**PAGE SIGNALS:**
- URL: ${obs.url}
- Status: ${obs.status}
- Has JSON-LD: ${obs.domSignals?.hasJsonLd ? 'YES' : 'NO'}
- Links: ${obs.domSignals?.numLinks}
- Images: ${obs.domSignals?.numImages}

**SAMPLE HTML STRUCTURE:**
\`\`\`html
${sampleProducts}
\`\`\`

**TASK:**
Analyze this HTML and create an extraction strategy. Return a JSON object with:
{
  "rationale": "Brief explanation of your strategy (1-2 sentences)",
  "actions": [{
    "mode": "HTTP" or "BROWSER" (use BROWSER only if page appears to require JavaScript),
    "parseStrategy": "JSONLD" if hasJsonLd=true, "CSS" for CSS selectors, "HYBRID" for both,
    "selectors": {
      "item": "CSS selector for product containers (be specific)",
      "link": "CSS selector for product links within items",
      "title": "CSS selector for product titles within items",
      "price": "CSS selector for prices within items",
      "image": "CSS selector for product images within items"
    },
    "pagination": {
      "type": "LINK",
      "selector": "CSS selector for next page link",
      "maxPages": 5
    },
    "antiLazy": {
      "scroll": false,
      "waitMs": 800,
      "maxScrolls": 0
    },
    "retry": {
      "maxAttempts": 3,
      "strategy": "JITTER"
    },
    "stopCriteria": {
      "minProducts": 10
    }
  }]
}

IMPORTANT: Base selectors on the ACTUAL HTML provided, not generic patterns. If you cannot identify clear product patterns, say so in the rationale.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022", // Specific model version
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent output
        system,
        messages: [{ role: "user", content: user }]
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Claude API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";

    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonText);

    // Validate with Zod schema
    const validated = AgentDecision.parse(parsed);
    return validated;

  } catch (error: any) {
    console.error("Claude API error:", error);

    // Smarter fallback based on observations
    const hasJsonLd = obs.domSignals?.hasJsonLd;

    return {
      rationale: `Fallback strategy: ${hasJsonLd ? 'Using JSON-LD extraction' : 'Generic CSS selectors'} due to API error: ${error.message}`,
      actions: [{
        mode: "HTTP",
        parseStrategy: hasJsonLd ? "JSONLD" : "HYBRID",
        selectors: {
          item: "article, .product, .product-card, [data-product], li.item",
          link: "a[href]",
          title: "h2, h3, .title, .product-title, .name",
          price: ".price, [class*='price'], [class*='cost']",
          image: "img"
        },
        pagination: {
          type: "LINK",
          selector: "a[rel='next'], .pagination a.next, a:contains('Next'), .next-page",
          maxPages: 5
        },
        antiLazy: { scroll: false, waitMs: 800, maxScrolls: 0 },
        retry: { maxAttempts: 3, strategy: "JITTER" },
        stopCriteria: { minProducts: 10 }
      }]
    };
  }
}
