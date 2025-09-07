import { Github, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useState } from "react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginState {
  signupSuccess: boolean;
  error: string | null;
  setSignupSuccess: (success: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLoginStore = create<LoginState>((set) => ({
  signupSuccess: false,
  error: null,
  setSignupSuccess: (success: boolean) => set({ signupSuccess: success }),
  setError: (error: string | null) => set({ error }),
}));

export const LoginForm: React.FC = () => {
  const { signupSuccess, error, setSignupSuccess, setError } = useLoginStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed");
      } else {
        // Successful login - redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  const handleSignup = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "signup",
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Signup failed");
      } else {
        setSignupSuccess(true);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "GitHub login failed");
      } else if (result.url) {
        // Redirect to GitHub OAuth
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <>
      {!signupSuccess ? (
        <div>
          <form className="space-y-6" aria-label="Login form">
            {error && (
              <Alert variant="destructive" role="alert" aria-live="polite">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-secondary flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby={error ? "login-error" : undefined}
                aria-invalid={error ? "true" : "false"}
                className="h-12 surface-glass border-subtle text-primary placeholder:text-muted focus:border-brand transition-all duration-300 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none hover:border-brand-primary/50 group-hover:shadow-brand-lg backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-secondary flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby={error ? "login-error" : undefined}
                aria-invalid={error ? "true" : "false"}
                className="h-12 surface-glass border-subtle text-primary placeholder:text-muted focus:border-brand transition-all duration-300 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none hover:border-brand-primary/50 group-hover:shadow-brand-lg backdrop-blur-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                formAction={handleLogin}
                className="group flex-1 h-12 bg-gradient-brand hover:bg-gradient-brand-hover text-white border-none transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-brand hover:shadow-brand-lg focus:ring-2 focus:ring-brand-primary/50 focus:outline-none font-semibold relative overflow-hidden"
                disabled={loading}
                aria-describedby={loading ? "loading-status" : undefined}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <span className="relative z-10">
                  {loading ? "Logging in..." : "Log in"}
                </span>
              </Button>

              <Button
                type="submit"
                formAction={handleSignup}
                variant="outline"
                className="flex-1 h-12 surface-glass border-subtle text-primary hover:bg-gradient-brand hover:text-white hover:border-brand transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:ring-2 focus:ring-brand-primary/50 focus:outline-none font-semibold"
                disabled={loading}
                aria-describedby={loading ? "loading-status" : undefined}
              >
                {loading ? "Signing up..." : "Sign up"}
              </Button>
            </div>

            {loading && (
              <div id="loading-status" className="sr-only" aria-live="polite">
                Please wait while we process your request
              </div>
            )}
          </form>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="surface-glass px-4 py-1 text-muted rounded-full border border-subtle">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGithubLogin}
            variant="outline"
            className="group w-full h-12 gap-3 surface-glass border-subtle text-primary hover:bg-surface-elevated hover:border-brand transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:ring-2 focus:ring-brand-primary/50 focus:outline-none font-semibold relative overflow-hidden"
            disabled={loading}
            aria-label="Continue with GitHub OAuth login"
            aria-describedby={loading ? "loading-status" : undefined}
          >
            {/* Button background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/5 to-gray-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <Github
              size={20}
              aria-hidden="true"
              className="relative z-10 group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="relative z-10">
              {loading ? "Connecting..." : "Continue with GitHub"}
            </span>
          </Button>
        </div>
      ) : (
        <div
          className="text-center space-y-6"
          style={{ animation: "slideInUp 0.6s ease-out" }}
        >
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle2 className="w-20 h-20 text-status-success animate-pulse" />
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-500/20 animate-ping"></div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">
              Check your email
            </h2>
            <p className="text-secondary text-lg leading-relaxed max-w-sm mx-auto">
              We&apos;ve sent you a confirmation link to complete your
              registration and get started.
            </p>
          </div>

          <div className="pt-6">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="surface-glass border-subtle text-primary hover:bg-gradient-brand hover:text-white hover:border-brand transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
