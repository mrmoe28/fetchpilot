import { pgTable, text, timestamp, integer, boolean, json, uuid, varchar, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Accounts table (for NextAuth)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
})

// Sessions table (for NextAuth)
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

// Verification tokens table (for NextAuth)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
})

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color
  icon: varchar('icon', { length: 50 }).default('folder'), // Icon identifier
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('categories_user_id_idx').on(table.userId),
  nameIdx: index('categories_name_idx').on(table.name),
}))

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#10B981'), // Hex color
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('tags_user_id_idx').on(table.userId),
  nameIdx: index('tags_name_idx').on(table.name),
  userNameIdx: index('tags_user_name_idx').on(table.userId, table.name), // Unique per user
}))

// Site profiles table
export const siteProfiles = pgTable('site_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  lastScrapedAt: timestamp('last_scraped_at'),
  totalScrapes: integer('total_scrapes').default(0),
  successfulScrapes: integer('successful_scrapes').default(0),
  avgResponseTime: integer('avg_response_time'), // milliseconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('site_profiles_user_id_idx').on(table.userId),
  domainIdx: index('site_profiles_domain_idx').on(table.domain),
  userDomainIdx: index('site_profiles_user_domain_idx').on(table.userId, table.domain), // Unique per user
}))

// Scraping jobs table (enhanced)
export const scrapingJobs = pgTable('scraping_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  siteProfileId: uuid('site_profile_id').references(() => siteProfiles.id, { onDelete: 'set null' }),
  url: text('url').notNull(),
  goal: text('goal'),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, running, completed, failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  error: text('error'),
  pagesProcessed: integer('pages_processed').default(0),
  productsFound: integer('products_found').default(0),
  logs: json('logs').$type<string[]>().default([]),
  config: json('config').$type<{
    maxTotalPages?: number
    browserEnabled?: boolean
  }>(),
  isFavorite: boolean('is_favorite').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('scraping_jobs_user_id_idx').on(table.userId),
  statusIdx: index('scraping_jobs_status_idx').on(table.status),
  createdAtIdx: index('scraping_jobs_created_at_idx').on(table.createdAt),
  categoryIdIdx: index('scraping_jobs_category_id_idx').on(table.categoryId),
  siteProfileIdIdx: index('scraping_jobs_site_profile_id_idx').on(table.siteProfileId),
  isFavoriteIdx: index('scraping_jobs_is_favorite_idx').on(table.isFavorite),
}))

// Job tags junction table (many-to-many)
export const jobTags = pgTable('job_tags', {
  jobId: uuid('job_id').notNull().references(() => scrapingJobs.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  jobIdIdx: index('job_tags_job_id_idx').on(table.jobId),
  tagIdIdx: index('job_tags_tag_id_idx').on(table.tagId),
  primaryKey: index('job_tags_pk').on(table.jobId, table.tagId),
}))

// Scraped products table
export const scrapedProducts = pgTable('scraped_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => scrapingJobs.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title').notNull(),
  price: varchar('price', { length: 255 }),
  image: text('image'),
  inStock: boolean('in_stock'),
  sku: varchar('sku', { length: 255 }),
  currency: varchar('currency', { length: 10 }),
  breadcrumbs: json('breadcrumbs').$type<string[]>(),
  extra: json('extra'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index('scraped_products_job_id_idx').on(table.jobId),
  urlIdx: index('scraped_products_url_idx').on(table.url),
}))

// Scheduled scrapes table
export const scheduledScrapes = pgTable('scheduled_scrapes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  goal: text('goal'),
  schedule: varchar('schedule', { length: 100 }).notNull(), // cron expression
  enabled: boolean('enabled').default(true),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  config: json('config').$type<{
    maxTotalPages?: number
    browserEnabled?: boolean
    notifyOnComplete?: boolean
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('scheduled_scrapes_user_id_idx').on(table.userId),
  enabledIdx: index('scheduled_scrapes_enabled_idx').on(table.enabled),
  nextRunAtIdx: index('scheduled_scrapes_next_run_at_idx').on(table.nextRunAt),
}))

// Scrape runs table for performance tracking
export const scrapeRuns = pgTable('scrape_runs', {
  runId: varchar('run_id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  totalProducts: integer('total_products').default(0),
  metrics: json('metrics').$type<{
    durationMs?: number
    pagesProcessed?: number
    failureCounters?: {
      httpErrors: number
      noHtml: number
      claudeErrors: number
      parsingErrors: number
      emptyResults: number
      totalPages: number
    }
    successRate?: string
    stopReason?: string
    startUrl?: string
    goal?: string
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('scrape_runs_user_id_idx').on(table.userId),
  startedAtIdx: index('scrape_runs_started_at_idx').on(table.startedAt),
  totalProductsIdx: index('scrape_runs_total_products_idx').on(table.totalProducts),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  scrapingJobs: many(scrapingJobs),
  scheduledScrapes: many(scheduledScrapes),
  categories: many(categories),
  tags: many(tags),
  siteProfiles: many(siteProfiles),
  scrapeRuns: many(scrapeRuns),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  scrapingJobs: many(scrapingJobs),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  jobTags: many(jobTags),
}))

export const siteProfilesRelations = relations(siteProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [siteProfiles.userId],
    references: [users.id],
  }),
  scrapingJobs: many(scrapingJobs),
}))

export const scrapingJobsRelations = relations(scrapingJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [scrapingJobs.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [scrapingJobs.categoryId],
    references: [categories.id],
  }),
  siteProfile: one(siteProfiles, {
    fields: [scrapingJobs.siteProfileId],
    references: [siteProfiles.id],
  }),
  products: many(scrapedProducts),
  jobTags: many(jobTags),
}))

export const jobTagsRelations = relations(jobTags, ({ one }) => ({
  job: one(scrapingJobs, {
    fields: [jobTags.jobId],
    references: [scrapingJobs.id],
  }),
  tag: one(tags, {
    fields: [jobTags.tagId],
    references: [tags.id],
  }),
}))

export const scrapedProductsRelations = relations(scrapedProducts, ({ one }) => ({
  job: one(scrapingJobs, {
    fields: [scrapedProducts.jobId],
    references: [scrapingJobs.id],
  }),
}))

export const scheduledScrapesRelations = relations(scheduledScrapes, ({ one }) => ({
  user: one(users, {
    fields: [scheduledScrapes.userId],
    references: [users.id],
  }),
}))

export const scrapeRunsRelations = relations(scrapeRuns, ({ one }) => ({
  user: one(users, {
    fields: [scrapeRuns.userId],
    references: [users.id],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export type SiteProfile = typeof siteProfiles.$inferSelect
export type NewSiteProfile = typeof siteProfiles.$inferInsert

export type ScrapingJob = typeof scrapingJobs.$inferSelect
export type NewScrapingJob = typeof scrapingJobs.$inferInsert

export type JobTag = typeof jobTags.$inferSelect
export type NewJobTag = typeof jobTags.$inferInsert

export type ScrapedProduct = typeof scrapedProducts.$inferSelect
export type NewScrapedProduct = typeof scrapedProducts.$inferInsert

export type ScheduledScrape = typeof scheduledScrapes.$inferSelect
export type NewScheduledScrape = typeof scheduledScrapes.$inferInsert

export type ScrapeRun = typeof scrapeRuns.$inferSelect
export type NewScrapeRun = typeof scrapeRuns.$inferInsert

// Enhanced types with relations
export type ScrapingJobWithRelations = ScrapingJob & {
  category?: Category
  siteProfile?: SiteProfile
  products: ScrapedProduct[]
  jobTags: (JobTag & { tag: Tag })[]
}

export type CategoryWithCounts = Category & {
  _count: {
    scrapingJobs: number
  }
}

export type TagWithCounts = Tag & {
  _count: {
    jobTags: number
  }
}

export type SiteProfileWithStats = SiteProfile & {
  successRate: number
  _count: {
    scrapingJobs: number
  }
}
