import { NextRequest, NextResponse } from "next/server";
import { scrapeProducts } from "@/lib/agent";
import { auth } from "@/lib/auth";
import { saveScrapeRun, db } from "@/lib/db";
import { scrapingJobs, scrapedProducts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

export const runtime = "nodejs";
export const preferredRegion = "home";

const Body = z.object({
  url: z.string().url(),
  goal: z.string().optional().default("Extract all products with prices, titles, images, and product details including descriptions, brands, ratings, and SKUs when available")
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const session = await auth();
  
  try {
    const json = await req.json();
    const { url, goal } = Body.parse(json);

    // Create job in database if user is authenticated
    let jobId: string | undefined;

    if (session?.user?.id) {
      const [job] = await db.insert(scrapingJobs).values({
        userId: session.user.id,
        url,
        goal: goal!,
        status: 'running',
        startedAt: new Date(),
        config: { maxTotalPages: 12 },
      }).returning();

      jobId = job.id;
    }

    // Generate run ID for tracking
    const runId = jobId || nanoid();

    // Determine LLM provider from environment
    const llmProvider = (process.env.LLM_PROVIDER as 'anthropic' | 'ollama') || 'ollama';

    const logs: string[] = [];
    
    const products = await scrapeProducts(url, goal!, {
      anthropicKey: process.env.ANTHROPIC_API_KEY || "",
      userId: session?.user?.id, // Pass userId for categorization
      browser: undefined,
      maxTotalPages: 12,
      logs,
      runId,
      llmProvider,
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.3',
      logger: (event) => {
        console.log(`[${runId}] ${event.stage}:`, event);
      }
    });

    const duration = Date.now() - startTime;
    const finishedAt = new Date();

    // Save products and update job if authenticated
    if (jobId && session?.user?.id) {
      if (products.length > 0) {
        await db.insert(scrapedProducts).values(
          products.map(p => ({
            jobId,
            categoryId: (p as any).categoryId || null,
            url: p.url,
            title: p.title,
            price: p.price,
            image: p.image,
            inStock: p.inStock,
            sku: p.sku,
            currency: p.currency,
            description: (p as any).description || null,
            brand: (p as any).brand || null,
            rating: (p as any).rating || null,
            reviewCount: (p as any).reviewCount || null,
            breadcrumbs: p.breadcrumbs,
            extra: p.extra,
          }))
        );
      }

      await db.update(scrapingJobs)
        .set({
          status: 'completed',
          completedAt: finishedAt,
          productsFound: products.length,
          logs,
          pagesProcessed: logs.filter(l => l.includes('Fetch HTTP')).length,
        })
        .where(eq(scrapingJobs.id, jobId));

      // Record metrics for insights dashboard
      await saveScrapeRun({
        runId,
        userId: session.user.id,
        startedAt: new Date(startTime),
        finishedAt,
        totalProducts: products.length,
        metrics: {
          durationMs: duration,
          pagesProcessed: logs.filter(l => l.includes('Fetch HTTP')).length,
          stopReason: products.length >= 10 ? 'min_products_reached' : 'scrape_complete',
          startUrl: url,
          goal: goal!,
          successRate: products.length > 0 ? '100%' : '0%',
          failureCounters: {
            httpErrors: 0,
            noHtml: 0,
            claudeErrors: 0,
            parsingErrors: 0,
            emptyResults: products.length === 0 ? 1 : 0,
            totalPages: logs.filter(l => l.includes('Fetch HTTP')).length
          }
        }
      });
    }

    // Enhanced logs with categorization info
    const enhancedLogs = [
      ...logs,
      `API: returned ${products.length} items`,
      `Duration: ${duration}ms`
    ];

    return NextResponse.json({ 
      products, 
      logs: enhancedLogs,
      stats: {
        pagesProcessed: logs.filter(l => l.includes('Fetch HTTP')).length,
        productsFound: products.length,
        duration
      }
    });
  } catch (e: any) {
    const duration = Date.now() - startTime;
    
    // Record failed run metrics if user is authenticated
    if (session?.user?.id) {
      await saveScrapeRun({
        runId: nanoid(),
        userId: session.user.id,
        startedAt: new Date(startTime),
        finishedAt: new Date(),
        totalProducts: 0,
        metrics: {
          durationMs: duration,
          stopReason: 'error',
          startUrl: req.url,
          successRate: '0%',
          failureCounters: {
            httpErrors: 0,
            noHtml: 0,
            claudeErrors: 1,
            parsingErrors: 1,
            emptyResults: 1,
            totalPages: 0
          }
        }
      });
    }
    
    return NextResponse.json(
      { error: e?.message || "Bad Request" }, 
      { status: 400 }
    );
  }
}
