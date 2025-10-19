CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "scheduled_scrapes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"goal" text,
	"schedule" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"config" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraped_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"price" varchar(255),
	"image" text,
	"in_stock" boolean,
	"sku" varchar(255),
	"currency" varchar(10),
	"breadcrumbs" json,
	"extra" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraping_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"url" text NOT NULL,
	"goal" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"pages_processed" integer DEFAULT 0,
	"products_found" integer DEFAULT 0,
	"logs" json DEFAULT '[]'::json,
	"config" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_scrapes" ADD CONSTRAINT "scheduled_scrapes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraped_products" ADD CONSTRAINT "scraped_products_job_id_scraping_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scraping_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_scrapes_user_id_idx" ON "scheduled_scrapes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_scrapes_enabled_idx" ON "scheduled_scrapes" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "scheduled_scrapes_next_run_at_idx" ON "scheduled_scrapes" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "scraped_products_job_id_idx" ON "scraped_products" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "scraped_products_url_idx" ON "scraped_products" USING btree ("url");--> statement-breakpoint
CREATE INDEX "scraping_jobs_user_id_idx" ON "scraping_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scraping_jobs_status_idx" ON "scraping_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scraping_jobs_created_at_idx" ON "scraping_jobs" USING btree ("created_at");