ALTER TABLE "scraped_products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "scraped_products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "scraped_products" ADD COLUMN "brand" varchar(255);--> statement-breakpoint
ALTER TABLE "scraped_products" ADD COLUMN "rating" varchar(50);--> statement-breakpoint
ALTER TABLE "scraped_products" ADD COLUMN "review_count" integer;--> statement-breakpoint
ALTER TABLE "scraped_products" ADD CONSTRAINT "scraped_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scraped_products_category_id_idx" ON "scraped_products" USING btree ("category_id");