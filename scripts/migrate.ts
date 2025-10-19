import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  try {
    console.log('🔄 Reading migration file...')
    const migrationSQL = readFileSync(
      join(process.cwd(), 'lib/db/migrations/0000_omniscient_surge.sql'),
      'utf-8'
    )

    console.log('🚀 Applying migration...')
    await sql(migrationSQL)

    console.log('✅ Migration applied successfully!')
    console.log('✅ Sessions table created!')
  } catch (error: any) {
    // Check if tables already exist
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Tables already exist, checking for sessions table...')

      try {
        // Try to create just the sessions table
        await sql`
          CREATE TABLE IF NOT EXISTS "sessions" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "session_token" varchar(255) NOT NULL,
            "user_id" uuid NOT NULL,
            "expires" timestamp NOT NULL,
            CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
          )
        `
        await sql`
          ALTER TABLE "sessions"
          ADD CONSTRAINT "sessions_user_id_users_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
          ON DELETE cascade ON UPDATE no action
        `
        console.log('✅ Sessions table created!')
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log('✅ Sessions table already exists!')
        } else {
          console.error('❌ Error creating sessions table:', err.message)
        }
      }
    } else {
      console.error('❌ Migration failed:', error.message)
      process.exit(1)
    }
  }
}

migrate()
