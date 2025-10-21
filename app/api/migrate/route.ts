import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    // Security check - only allow in development or with secret
    const { migrationSecret } = await req.json()
    const expectedSecret = process.env.MIGRATION_SECRET || 'dev-only'
    
    if (process.env.NODE_ENV === 'production' && migrationSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting database migration...')

    // Check if password column already exists
    const passwordColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `)

    if (passwordColumnCheck.rows.length === 0) {
      console.log('Adding password column to users table...')
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN "password" varchar(255)`)
      console.log('Password column added successfully')
    } else {
      console.log('Password column already exists')
    }

    // Check if password_reset_tokens table exists
    const tokenTableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'password_reset_tokens'
    `)

    if (tokenTableCheck.rows.length === 0) {
      console.log('Creating password_reset_tokens table...')
      await db.execute(sql`
        CREATE TABLE "password_reset_tokens" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "email" varchar(255) NOT NULL,
          "token" varchar(255) NOT NULL,
          "expires" timestamp NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
        )
      `)
      
      await db.execute(sql`CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens" USING btree ("email")`)
      await db.execute(sql`CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token")`)
      console.log('Password reset tokens table created successfully')
    } else {
      console.log('Password reset tokens table already exists')
    }

    // Check if category_id column exists in scraped_products table
    const categoryColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'scraped_products' 
      AND column_name = 'category_id'
    `)

    if (categoryColumnCheck.rows.length === 0) {
      console.log('Adding category_id column to scraped_products table...')
      await db.execute(sql`ALTER TABLE "scraped_products" ADD COLUMN "category_id" uuid`)
      await db.execute(sql`ALTER TABLE "scraped_products" ADD COLUMN "description" text`)
      await db.execute(sql`ALTER TABLE "scraped_products" ADD COLUMN "brand" varchar(255)`)
      await db.execute(sql`ALTER TABLE "scraped_products" ADD COLUMN "rating" varchar(50)`)
      await db.execute(sql`ALTER TABLE "scraped_products" ADD COLUMN "review_count" integer`)
      await db.execute(sql`
        ALTER TABLE "scraped_products" 
        ADD CONSTRAINT "scraped_products_category_id_categories_id_fk" 
        FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") 
        ON DELETE set null ON UPDATE no action
      `)
      await db.execute(sql`CREATE INDEX "scraped_products_category_id_idx" ON "scraped_products" USING btree ("category_id")`)
      console.log('Category columns added successfully')
    } else {
      console.log('Category column already exists in scraped_products table')
    }

    // Fix varchar(255) constraints that cause "value too long" errors
    console.log('Updating column types to support longer values...')
    await db.execute(sql`ALTER TABLE "scraped_products" ALTER COLUMN "price" TYPE text`)
    await db.execute(sql`ALTER TABLE "scraped_products" ALTER COLUMN "sku" TYPE text`)
    await db.execute(sql`ALTER TABLE "scraped_products" ALTER COLUMN "brand" TYPE text`)
    console.log('Column types updated successfully')

    return NextResponse.json({
      message: 'Migration completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
