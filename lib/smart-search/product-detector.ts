export interface ProductDetectionResult {
  isProductPage: boolean
  score: number // 0-100
  metadata: {
    hasPrice: boolean
    hasAddToCart: boolean
    hasProductImages: boolean
    hasStructuredData: boolean
    schemaType?: string
  }
}

/**
 * Detects if a given HTML page is likely a product page
 * Uses multiple heuristics and pattern matching
 */
export async function detectProductPage(
  url: string,
  html: string
): Promise<ProductDetectionResult> {
  let score = 0
  const metadata = {
    hasPrice: false,
    hasAddToCart: false,
    hasProductImages: false,
    hasStructuredData: false,
    schemaType: undefined as string | undefined,
  }

  // Convert to lowercase for case-insensitive matching
  const htmlLower = html.toLowerCase()

  // 1. Check for Schema.org Product markup (highest confidence +40)
  const schemaPatterns = [
    /"@type"\s*:\s*"product"/i,
    /"@type":\s*"product"/i,
    /'@type'\s*:\s*'product'/i,
    /itemtype="https?:\/\/schema\.org\/product"/i,
  ]

  for (const pattern of schemaPatterns) {
    if (pattern.test(html)) {
      score += 40
      metadata.hasStructuredData = true
      metadata.schemaType = 'Product'
      break
    }
  }

  // 2. Check for price indicators (+20)
  const pricePatterns = [
    /\$\d+\.?\d*/,
    /€\d+\.?\d*/,
    /£\d+\.?\d*/,
    /price["\s:]+\d+/i,
    /USD|EUR|GBP|CAD/,
    /<[^>]*class="[^"]*price[^"]*"/i,
    /<[^>]*id="[^"]*price[^"]*"/i,
    /"price":\s*[\d.]+/,
    /itemprop="price"/i,
  ]

  if (pricePatterns.some(pattern => pattern.test(html))) {
    score += 20
    metadata.hasPrice = true
  }

  // 3. Check for add to cart button (+20)
  const cartPatterns = [
    /add to cart/i,
    /add-to-cart/i,
    /addtocart/i,
    /buy now/i,
    /buy-now/i,
    /add to bag/i,
    /add to basket/i,
    /purchase/i,
    /checkout/i,
    /<button[^>]*>.*add.*cart/i,
  ]

  if (cartPatterns.some(pattern => pattern.test(html))) {
    score += 20
    metadata.hasAddToCart = true
  }

  // 4. Check for product images/gallery (+10)
  const imagePatterns = [
    /product-image/i,
    /product_image/i,
    /productimage/i,
    /gallery/i,
    /carousel/i,
    /product-photo/i,
    /image-gallery/i,
    /product-slider/i,
    /zoom-image/i,
  ]

  if (imagePatterns.some(pattern => pattern.test(html))) {
    score += 10
    metadata.hasProductImages = true
  }

  // 5. Check for common e-commerce platforms (+10)
  const platformIndicators = [
    'shopify',
    'woocommerce',
    'magento',
    'bigcommerce',
    'squarespace-commerce',
    'opencart',
    'prestashop',
  ]

  if (platformIndicators.some(platform => htmlLower.includes(platform))) {
    score += 10
  }

  // 6. Check for product-specific metadata (+5)
  const metaPatterns = [
    /og:type["']\s*content=["']product/i,
    /product:price/i,
    /product:brand/i,
    /product:availability/i,
  ]

  if (metaPatterns.some(pattern => pattern.test(html))) {
    score += 5
  }

  // 7. Check URL patterns that indicate product pages (+5)
  const urlPatterns = [
    /\/product\//i,
    /\/products\//i,
    /\/item\//i,
    /\/p\//i,
    /\/dp\//i, // Amazon
    /\/itm\//i, // eBay
  ]

  if (urlPatterns.some(pattern => pattern.test(url))) {
    score += 5
  }

  // 8. Penalize patterns that indicate non-product pages
  const nonProductPatterns = [
    /\/blog\//i,
    /\/article\//i,
    /\/news\//i,
    /\/about/i,
    /\/contact/i,
    /\/cart/i,
    /\/checkout/i,
    /\/category\//i,
    /\/collection\//i,
    /\/search/i,
  ]

  if (nonProductPatterns.some(pattern => pattern.test(url))) {
    score = Math.max(0, score - 20)
  }

  // Clamp score to 0-100
  score = Math.min(100, Math.max(0, score))

  return {
    isProductPage: score >= 50, // Threshold for classification
    score,
    metadata,
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

/**
 * Check if domain should be excluded from search
 */
export function shouldExcludeDomain(domain: string): boolean {
  const excludedDomains = [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'youtube.com',
    'pinterest.com',
    'reddit.com',
    'linkedin.com',
    'wikipedia.org',
    'google.com',
    'bing.com',
    'yahoo.com',
  ]

  return excludedDomains.some(excluded => domain.includes(excluded))
}
