import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

export function createSuperClient(): SupabaseClient | undefined {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return undefined;
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createSuperClientOrThrow(): SupabaseClient {
  const client = createSuperClient();
  if (!client) {
    throw new Error("Failed to create Supabase client. Please check your environment variables.");
  }
  return client;
}
