"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validateEmail,
  validatePassword,
  checkRateLimit,
} from "@/lib/utils/security";
import { getConfig } from "@/lib/utils/env-config";

const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
};

const SIGNUP_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 signup attempts per hour
};

export async function login(formData: FormData) {
  console.log("loginActions: login called");
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Rate limiting
  const rateLimitResult = checkRateLimit(`login:${email}`, LOGIN_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return {
      error: "Too many login attempts. Please try again later.",
      retryAfter: rateLimitResult.resetTime,
    };
  }

  // Validation
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { error: emailValidation.error || "Invalid email" };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error || "Invalid password" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.log("Login error:", error.message);
    return { error: "Invalid email or password" }; // Generic error message for security
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  console.log("loginActions: signup called");
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Rate limiting for signup
  const rateLimitResult = checkRateLimit(`signup:${email}`, SIGNUP_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return {
      error: "Too many signup attempts. Please try again later.",
      retryAfter: rateLimitResult.resetTime,
    };
  }

  // Validation
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { error: emailValidation.error || "Invalid email" };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error || "Invalid password" };
  }
  if (!validatePassword(password)) {
    return { error: "Password must be at least 6 characters." };
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // Return error message for client to display
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGithub() {
  console.log("loginActions: signInWithGithub called");
  const supabase = await createClient();

  // Use environment variables for URLs
  const config = getConfig();
  const siteUrl = config.NEXT_PUBLIC_SITE_URL;

  console.log("[signInWithGithub] NODE_ENV:", config.NODE_ENV);
  console.log("[signInWithGithub] siteUrl:", siteUrl);
  console.log(
    "[signInWithGithub] redirectTo:",
    `${siteUrl}/auth/callback?next=/dashboard`
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });
  console.log("[signInWithOAuth] data:", data);
  console.log("[signInWithOAuth] error:", error);

  if (data?.url) {
    // Use Next.js redirect to send the user to the GitHub OAuth URL
    console.log("[signInWithGithub] Redirecting to:", data.url);
    redirect(data.url);
  }
  if (error) {
    throw new Error(error.message);
  }
}
