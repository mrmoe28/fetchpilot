import * as cheerio from "cheerio";

export interface FetchResult {
  url: string;
  status?: number;
  html?: string;
  domSignals?: { numLinks?: number; numImages?: number; hasJsonLd?: boolean; scrollHeight?: number; };
}

export const HttpFetcher = {
  fetch: async (url: string): Promise<FetchResult> => {
    const res = await fetch(url, { 
      redirect: "follow", 
      headers: { 
        "User-Agent": UA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": (() => { try { return new URL(url).origin; } catch { return url; } })(),
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      }
    });
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
      if (url && title) out.push({ url: toAbs(url), title, price, image: image ? toAbs(image) : undefined });
    });
  }
  return out;
}

function UA() { 
  const userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
