type SupabaseRuntimeConfig = {
  url: string | null;
  browserKey: string | null;
  secretKey: string | null;
};

function getSupabaseBrowserKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null;
}

function getSupabaseServerKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY ?? null;
}

export function getSupabaseConfig(): SupabaseRuntimeConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    browserKey: getSupabaseBrowserKey(),
    secretKey: getSupabaseServerKey(),
  };
}

export function requireSupabaseServerConfig() {
  const config = getSupabaseConfig();

  if (!config.url || !config.secretKey) {
    throw new Error("Missing Supabase server config.");
  }

  return {
    ...config,
    url: config.url,
    secretKey: config.secretKey,
  };
}
