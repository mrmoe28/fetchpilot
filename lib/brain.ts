import { AgentDecision, PageObservation, TAgentDecision } from "./schemas";
import * as cheerio from "cheerio";

// preprocessHTML function removed - was not being used in current implementation

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

interface ClaudeConfig {
  anthropicKey: string;
  runId?: string;
  logger?: (event: any) => void;
  llmProvider?: 'anthropic' | 'ollama';
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

export async function askClaudeForDecision(obs: typeof PageObservation._type, goal: string, cfg: ClaudeConfig): Promise<TAgentDecision> {
  const startTime = performance.now();
  const { anthropicKey, runId, logger, llmProvider = 'anthropic', ollamaBaseUrl = 'http://localhost:11434', ollamaModel = 'llama3.3' } = cfg;
  
  logger?.({
    runId,
    stage: 'claude_decision_start',
    timestamp: new Date().toISOString(),
    url: obs.url,
    goal: goal.substring(0, 100),
    hasHtml: !!obs.html,
    hasJsonLd: obs.domSignals?.hasJsonLd || false
  });

  if (!obs.html) {
    const error = "No HTML content to analyze";
    logger?.({
      runId,
      stage: 'claude_decision_error',
      timestamp: new Date().toISOString(),
      error,
      durationMs: Math.round(performance.now() - startTime)
    });
    throw new Error(error);
  }

  // Preprocess HTML for better Claude performance
  const sampleProducts = extractSampleProducts(obs.html);

  const system = `You are an expert web scraping strategist. Analyze HTML structure and generate optimal extraction strategies.

CRITICAL RULES:
1. Do NOT fabricate data or selectors - only use what you see in the HTML
2. Be SPECIFIC with selectors - use actual class names, data attributes, or IDs from the HTML
3. Prefer JSON-LD extraction when available (check hasJsonLd signal)
4. ALWAYS prioritize extracting PRICE and product details - these are MANDATORY fields
5. Look for prices in various formats: $XX.XX, €XX, £XX, numbers with currency symbols, .price classes, etc.
6. Test your selector strategy mentally before responding
7. If uncertain, ask for clarification rather than guessing

PRICE EXTRACTION IS MANDATORY - ensure your selectors will capture price information.

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
      "price": "CSS selector for prices - MANDATORY FIELD - look for .price, [class*='price'], .cost, .amount, spans with currency symbols, etc.",
      "image": "CSS selector for product images within items",
      "description": "CSS selector for product description/details (optional)",
      "brand": "CSS selector for brand/manufacturer name (optional)",
      "rating": "CSS selector for product rating (optional)",
      "sku": "CSS selector for SKU/product code (optional)"
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
    // Choose API based on provider
    let res: Response;

    if (llmProvider === 'ollama') {
      // Ollama API call
      res = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 2000,
          }
        }),
      });
    } else {
      // Anthropic API call
      res = await fetch("https://api.anthropic.com/v1/messages", {
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
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`${llmProvider === 'ollama' ? 'Ollama' : 'Claude'} API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();

    // Extract text based on provider
    let text: string;
    if (llmProvider === 'ollama') {
      text = data?.message?.content ?? "";
    } else {
      text = data?.content?.[0]?.text ?? "";
    }
    
    // Capture token usage if available
    const tokenUsage = data?.usage ? {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
    } : undefined;

    // Extract JSON from potential markdown code blocks with better error handling
    let jsonText = text;
    
    // Try multiple extraction patterns
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/,  // Standard json blocks
      /```\s*([\s\S]*?)\s*```/,      // Generic code blocks
      /\{[\s\S]*?\}/,                // First complete JSON object
      /\[[\s\S]*?\]/                 // JSON array
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        jsonText = match[1] || match[0];
        break;
      }
    }
    
    // Clean up common JSON formatting issues
    jsonText = jsonText
      .trim()
      .replace(/^[^{\[]*/, '')  // Remove leading non-JSON text
      .replace(/[^}\]]*$/, '')  // Remove trailing non-JSON text
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\\"/g, '"')  // Fix escaped quotes
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
      .replace(/:\s*([^",\[\]{}\s]+)(\s*[,}])/g, ': "$1"$2')  // Quote unquoted string values

    let parsed;
    let validated;
    let validationSuccess = false;
    let validationError: string | undefined;

    try {
      parsed = JSON.parse(jsonText);
      
      // Validate with Zod schema
      validated = AgentDecision.parse(parsed);
      validationSuccess = true;
    } catch (validationErr) {
      validationError = validationErr instanceof Error ? validationErr.message : 'Unknown validation error';
      
      logger?.({
        runId,
        stage: 'claude_decision_fallback_json',
        timestamp: new Date().toISOString(),
        durationMs: Math.round(performance.now() - startTime),
        error: validationError,
        jsonText: jsonText.substring(0, 200) + '...'
      });
      
      // Use enhanced fallback instead of throwing
      const hasJsonLd = obs.domSignals?.hasJsonLd;
      validated = {
        rationale: `JSON parsing failed, using enhanced fallback selectors: ${validationError}`,
        actions: [{
          mode: "HTTP" as const,
          parseStrategy: hasJsonLd ? "JSONLD" as const : "HYBRID" as const,
          selectors: {
            item: "article.product_pod, article, .product, .product-card, .product-item, [data-product], li.item, .book, .col-lg-3, .col-md-3, [itemtype*='Product']",
            link: "h3 a, a[href*='catalogue'], a[href*='product'], a.product-link, a[href], [itemprop='url']",
            title: "h3 a, h2, h3, .title, .product-title, .name, [alt], [itemprop='name']",
            price: ".price_color, .price, [class*='price'], [class*='cost'], .money, .amount, [itemprop='price'], span:contains('$'), span:contains('€'), span:contains('£')",
            image: ".image_container img, img.thumbnail, img, [itemprop='image']",
            description: ".description, .product-description, [itemprop='description'], .details",
            brand: ".brand, [itemprop='brand'], .manufacturer",
            rating: ".rating, .stars, [itemprop='ratingValue'], .review-rating",
            sku: ".sku, [itemprop='sku'], .product-code"
          },
          pagination: {
            type: "LINK" as const,
            selector: "a[rel='next'], .pagination a.next, a:contains('Next'), .next-page",
            maxPages: 5
          },
          antiLazy: { scroll: false, waitMs: 800, maxScrolls: 0 },
          retry: { maxAttempts: 3, strategy: "JITTER" as const },
          stopCriteria: { minProducts: 10 }
        }]
      };
      validationSuccess = true; // Mark as successful since we have fallback
    } finally {
      const durationMs = Math.round(performance.now() - startTime);
      
      logger?.({
        runId,
        stage: 'claude_decision_complete',
        timestamp: new Date().toISOString(),
        durationMs,
        tokenUsage,
        validationSuccess,
        validationError,
        responseLength: text.length,
        actionsCount: validationSuccess ? validated?.actions?.length : 0
      });
    }

    return validated;

  } catch (error: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage = error.message || 'Unknown error';
    
    logger?.({
      runId,
      stage: 'claude_decision_error',
      timestamp: new Date().toISOString(),
      durationMs,
      error: errorMessage,
      errorType: error.constructor.name,
      fallbackUsed: true
    });
    
    console.error("Claude API error:", error);

    // Smarter fallback based on observations
    const hasJsonLd = obs.domSignals?.hasJsonLd;
    const fallbackDecision = {
      rationale: `Fallback strategy: ${hasJsonLd ? 'Enhanced CSS selectors with JSON-LD' : 'Enhanced CSS selectors'} due to API error: ${errorMessage}`,
      actions: [{
        mode: "HTTP" as const,
        parseStrategy: "HYBRID" as const, // Always use HYBRID to try both JSON-LD and CSS selectors
        selectors: {
          item: "article.product_pod, article, .product, .product-card, .product-item, [data-product], li.item, .book, .col-lg-3, .col-md-3, .col-sm-6, .grid-item, .product-listing-item, div[class*='product'], [itemtype*='Product']",
          link: "h3 a, h4 a, a[href*='catalogue'], a[href*='product'], a.product-link, a[href], [itemprop='url'], .product-title a, .name a",
          title: "h3 a, h4 a, h2, h3, h4, .title, .product-title, .name, .product-name, [alt], [itemprop='name'], .item-title",
          price: ".price_color, .price, [class*='price'], [class*='cost'], .money, .amount, [itemprop='price'], span:contains('$'), span:contains('€'), span:contains('£'), .product-price, .sale-price, .current-price",
          image: ".image_container img, img.thumbnail, img.product-image, img, [itemprop='image'], .product-img img",
          description: ".description, .product-description, [itemprop='description'], .details, .product-details, .item-description",
          brand: ".brand, [itemprop='brand'], .manufacturer, .product-brand, .brand-name",
          rating: ".rating, .stars, [itemprop='ratingValue'], .review-rating, .product-rating",
          sku: ".sku, [itemprop='sku'], .product-code, .item-code, .model"
        },
        pagination: {
          type: "LINK" as const,
          selector: "a[rel='next'], .pagination a.next, a:contains('Next'), .next-page",
          maxPages: 5
        },
        antiLazy: { scroll: false, waitMs: 800, maxScrolls: 0 },
        retry: { maxAttempts: 3, strategy: "JITTER" as const },
        stopCriteria: { minProducts: 10 }
      }]
    };

    logger?.({
      runId,
      stage: 'claude_decision_fallback',
      timestamp: new Date().toISOString(),
      durationMs,
      fallbackStrategy: hasJsonLd ? 'JSONLD' : 'HYBRID',
      actionsCount: 1
    });

    return fallbackDecision;
  }
}
