import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserKey } from "@/lib/supabase/config";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseBrowserKey();
  if (!url || !key) {
    throw new Error(
      "Supabase URL or browser key missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or PUBLISHABLE_DEFAULT_KEY / ANON_KEY)."
    );
  }
  return createBrowserClient(url, key);
}
