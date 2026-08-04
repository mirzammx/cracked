/** True once real Supabase credentials are configured. Until then the app
 * runs in demo mode: no auth gate, seed data instead of live queries. This
 * exists purely so the app is inspectable immediately after `npm install`
 * — swap in real env vars (see .env.local.example) and it switches over
 * to Supabase automatically, no code changes required. */
export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
