import { NextRequest } from "next/server";
import { scrapeProducts } from "@/lib/agent";
import { z } from "zod";

export const runtime = "nodejs";
export const preferredRegion = "home";

const Body = z.object({
  url: z.string().url(),
  goal: z.string().optional().default("Extract product cards and canonical links")
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { url, goal } = Body.parse(json);
    const products = await scrapeProducts(url, goal!, {
      anthropicKey: process.env.ANTHROPIC_API_KEY || "",
      browser: undefined, // Coordinator prefers HTTP; browser worker is invoked inside tools if envs are set
      maxTotalPages: 12
    });

    return new Response(JSON.stringify({ products, logs: ["API: returned " + products.length + " items"] }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    return new Response(e?.message || "Bad Request", { status: 400 });
  }
}
