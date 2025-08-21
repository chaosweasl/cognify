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
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                formAction={handleLogin}
                className="flex-1 h-11"
                disabled={loading}
              >
                Log in
              </Button>
              <Button
                type="submit"
                formAction={handleSignup}
                variant="outline"
                className="flex-1 h-11"
                disabled={loading}
              >
                Sign up
              </Button>
            </div>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">OR</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGithubLogin}
            variant="outline"
            className="w-full h-11 gap-2"
            disabled={loading}
          >
            <Github size={20} />
            Continue with GitHub
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              Check your email
            </h2>
            <p className="text-muted-foreground">
              We&apos;ve sent you a confirmation link to complete your
              registration.
            </p>
          </div>
          <div className="pt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
