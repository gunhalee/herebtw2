import { getSupabaseConfig, hasSupabaseServerConfig } from "./config";

export type SupabaseServerClientStub = {
  url: string;
  serviceRoleKey: string;
};

export function getSupabaseServerClient(): SupabaseServerClientStub | null {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  const config = getSupabaseConfig();

  return {
    url: config.url!,
    serviceRoleKey: config.serviceRoleKey!,
  };
}
