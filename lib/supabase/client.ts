// Browser-side Supabase client (used in Client Components for auth actions and
// optimistic progress mutations). Row-Level Security keeps each user's data private.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
