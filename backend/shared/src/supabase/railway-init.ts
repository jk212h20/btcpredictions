/**
 * Railway Postgres Database Connection
 * Simplified version that works with Railway Postgres instead of Supabase
 */
import * as pgPromise from 'pg-promise'
import { IDatabase, ITask } from 'pg-promise'
import { IClient } from 'pg-promise/typescript/pg-subset'

export const pgp = pgPromise({
  error(err: any, e: pgPromise.IEventContext) {
    console.error('pgPromise background error', {
      error: err,
      event: e,
    })
  },
})

// Parse numeric types as numbers
pgp.pg.types.setTypeParser(20, (value) => parseInt(value, 10)) // int8
pgp.pg.types.setTypeParser(1700, parseFloat) // numeric
pgp.pg.types.setTypeParser(1082, (value) => value) // date

export type SupabaseDirectClientTimeout = IDatabase<{}, IClient>
export type SupabaseTransaction = ITask<{}>
export type SupabaseDirectClient =
  | SupabaseDirectClientTimeout
  | SupabaseTransaction

// Use one connection to avoid duplicate database object warnings
let pgpDirect: SupabaseDirectClientTimeout | null = null

/**
 * Creates a direct Postgres client using Railway environment variables
 * 
 * Required environment variables:
 * - DATABASE_URL: Full connection string (Railway provides this)
 * OR individual variables:
 * - DATABASE_HOST
 * - DATABASE_PORT
 * - DATABASE_USER
 * - DATABASE_PASSWORD
 * - DATABASE_NAME
 */
export function createSupabaseDirectClient(opts?: {
  connectionString?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}): SupabaseDirectClientTimeout {
  if (pgpDirect) return pgpDirect

  // Option 1: Use DATABASE_URL (Railway's default)
  const connectionString = opts?.connectionString || process.env.DATABASE_URL

  if (connectionString) {
    console.log('Connecting to postgres via DATABASE_URL')
    pgpDirect = pgp(connectionString)
    return pgpDirect
  }

  // Option 2: Use individual environment variables
  const host = opts?.host || process.env.DATABASE_HOST
  const port = opts?.port || parseInt(process.env.DATABASE_PORT || '5432', 10)
  const user = opts?.user || process.env.DATABASE_USER || 'postgres'
  const password = opts?.password || process.env.DATABASE_PASSWORD
  const database = opts?.database || process.env.DATABASE_NAME || 'railway'

  if (!host) {
    throw new Error(
      "Can't connect to Postgres: No DATABASE_URL or DATABASE_HOST configured. " +
      "Please set DATABASE_URL environment variable."
    )
  }

  if (!password) {
    throw new Error(
      "Can't connect to Postgres: No DATABASE_PASSWORD configured."
    )
  }

  console.log(`Connecting to postgres at ${host}:${port}`)
  
  pgpDirect = pgp({
    host,
    port,
    user,
    password,
    database,
    // Connection settings optimized for Railway
    connectionTimeoutMillis: 10_000,
    idle_in_transaction_session_timeout: 60_000,
    max: 20, // Railway has connection limits
  })

  return pgpDirect
}

export const SERIAL_MODE = new pgp.txMode.TransactionMode({
  tiLevel: pgp.txMode.isolationLevel.serializable,
  readOnly: false,
  deferrable: false,
})

// For compatibility - re-export types
export { type SupabaseClient } from 'common/supabase/utils'
