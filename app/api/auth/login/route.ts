import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateEmail,
  validatePassword,
  checkRateLimit,
} from "@/lib/utils/security";

const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
};

const SIGNUP_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 signup attempts per hour
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password } = body;

    if (!action || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (action === "login") {
      console.log("API login: login called");

      // Rate limiting
      const rateLimitResult = checkRateLimit(`login:${email}`, LOGIN_RATE_LIMIT);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: "Too many login attempts. Please try again later.",
            retryAfter: rateLimitResult.resetTime,
          },
          { status: 429 }
        );
      }

      // Validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.error || "Invalid email" },
          { status: 400 }
        );
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { error: passwordValidation.error || "Invalid password" },
          { status: 400 }
        );
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.log("Login error:", error.message);
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      return NextResponse.json({ success: true });

    } else if (action === "signup") {
      console.log("API login: signup called");

      // Rate limiting for signup
      const rateLimitResult = checkRateLimit(`signup:${email}`, SIGNUP_RATE_LIMIT);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: "Too many signup attempts. Please try again later.",
            retryAfter: rateLimitResult.resetTime,
          },
          { status: 429 }
        );
      }

      // Validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.error || "Invalid email" },
          { status: 400 }
        );
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { error: passwordValidation.error || "Invalid password" },
          { status: 400 }
        );
      }

      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("API login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}