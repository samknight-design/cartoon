import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Fallback placeholders let the build succeed without env vars set.
  // Real credentials must be added in Vercel env settings before going live.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  );
}
