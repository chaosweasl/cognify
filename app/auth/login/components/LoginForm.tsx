import { Github, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { useState } from "react";
import { create } from "zustand";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";

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
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="h-12"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-12"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                formAction={handleLogin}
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                Log in
              </Button>
              <Button
                type="submit"
                formAction={handleSignup}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                Sign up
              </Button>
            </div>
          </form>
          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">OR</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGithubLogin}
            variant="outline"
            size="lg"
            className="w-full gap-2"
            disabled={loading}
          >
            <Github size={20} />
            Continue with GitHub
          </Button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
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
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
