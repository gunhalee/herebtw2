# Deployment Guide

## Required environment variables

Copy `.env.example` to `.env.local` and fill in the current Supabase keys.

```powershell
Copy-Item .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## Database migrations

Preferred flow with the Supabase CLI:

```powershell
supabase login
supabase link
supabase db push
```

The project migrations live in `supabase/migrations`.

## Local run

```powershell
npm install
npm run dev
```

Expected result:

- `/` loads with the live Supabase feed
- post creation writes to Supabase
- agree/report flows hit the real API routes
- candidate flows require authenticated Supabase sessions

## Vercel deployment

Set the same three Supabase variables in Vercel for both `Preview` and `Production`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

After changing environment variables, trigger a new deployment.

## References

- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
