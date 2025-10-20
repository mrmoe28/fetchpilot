import { TProduct } from './schemas'
import { db } from './db'
import { categories } from './db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

interface ClassificationResult {
  categoryId: string
  categoryName: string
  createdCategory?: boolean
  confidence?: number
}

interface ClassifyProductOptions {
  product: TProduct
  userId: string
  goal: string
  anthropicKey?: string
  llmProvider?: 'anthropic' | 'ollama'
  ollamaBaseUrl?: string
  ollamaModel?: string
  runId?: string
  logger?: (event: any) => void
}

// Simple in-memory cache for classification results within a run
const classificationCache = new Map<string, ClassificationResult>()

// Helper to generate cache key
function getCacheKey(product: TProduct, goal: string, runId?: string): string {
  const productHash = crypto
    .createHash('md5')
    .update(JSON.stringify({ title: product.title, url: product.url, price: product.price }))
    .digest('hex')
    .substring(0, 8)
  
  return `${runId || 'global'}:${productHash}:${crypto.createHash('md5').update(goal).digest('hex').substring(0, 8)}`
}

export async function classifyProduct(options: ClassifyProductOptions): Promise<ClassificationResult> {
  const { product, userId, goal, anthropicKey, llmProvider = 'anthropic', ollamaBaseUrl = 'http://localhost:11434', ollamaModel = 'llama3.3', runId, logger } = options
  
  const startTime = performance.now()
  
  // Check cache first
  const cacheKey = getCacheKey(product, goal, runId)
  const cached = classificationCache.get(cacheKey)
  if (cached) {
    logger?.({
      runId,
      stage: 'product_classification_cached',
      timestamp: new Date().toISOString(),
      productTitle: product.title?.substring(0, 50) + '...',
      categoryName: cached.categoryName,
      fromCache: true
    })
    return cached
  }

  logger?.({
    runId,
    stage: 'product_classification_start',
    timestamp: new Date().toISOString(),
    productTitle: product.title?.substring(0, 50) + '...',
    hasAnthropicKey: !!anthropicKey,
    llmProvider
  })

  // If no LLM API key available, use fallback classification
  if (llmProvider === 'anthropic' && !anthropicKey) {
    logger?.({
      runId,
      stage: 'product_classification_fallback',
      timestamp: new Date().toISOString(),
      reason: 'no_anthropic_key',
      productTitle: product.title?.substring(0, 50) + '...'
    })
    return await fallbackClassification(product, userId, goal, runId, logger)
  }

  try {
    // Get user's existing categories
    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      columns: {
        id: true,
        name: true,
        description: true
      }
    })

    const existingCategoryNames = userCategories.map(c => c.name)
    
    // Call LLM for classification
    const classification = await callLLMForClassification({
      product,
      goal,
      existingCategories: existingCategoryNames,
      anthropicKey: anthropicKey!,
      llmProvider,
      ollamaBaseUrl,
      ollamaModel,
      runId,
      logger
    })

    // Check if we need to create a new category
    let categoryId: string
    let createdCategory = false
    
    const existingCategory = userCategories.find(c => 
      c.name.toLowerCase() === classification.categoryName.toLowerCase()
    )

    if (existingCategory) {
      categoryId = existingCategory.id
    } else {
      // Create new category
      const [newCategory] = await db.insert(categories).values({
        userId,
        name: classification.categoryName,
        description: `Auto-created category for ${classification.categoryName} products`,
        color: getColorForCategory(classification.categoryName),
        icon: getIconForCategory(classification.categoryName)
      }).returning()
      
      categoryId = newCategory.id
      createdCategory = true

      logger?.({
        runId,
        stage: 'category_created',
        timestamp: new Date().toISOString(),
        categoryName: classification.categoryName,
        categoryId
      })
    }

    const result: ClassificationResult = {
      categoryId,
      categoryName: classification.categoryName,
      createdCategory,
      confidence: classification.confidence
    }

    // Cache the result
    classificationCache.set(cacheKey, result)
    
    const durationMs = Math.round(performance.now() - startTime)
    logger?.({
      runId,
      stage: 'product_classification_complete',
      timestamp: new Date().toISOString(),
      productTitle: product.title?.substring(0, 50) + '...',
      categoryName: classification.categoryName,
      createdCategory,
      confidence: classification.confidence,
      durationMs
    })

    return result

  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger?.({
      runId,
      stage: 'product_classification_error',
      timestamp: new Date().toISOString(),
      productTitle: product.title?.substring(0, 50) + '...',
      error: error instanceof Error ? error.message : String(error),
      durationMs,
      fallbackUsed: true
    })

    // Use fallback classification on error
    return await fallbackClassification(product, userId, goal, runId, logger)
  }
}

interface LLMClassificationResult {
  categoryName: string
  confidence?: number
  reasoning?: string
}

async function callLLMForClassification(options: {
  product: TProduct
  goal: string
  existingCategories: string[]
  anthropicKey: string
  llmProvider: 'anthropic' | 'ollama'
  ollamaBaseUrl?: string
  ollamaModel?: string
  runId?: string
  logger?: (event: any) => void
}): Promise<LLMClassificationResult> {
  const { product, goal, existingCategories, anthropicKey, llmProvider, ollamaBaseUrl = 'http://localhost:11434', ollamaModel = 'llama3.3', runId, logger } = options

  const system = `You are a product categorization expert. Your job is to analyze products and assign them to appropriate categories.

CRITICAL RULES:
1. Categories should be broad enough to group similar products but specific enough to be useful
2. Prefer existing categories when the product clearly fits
3. Only suggest new categories when the product doesn't fit existing ones
4. Category names should be 1-3 words, title case (e.g., "Electronics", "Home & Garden", "Sports Equipment")
5. Be consistent - similar products should go in the same category
6. Respond with valid JSON only

Your response MUST be valid JSON matching this format:
{
  "categoryName": "Category Name",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`

  const userPrompt = `**PRODUCT TO CATEGORIZE:**
- Title: ${product.title || 'N/A'}
- Price: ${product.price || 'N/A'}
- Brand: ${product.brand || 'N/A'}
- Description: ${product.description || 'N/A'}
- URL: ${product.url || 'N/A'}

**SCRAPING GOAL CONTEXT:** ${goal}

**EXISTING USER CATEGORIES:**
${existingCategories.length > 0 ? existingCategories.map(c => `- ${c}`).join('\n') : '(No existing categories)'}

**TASK:**
Analyze this product and determine the most appropriate category. If it fits an existing category, use that. If not, suggest a new category name.

Return JSON with categoryName, confidence (0-1), and reasoning.`

  try {
    let res: Response

    if (llmProvider === 'ollama') {
      res = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt }
          ],
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 500,
          }
        }),
      })
    } else {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 500,
          temperature: 0.1,
          system,
          messages: [{ role: "user", content: userPrompt }]
        }),
      })
    }

    if (!res.ok) {
      throw new Error(`LLM API error (${res.status}): ${await res.text()}`)
    }

    const data = await res.json()
    let text: string

    if (llmProvider === 'ollama') {
      text = data?.message?.content ?? ""
    } else {
      text = data?.content?.[0]?.text ?? ""
    }

    // Extract JSON from response
    let jsonText = text
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Clean and parse JSON
    jsonText = jsonText
      .trim()
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys

    const parsed = JSON.parse(jsonText)
    
    return {
      categoryName: parsed.categoryName || 'Uncategorized',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning
    }

  } catch (error) {
    logger?.({
      runId,
      stage: 'llm_classification_error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      productTitle: product.title?.substring(0, 50) + '...'
    })
    
    throw error
  }
}

async function fallbackClassification(
  product: TProduct, 
  userId: string, 
  goal: string, 
  runId?: string, 
  logger?: (event: any) => void
): Promise<ClassificationResult> {
  // Simple rule-based classification as fallback
  const title = (product.title || '').toLowerCase()
  const price = product.price || ''
  
  let categoryName = 'General'
  
  // Basic categorization rules
  if (title.includes('book') || title.includes('novel') || title.includes('magazine')) {
    categoryName = 'Books'
  } else if (title.includes('electronic') || title.includes('computer') || title.includes('phone') || title.includes('laptop')) {
    categoryName = 'Electronics'
  } else if (title.includes('clothing') || title.includes('shirt') || title.includes('dress') || title.includes('shoe')) {
    categoryName = 'Clothing'
  } else if (title.includes('home') || title.includes('kitchen') || title.includes('furniture')) {
    categoryName = 'Home & Garden'
  } else if (title.includes('sport') || title.includes('fitness') || title.includes('game')) {
    categoryName = 'Sports & Recreation'
  } else if (title.includes('beauty') || title.includes('cosmetic') || title.includes('health')) {
    categoryName = 'Health & Beauty'
  } else if (title.includes('car') || title.includes('auto') || title.includes('vehicle')) {
    categoryName = 'Automotive'
  } else if (price && parseFloat(price.replace(/[^0-9.]/g, '')) > 1000) {
    categoryName = 'High Value Items'
  }

  // Check if category exists, create if not
  const existingCategory = await db.query.categories.findFirst({
    where: and(
      eq(categories.userId, userId),
      eq(categories.name, categoryName)
    )
  })

  let categoryId: string
  let createdCategory = false

  if (existingCategory) {
    categoryId = existingCategory.id
  } else {
    const [newCategory] = await db.insert(categories).values({
      userId,
      name: categoryName,
      description: `Auto-created category for ${categoryName} products`,
      color: getColorForCategory(categoryName),
      icon: getIconForCategory(categoryName)
    }).returning()
    
    categoryId = newCategory.id
    createdCategory = true
  }

  logger?.({
    runId,
    stage: 'fallback_classification_complete',
    timestamp: new Date().toISOString(),
    productTitle: product.title?.substring(0, 50) + '...',
    categoryName,
    createdCategory,
    confidence: 0.3
  })

  return {
    categoryId,
    categoryName,
    createdCategory,
    confidence: 0.3
  }
}

// Helper functions for category styling
function getColorForCategory(categoryName: string): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]
  
  // Generate consistent color based on category name
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash + categoryName.charCodeAt(i)) & 0xffffffff
  }
  
  return colors[Math.abs(hash) % colors.length]
}

function getIconForCategory(categoryName: string): string {
  const iconMap: Record<string, string> = {
    'Electronics': 'laptop',
    'Books': 'book',
    'Clothing': 'shirt',
    'Home & Garden': 'home',
    'Sports & Recreation': 'activity',
    'Health & Beauty': 'heart',
    'Automotive': 'car',
    'Food & Beverage': 'coffee',
    'Toys & Games': 'gamepad2',
    'High Value Items': 'diamond',
    'General': 'folder',
    'Uncategorized': 'help-circle'
  }
  
  return iconMap[categoryName] || 'folder'
}

// Clear cache function (useful for testing or memory management)
export function clearClassificationCache() {
  classificationCache.clear()
}
