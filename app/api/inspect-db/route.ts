import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  try {
    console.log('Starting comprehensive database inspection...')

    // Get all tables
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    const tables = tablesResult.rows.map(row => (row as any).table_name)

    // Get detailed info for each table
    const tableDetails: any = {}

    for (const tableName of tables) {
      // Get columns for this table
      const columnsResult = await db.execute(sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position
      `)

      // Get indexes for this table
      const indexesResult = await db.execute(sql`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = ${tableName}
      `)

      // Get foreign keys for this table
      const foreignKeysResult = await db.execute(sql`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = ${tableName}
      `)

      tableDetails[tableName] = {
        columns: columnsResult.rows,
        indexes: indexesResult.rows,
        foreignKeys: foreignKeysResult.rows
      }
    }

    // Expected tables from our schema
    const expectedTables = [
      'users',
      'accounts', 
      'sessions',
      'verification_tokens',
      'password_reset_tokens',
      'categories',
      'tags',
      'site_profiles',
      'scraping_jobs',
      'job_tags',
      'scraped_products',
      'scheduled_scrapes',
      'scrape_runs'
    ]

    // Find missing tables
    const missingTables = expectedTables.filter(table => !tables.includes(table))
    const extraTables = tables.filter(table => !expectedTables.includes(table))

    // Check specific critical columns
    const criticalChecks = {
      users_password_column: tableDetails.users?.columns?.some((col: any) => col.column_name === 'password'),
      password_reset_tokens_table: tables.includes('password_reset_tokens'),
      categories_table: tables.includes('categories'),
      tags_table: tables.includes('tags'),
      site_profiles_table: tables.includes('site_profiles'),
      job_tags_table: tables.includes('job_tags'),
      scraping_jobs_extra_columns: tableDetails.scraping_jobs?.columns?.some((col: any) => 
        ['category_id', 'site_profile_id', 'is_favorite', 'notes'].includes(col.column_name)
      )
    }

    return NextResponse.json({
      status: 'inspection_complete',
      summary: {
        total_tables: tables.length,
        expected_tables: expectedTables.length,
        missing_tables: missingTables,
        extra_tables: extraTables
      },
      critical_checks: criticalChecks,
      all_tables: tables,
      table_details: tableDetails,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database inspection failed:', error)
    return NextResponse.json(
      { 
        error: 'Database inspection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
