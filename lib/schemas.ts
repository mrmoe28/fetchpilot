import { z } from "zod";

export const Product = z.object({
  url: z.string().url(),
  title: z.string(),
  price: z.string().optional(),
  image: z.string().url().optional(),
  inStock: z.boolean().optional(),
  sku: z.string().optional(),
  currency: z.string().optional(),
  breadcrumbs: z.array(z.string()).optional(),
  extra: z.record(z.any()).optional(),
});

export const PageObservation = z.object({
  url: z.string().url(),
  status: z.number().optional(),
  html: z.string().optional(),
  domSignals: z.object({
    numLinks: z.number().optional(),
    numImages: z.number().optional(),
    hasJsonLd: z.boolean().optional(),
    scrollHeight: z.number().optional(),
  }).optional(),
  mode: z.enum(["HTTP","BROWSER"]).optional(),
});

export const AgentAction = z.object({
  mode: z.enum(["HTTP","BROWSER"]),
  parseStrategy: z.enum(["CSS","XPATH","JSONLD","HYBRID"]),
  selectors: z.object({
    item: z.string().optional(),
    link: z.string().optional(),
    title: z.string().optional(),
    price: z.string().optional(),
    image: z.string().optional(),
  }).optional(),
  pagination: z.object({
    type: z.enum(["LINK","BUTTON","SCROLL","PARAMS","NONE"]),
    selector: z.string().optional(),
    paramKey: z.string().optional(),
    maxPages: z.number().default(10),
  }),
  antiLazy: z.object({
    scroll: z.boolean().default(false),
    waitMs: z.number().default(800),
    maxScrolls: z.number().default(6),
  }),
  retry: z.object({
    maxAttempts: z.number().default(3),
    strategy: z.enum(["BACKOFF","JITTER"]).default("JITTER"),
  }),
  stopCriteria: z.object({
    minProducts: z.number().default(10),
  }),
});

export const AgentDecision = z.object({
  rationale: z.string().optional(),
  actions: z.array(AgentAction).min(1),
});

export type TProduct = z.infer<typeof Product>;
export type TPageObservation = z.infer<typeof PageObservation>;
export type TAgentDecision = z.infer<typeof AgentDecision>;
