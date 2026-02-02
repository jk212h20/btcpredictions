/**
 * Simplified Secrets Loader for Railway Deployment
 * 
 * This version reads secrets directly from environment variables
 * instead of using Google Cloud Secret Manager.
 * 
 * To use: Replace imports of './secrets' with './secrets-railway'
 * Or rename this file to secrets.ts and backup the original.
 */

// List of secrets - all are now optional
// Only include what your deployment actually needs
export const secrets = [
  // Core (REQUIRED)
  'API_SECRET',
  
  // Database (handled via DATABASE_URL)
  // 'SUPABASE_KEY',  // Not needed for Railway Postgres
  // 'SUPABASE_PASSWORD',  // Not needed for Railway Postgres
  
  // Optional AI features - comment out if not using
  // 'OPENAI_API_KEY',
  // 'ANTHROPIC_API_KEY', 
  // 'GEMINI_API_KEY',
  // 'PERPLEXITY_API_KEY',
  // 'FIRECRAWL_API_KEY',
  
  // Optional email
  // 'MAILGUN_KEY',
  
  // Optional payments
  // 'STRIPE_APIKEY',
  // 'STRIPE_WEBHOOKSECRET',
  
  // Optional phone verification  
  // 'TWILIO_AUTH_TOKEN',
  // 'TWILIO_SID',
  // 'TWILIO_VERIFY_SID',
  
  // Optional misc
  // 'DREAM_KEY',
  // 'NEWS_API_KEY',
  // 'REACT_APP_GIPHY_KEY',
  // 'TWITTER_API_KEY_JSON',
  // 'DESTINY_API_KEY',
  // 'FB_ACCESS_TOKEN',
  // 'GEODB_API_KEY',
  // 'SPORTSDB_KEY',
  
  // Scheduler (internal communication)
  'SCHEDULER_AUTH_PASSWORD',
] as const

type SecretId = (typeof secrets)[number]

/**
 * Gets secrets from environment variables
 * Railway version - no GCP dependency
 */
export const getSecrets = async (_credentials?: any, ...ids: SecretId[]) => {
  const secretIds = ids.length > 0 ? ids : secrets
  
  const result: Record<string, string> = {}
  
  for (const key of secretIds) {
    const value = process.env[key]
    if (value) {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Loads secrets from environment variables into process.env
 * This is a no-op for Railway since env vars are already in process.env
 */
export const loadSecretsToEnv = async (_credentials?: any) => {
  // No-op - Railway already loads env vars into process.env
  console.log('Secrets loaded from environment variables')
}

/**
 * Get service account credentials
 * Railway version - reads from FIREBASE_SERVICE_ACCOUNT_KEY env var
 */
export const getServiceAccountCredentials = (env: 'PROD' | 'DEV') => {
  // First check for env-specific key
  const envSpecificKey = env === 'PROD' 
    ? process.env.PROD_FIREBASE_SERVICE_ACCOUNT_KEY
    : process.env.DEV_FIREBASE_SERVICE_ACCOUNT_KEY
    
  if (envSpecificKey) {
    try {
      return JSON.parse(envSpecificKey)
    } catch {
      throw new Error(`Failed to parse ${env}_FIREBASE_SERVICE_ACCOUNT_KEY as JSON`)
    }
  }
  
  // Fall back to generic key
  const genericKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (genericKey) {
    try {
      return JSON.parse(genericKey)
    } catch {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON')
    }
  }
  
  // If no Firebase auth needed, return null
  console.warn('No Firebase service account key found. Firebase auth will be disabled.')
  return null
}
