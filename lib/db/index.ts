import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Allow build to succeed without DATABASE_URL (will fail at runtime if used)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder@localhost/placeholder'

const sql = neon(DATABASE_URL)
export const db = drizzle(sql, { schema })

// Export types
export type Database = typeof db
export * from './schema'
