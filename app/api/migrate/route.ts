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
