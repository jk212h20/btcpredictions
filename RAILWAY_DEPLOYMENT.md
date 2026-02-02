# Railway Deployment Guide for Manifold

This guide explains how to deploy a minimal version of Manifold Markets to Railway.

## Architecture Overview

The deployment consists of three services:

1. **API Service** - Backend API (backend/api)
2. **Scheduler Service** - Background jobs (backend/scheduler) - Optional
3. **Web Service** - Next.js frontend (web)
4. **PostgreSQL Database** - Railway Postgres plugin

## Quick Start

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 2. Add PostgreSQL Database

In the Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set `DATABASE_URL` environment variable

### 3. Deploy the API Service

```bash
# Link to your project
railway link

# Deploy backend API
railway up --service api
```

### 4. Set Environment Variables

In Railway dashboard, add these environment variables:

**Required:**
```
DATABASE_URL=<automatically set by Railway Postgres>
API_SECRET=<generate with: openssl rand -hex 32>
NEXT_PUBLIC_FIREBASE_ENV=PROD
SCHEDULER_AUTH_PASSWORD=<generate with: openssl rand -hex 16>
```

**Optional (for full functionality):**
```
# Firebase Auth (if using Firebase for authentication)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# AI Features
OPENAI_API_KEY=sk-...

# Email
MAILGUN_KEY=...

# Payments
STRIPE_APIKEY=sk_...
```

## Code Changes Required

### Option A: Use the Railway-Compatible Files (Recommended)

Replace the original files with Railway versions:

```bash
# Backup originals
cp common/src/secrets.ts common/src/secrets.original.ts
cp backend/shared/src/supabase/init.ts backend/shared/src/supabase/init.original.ts

# Use Railway versions
cp common/src/secrets-railway.ts common/src/secrets.ts
cp backend/shared/src/supabase/railway-init.ts backend/shared/src/supabase/init.ts
```

### Option B: Modify Import Paths

In `backend/shared/src/supabase/init.ts`, change the database connection to use `DATABASE_URL`:

```typescript
// Replace Supabase-specific connection with standard Postgres
const client = pgp(process.env.DATABASE_URL)
```

## Database Setup

### Initialize the Schema

The SQL schema files are in `backend/supabase/`. Run them in order:

```bash
# Connect to Railway Postgres
railway connect postgres

# Run schema files (in psql)
\i backend/supabase/users.sql
\i backend/supabase/contracts.sql
\i backend/supabase/contract_bets.sql
# ... etc
```

Or use the Railway CLI:
```bash
cat backend/supabase/users.sql | railway run psql
```

### Key Tables for Matching Engine

At minimum, you need:
- `users` - User accounts
- `contracts` - Markets/questions
- `contract_bets` - Bets/trades
- `answers` - For multi-choice markets
- `contract_liquidity` - Liquidity providers

## Stripping Optional Features

### Remove AI Endpoints

In `backend/api/src/routes.ts`, comment out or remove:
- `generate-ai-*` handlers
- `check-poll-suggestion`
- `get-close-date` (uses AI)

### Remove Payment Endpoints

Comment out:
- `complete-checkout-session-gidx`
- `complete-cashout-*`
- `donate`
- IAP validation

### Remove Email/Notifications

Comment out:
- `send-email` related code in `backend/shared/src/emails.ts`
- Push notification code

## Service Configuration

### API Service

Build command:
```bash
cd backend/api && yarn build
```

Start command:
```bash
node dist/backend/api/lib/serve.js
```

### Web Service

Build command:
```bash
cd web && yarn build
```

Start command:
```bash
yarn start
```

## Matching Engine Core Files

The prediction market matching engine is self-contained in these files:

```
common/src/
├── calculate-cpmm.ts         # CPMM AMM math
├── calculate-cpmm-arbitrage.ts
├── new-bet.ts                # Bet calculations
├── bet.ts                    # Bet types
├── fees.ts                   # Fee calculation
├── sell-bet.ts               # Sell calculations
├── payouts.ts                # Payout logic
├── contract.ts               # Market types
├── answer.ts                 # Answer types
└── util/
    ├── math.ts               # Math utilities
    └── algos.ts              # Binary search, etc.
```

These files have NO external dependencies (only lodash) and can be extracted as a standalone package.

## Testing Locally

```bash
# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/manifold"
export API_SECRET="test-secret"

# Run API
cd backend/api && yarn dev

# Run Web (in another terminal)
cd web && yarn dev
```

## Troubleshooting

### Connection Issues
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Railway Postgres uses internal networking - use the internal URL for service-to-service

### Build Failures
- Ensure Node 20+
- Run `yarn install` at root level first
- Check TypeScript errors with `yarn build`

### Missing Secrets
- For minimal deployment, only `DATABASE_URL` and `API_SECRET` are required
- Other features will gracefully degrade if secrets are missing

## Support

- Railway Docs: https://docs.railway.app
- Manifold Discord: https://discord.gg/manifold
