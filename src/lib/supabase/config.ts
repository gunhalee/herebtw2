export type SupabaseRuntimeConfig = {
  url: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
};

export function getSupabaseConfig(): SupabaseRuntimeConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,
  };
}

export function hasSupabaseServerConfig() {
  const config = getSupabaseConfig();

  return Boolean(config.url && config.serviceRoleKey);
}
