CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"icon" varchar(50) DEFAULT 'folder',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_tags" (
	"job_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"run_id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"total_products" integer DEFAULT 0,
	"metrics" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"logo_url" text,
	"last_scraped_at" timestamp,
	"total_scrapes" integer DEFAULT 0,
	"successful_scrapes" integer DEFAULT 0,
	"avg_response_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#10B981',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD COLUMN "site_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD COLUMN "is_favorite" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255);--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tags" ADD CONSTRAINT "job_tags_job_id_scraping_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scraping_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tags" ADD CONSTRAINT "job_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_profiles" ADD CONSTRAINT "site_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_name_idx" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "job_tags_job_id_idx" ON "job_tags" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_tags_tag_id_idx" ON "job_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "job_tags_pk" ON "job_tags" USING btree ("job_id","tag_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "scrape_runs_user_id_idx" ON "scrape_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scrape_runs_started_at_idx" ON "scrape_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "scrape_runs_total_products_idx" ON "scrape_runs" USING btree ("total_products");--> statement-breakpoint
CREATE INDEX "site_profiles_user_id_idx" ON "site_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "site_profiles_domain_idx" ON "site_profiles" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "site_profiles_user_domain_idx" ON "site_profiles" USING btree ("user_id","domain");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_site_profile_id_site_profiles_id_fk" FOREIGN KEY ("site_profile_id") REFERENCES "public"."site_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scraping_jobs_category_id_idx" ON "scraping_jobs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "scraping_jobs_site_profile_id_idx" ON "scraping_jobs" USING btree ("site_profile_id");--> statement-breakpoint
CREATE INDEX "scraping_jobs_is_favorite_idx" ON "scraping_jobs" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "verification_tokens_pk" ON "verification_tokens" USING btree ("identifier","token");