/**
 * Minimal Playwright browser worker (optional).
 * Start with: npm run worker
 * POST http://localhost:8787/openPage { url, scroll?:{times,waitMs}, waitMs? }
 * Returns: { url, status, html, domSignals }
 */
import http from "http";
import { chromium } from "playwright";
const PORT = 8787;

async function handle(body: any) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: "Mozilla/5.0 (compatible; FetchPilot/1.0)" });
  await page.goto(body.url, { waitUntil: "domcontentloaded", timeout: 45000 });
  if (body.waitMs) await page.waitForTimeout(body.waitMs);
  if (body.scroll) {
    for (let i=0; i<body.scroll.times; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(body.scroll.waitMs || 800);
    }
  }
  const html = await page.content();
  const stats = await page.evaluate(() => ({ links: document.querySelectorAll("a").length, images: document.querySelectorAll("img").length, scrollHeight: document.body.scrollHeight }));
  const url = page.url();
  await browser.close();
  return { url, status: 200, html, domSignals: { numLinks: stats.links, numImages: stats.images, scrollHeight: stats.scrollHeight } };
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/openPage") {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", async () => {
      try {
        const body = JSON.parse(data || "{}");
        const out = await handle(body);
        res.setHeader("content-type", "application/json");
        res.writeHead(200); res.end(JSON.stringify(out));
      } catch (e: any) {
        res.writeHead(500); res.end(e?.message || "error");
      }
    });
    return;
  }
  res.writeHead(404); res.end("Not found");
});
server.listen(PORT, () => console.log(`Browser worker on http://localhost:${PORT}`));
