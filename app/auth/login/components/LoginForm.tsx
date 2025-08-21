import { Github, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { useState } from "react";
import { create } from "zustand";

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
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-medium text-base">Email</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="input input-bordered input-lg w-full"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-medium text-base">
                  Password
                </span>
              </label>
              <input
                name="password"
                type="password"
                required
                className="input input-bordered input-lg w-full"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-error text-sm mb-2">{error}</div>}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                formAction={handleLogin}
                className="btn btn-primary btn-lg flex-1"
                disabled={loading}
              >
                Log in
              </button>
              <button
                type="submit"
                formAction={handleSignup}
                className="btn btn-outline btn-secondary btn-lg flex-1"
                disabled={loading}
              >
                Sign up
              </button>
            </div>
          </form>
          <div className="divider text-base-content/50">OR</div>
          <button
            type="button"
            onClick={handleGithubLogin}
            className="btn btn-outline btn-accent btn-lg w-full gap-2"
            disabled={loading}
          >
            <Github size={20} />
            Continue with GitHub
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-success" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-base-content">
              Check your email
            </h2>
            <p className="text-base-content/70">
              We&apos;ve sent you a confirmation link to complete your
              registration.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/" className="btn btn-outline btn-sm">
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
