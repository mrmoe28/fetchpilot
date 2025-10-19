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

// Verification tokens table (for NextAuth)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
})

// Scraping jobs table
export const scrapingJobs = pgTable('scraping_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('scraping_jobs_user_id_idx').on(table.userId),
  statusIdx: index('scraping_jobs_status_idx').on(table.status),
  createdAtIdx: index('scraping_jobs_created_at_idx').on(table.createdAt),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  scrapingJobs: many(scrapingJobs),
  scheduledScrapes: many(scheduledScrapes),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const scrapingJobsRelations = relations(scrapingJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [scrapingJobs.userId],
    references: [users.id],
  }),
  products: many(scrapedProducts),
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

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type ScrapingJob = typeof scrapingJobs.$inferSelect
export type NewScrapingJob = typeof scrapingJobs.$inferInsert

export type ScrapedProduct = typeof scrapedProducts.$inferSelect
export type NewScrapedProduct = typeof scrapedProducts.$inferInsert

export type ScheduledScrape = typeof scheduledScrapes.$inferSelect
export type NewScheduledScrape = typeof scheduledScrapes.$inferInsert
