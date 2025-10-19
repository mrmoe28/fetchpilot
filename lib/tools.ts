import * as cheerio from "cheerio";

export interface FetchResult {
  url: string;
  status?: number;
  html?: string;
  domSignals?: { numLinks?: number; numImages?: number; hasJsonLd?: boolean; scrollHeight?: number; };
}

export const HttpFetcher = {
  fetch: async (url: string): Promise<FetchResult> => {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA() } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
    return {
      url: res.url,
      status: res.status,
      html,
      domSignals: { numLinks: $("a").length, numImages: $("img").length, hasJsonLd },
    };
  },
};

export interface BrowserClient {
  openPage(input: { url: string; scroll?: { times: number; waitMs: number }; clickSelector?: string; waitMs?: number }): Promise<FetchResult>;
}

export const ManagedBrowser: BrowserClient | undefined = process.env.BROWSER_WORKER_URL
  ? {
      openPage: async (input) => {
        const res = await fetch(process.env.BROWSER_WORKER_URL!, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error("Browser worker error");
        return await res.json();
      }
    }
  : undefined;

export function extractProductsHTML(html: string, baseUrl: string, sel: { item?: string; link?: string; title?: string; price?: string; image?: string }) {
  const out: any[] = [];
  const $ = cheerio.load(html);
  const toAbs = (href?: string) => {
    if (!href) return "";
    try { return new URL(href, baseUrl).toString(); } catch { return href; }
  };

  if (sel.item) {
    $(sel.item).each((_, el) => {
      const url = sel.link ? $(el).find(sel.link).attr("href") || "" : "";
      const title = sel.title ? $(el).find(sel.title).text().trim() : "";
      const price = sel.price ? $(el).find(sel.price).text().trim() : undefined;
      const image = sel.image ? ($(el).find(sel.image).attr("src") || $(el).find(sel.image).attr("data-src") || $(el).find(sel.image).attr("srcset")?.split(" ").shift()) : undefined;
      if (url && title) out.push({ url: toAbs(url), title, price, image });
    });
  }
  return out;
}

function UA() { return "Mozilla/5.0 (compatible; FetchPilot/1.0; +https://example.com/bot)"; }
