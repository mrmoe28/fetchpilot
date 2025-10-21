# Database VARCHAR(255) Constraint Fix

## Problem
**Error**: `"value too long for type character varying(255)"`

**Cause**: Database fields `price`, `sku`, and `brand` in the `scraped_products` table were limited to 255 characters, but scraped product data often exceeds this limit.

**Example**: Product prices on e-commerce sites often contain complex formatting like:
```
"$1,699.95\n            \n        \n                        \n                         $1,699.95\n            \n            \n                \n            \n            \n            \n                    $1,549.00\n            \n        \n                \n            \n                    $1,549.00"
```

## Solution

### 1. Updated Database Schema
**File**: `lib/db/schema.ts`

**Changes**:
```typescript
// BEFORE:
price: varchar('price', { length: 255 }),
sku: varchar('sku', { length: 255 }),
brand: varchar('brand', { length: 255 }),

// AFTER:
price: text('price'),
sku: text('sku'),
brand: text('brand'),
```

### 2. Database Migration
**File**: `app/api/migrate/route.ts`

**Added**:
```typescript
// Fix varchar(255) constraints that cause "value too long" errors
console.log('Updating column types to support longer values...')
await db.execute(sql`ALTER TABLE "scraped_products" ALTER COLUMN "price" TYPE text`)
await db.execute(sql`ALTER TABLE "scraped_products" ALTER COLUMN "sku" TYPE text`)
await db.execute(sql`ALTER TABLE "scraped_products" ALTER COLUMN "brand" TYPE text`)
console.log('Column types updated successfully')
```

### 3. Migration Applied
**Command**: 
```bash
curl -X POST http://localhost:3000/api/migrate -H "Content-Type: application/json" -d '{"migrationSecret": "dev-only"}'
```

**Result**: `{"message":"Migration completed successfully","timestamp":"2025-10-21T01:44:33.688Z"}`

## Validation

**Test Command**:
```bash
curl -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" -d '{"url": "https://signaturesolar.com/all-products/inverters/", "goal": "Test after database fix", "maxPages": 1}'
```

**Result**: ✅ Successfully scraped 20 products with long price strings without any database errors.

## Impact
- ✅ **Fixed** "value too long for type character varying(255)" error
- ✅ **Allows** unlimited length product data (price, SKU, brand)
- ✅ **Maintains** performance (text fields are efficient in PostgreSQL)
- ✅ **No breaking changes** to existing data

## Files Modified
1. `lib/db/schema.ts` - Updated field types
2. `app/api/migrate/route.ts` - Added migration logic
3. `DATABASE_VARCHAR_CONSTRAINT_FIX.md` - Documentation

## Date Fixed
October 21, 2025

## Status
✅ **RESOLVED** - Database constraints updated, migration applied, functionality validated.
