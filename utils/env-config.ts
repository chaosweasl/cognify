/**
 * Environment configuration and validation for Cognify
 * Ensures all required environment variables are present and valid
 */

interface EnvironmentConfig {
  // Database
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

  // App Configuration
  NEXT_PUBLIC_SITE_URL: string;
  NODE_ENV: "development" | "production" | "test";

  // Optional
  TEST_USER_ID?: string;
  NEXT_PUBLIC_TEST_USER_ID?: string;
  ENABLE_DEBUG?: string;
}

/**
 * Validate and get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const config: Partial<EnvironmentConfig> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
    TEST_USER_ID: process.env.TEST_USER_ID,
    NEXT_PUBLIC_TEST_USER_ID: process.env.NEXT_PUBLIC_TEST_USER_ID,
    ENABLE_DEBUG: process.env.ENABLE_DEBUG,
  };

  // Validate required variables
  const requiredVars: (keyof EnvironmentConfig)[] = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NODE_ENV",
  ];

  const missingVars = requiredVars.filter((key) => !config[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  // Set default site URL if not provided
  if (!config.NEXT_PUBLIC_SITE_URL) {
    config.NEXT_PUBLIC_SITE_URL =
      config.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://cognify-chaosweasl.vercel.app";
  }

  // Validate URLs
  try {
    new URL(config.NEXT_PUBLIC_SUPABASE_URL!);
    new URL(config.NEXT_PUBLIC_SITE_URL!);
  } catch (error) {
    throw new Error("Invalid URL in environment variables");
  }

  return config as EnvironmentConfig;
}

/**
 * Get validated environment config (singleton)
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = getEnvironmentConfig();
  }
  return cachedConfig;
}

/**
 * Security headers for Next.js responses
 */
export const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'none'",
    ].join("; "),
  },
];

/**
 * CORS configuration for API routes
 */
export const corsConfig = {
  origin:
    process.env.NODE_ENV === "production"
      ? [getConfig().NEXT_PUBLIC_SITE_URL]
      : ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
