import { Product, TProduct } from "./schemas";
import * as cheerio from "cheerio";

/**
 * Direct Claude extraction - uses Claude to extract products directly from HTML
 * This is the 2025 best practice when CSS selectors fail or for complex pages
 */
export async function extractWithClaude(
  html: string,
  url: string,
  goal: string,
  anthropicKey: string
): Promise<TProduct[]> {
  // Preprocess HTML to reduce tokens
  const simplified = simplifyHTMLForExtraction(html);

  const system = `You are a precise data extraction assistant. Extract product information from HTML.

CRITICAL RULES:
1. Do NOT fabricate or invent data - only extract what is clearly present
2. Return ONLY the JSON array, no explanations or markdown
3. If no products found, return empty array: []
4. Each product MUST have at least a title and url
5. Be conservative - skip unclear items rather than guess

Return format: Array of products matching this schema:
{
  "url": "full product URL",
  "title": "product name",
  "price": "price as string (optional)",
  "image": "image URL (optional)",
  "inStock": true/false (optional),
  "currency": "USD/EUR/etc (optional)",
  "sku": "product SKU (optional)"
}`;

  const user = `**BASE URL:** ${url}

**EXTRACTION GOAL:** ${goal}

**HTML CONTENT:**
\`\`\`html
${simplified}
\`\`\`

**TASK:**
Extract all products from this HTML. Return a JSON array of products. Each product must have at minimum a title and URL. Make URLs absolute using the base URL provided.

Return ONLY the JSON array, nothing else.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0.1, // Very low temperature for consistent extraction
        system,
        messages: [{ role: "user", content: user }]
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/\[[\s\S]*\]/);

    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    const products = JSON.parse(jsonText);

    // Validate each product
    if (!Array.isArray(products)) {
      console.error("Claude returned non-array:", products);
      return [];
    }

    const validated: TProduct[] = [];
    for (const p of products) {
      try {
        // Make URL absolute
        if (p.url && !p.url.startsWith('http')) {
          p.url = new URL(p.url, url).toString();
        }
        if (p.image && !p.image.startsWith('http')) {
          p.image = new URL(p.image, url).toString();
        }

        const validProduct = Product.parse(p);
        validated.push(validProduct);
      } catch (err) {
        console.warn("Invalid product from Claude:", p, err);
      }
    }

    return validated;

  } catch (error: any) {
    console.error("Direct Claude extraction failed:", error.message);
    return [];
  }
}

/**
 * Simplifies HTML for extraction - keeps semantic content, removes noise
 */
function simplifyHTMLForExtraction(html: string): string {
  const $ = cheerio.load(html);

  // Remove all scripts, styles, and other noise
  $('script, style, noscript, iframe, svg, link, meta, head').remove();

  // Remove attributes that aren't useful for extraction
  $('*').each((_, el) => {
    const $el = $(el);
    const element = el as any; // Type assertion for cheerio element
    // Keep only semantic attributes
    const attrs = Object.keys(element.attribs || {});
    for (const attr of attrs) {
      if (!['href', 'src', 'alt', 'title', 'data-price', 'data-sku', 'itemprop', 'itemtype'].includes(attr)) {
        $el.removeAttr(attr);
      }
    }
  });

  // Get main content area
  const mainContent = $('main, #main, .main, [role="main"]').first().html() || $('body').html() || '';

  // Limit size
  return mainContent.substring(0, 80000); // ~80k chars = ~20k tokens
}
