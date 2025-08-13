import type { User } from "@supabase/supabase-js";

/**
 * Check if debug mode is enabled via environment variable
 */
export function isDebugMode(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_DEBUG === "true"
  );
}

/**
 * Synchronous check if user is admin based on TEST_USER_ID environment variable
 * This is a fallback for development/testing and server-side components
 */
export function isTestAdmin(user: User | null): boolean {
  if (!user) return false;

  const testUserId =
    process.env.TEST_USER_ID || process.env.NEXT_PUBLIC_TEST_USER_ID;
  return testUserId ? user.id === testUserId : false;
}

/**
 * Check if user can see debug components (for server-side components)
 * Use this for server-side components that need synchronous checks
 */
export function canAccessDebugSync(user: User | null): boolean {
  return isDebugMode() || isTestAdmin(user);
}
