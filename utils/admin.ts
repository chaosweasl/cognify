import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { getConfig } from "./env-config";

interface CustomJWT {
  user_role?: "admin" | "user";
  [key: string]: any;
}

/**
 * Check if a user is an admin based on JWT claims
 * This uses the custom_access_token_hook to get role from database
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return false;

    // Decode JWT to get user_role claim
    const base64Url = session.access_token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const jwt = JSON.parse(jsonPayload) as CustomJWT;
    return jwt.user_role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Synchronous check if user is admin based on TEST_USER_ID environment variable
 * This is a fallback for development/testing before the JWT hook is set up
 */
export function isTestAdmin(user: User | null): boolean {
  if (!user) return false;

  const config = getConfig();
  const testUserId = config.TEST_USER_ID || config.NEXT_PUBLIC_TEST_USER_ID;
  return testUserId ? user.id === testUserId : false;
}

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
 * Check if user can see debug components (synchronous version using TEST_USER_ID)
 * Use this for server-side components that need synchronous checks
 */
export function canAccessDebugSync(user: User | null): boolean {
  return isDebugMode() || isTestAdmin(user);
}

/**
 * Check if user can see debug components (async version using JWT claims)
 * Use this for client-side components that can handle async operations
 */
export async function canAccessDebug(user: User | null): Promise<boolean> {
  return isDebugMode() || (await isAdmin(user));
}
