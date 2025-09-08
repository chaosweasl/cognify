"use client";

import { LoginForm } from "./components/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Sparkles, Shield, Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen surface-primary overflow-hidden relative">
      {/* Enhanced animated background elements with improved depth */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary gradient orb */}
        <div
          className="absolute w-96 h-96 opacity-30 rounded-full blur-3xl animate-pulse"
          style={{
            left: "5%",
            top: "15%",
            background: "var(--gradient-glass)",
            animationDuration: "4s",
          }}
        />
        {/* Secondary gradient orb */}
        <div
          className="absolute w-80 h-80 opacity-25 rounded-full blur-3xl animate-pulse"
          style={{
            right: "5%",
            bottom: "15%",
            animationDelay: "2s",
            animationDuration: "5s",
            background: "var(--gradient-brand-primary)",
          }}
        />
        {/* Tertiary accent */}
        <div
          className="absolute w-64 h-64 opacity-20 rounded-full blur-2xl animate-pulse"
          style={{
            left: "60%",
            top: "10%",
            animationDelay: "4s",
            animationDuration: "6s",
            background: "var(--gradient-brand-hover)",
          }}
        />
        {/* Additional floating elements */}
        <div
          className="absolute w-32 h-32 opacity-15 rounded-full blur-xl animate-pulse"
          style={{
            right: "30%",
            top: "60%",
            animationDelay: "1s",
            animationDuration: "7s",
            background:
              "linear-gradient(135deg, var(--color-brand-secondary), var(--color-brand-accent))",
          }}
        />
      </div>

      {/* Subtle gradient overlay for enhanced depth */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, transparent 0%, var(--color-surface-secondary) 100%),
              radial-gradient(circle at 70% 80%, transparent 30%, var(--color-surface-elevated) 100%)
            `,
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Enhanced main card with better glass morphism */}
        <div
          className="w-full max-w-md"
          style={{
            animation: "slideInUp 0.8s ease-out",
          }}
        >
          <Card className="glass-surface shadow-brand-lg border border-subtle/50 backdrop-blur-xl transform hover:scale-[1.02] transition-all duration-500 relative overflow-hidden group">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-lg"></div>

            <CardHeader className="text-center pb-8 relative z-10">
              {/* Enhanced logo with animation */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative group/logo">
                  <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center transform group-hover/logo:scale-110 group-hover/logo:rotate-3 transition-all duration-300 shadow-brand-lg">
                    <Brain className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  {/* Logo glow effect */}
                  <div className="absolute -inset-2 bg-gradient-brand rounded-2xl blur opacity-0 group-hover/logo:opacity-30 transition-all duration-300" />

                  {/* Floating sparkles */}
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover/logo:opacity-100 transition-all duration-300">
                    <Sparkles className="w-4 h-4 text-brand-secondary animate-bounce" />
                  </div>
                </div>
              </div>

              <CardTitle className="text-3xl sm:text-4xl font-bold mb-4 text-primary leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-brand bg-clip-text text-transparent relative">
                  Cognify
                  <div className="absolute -inset-1 bg-gradient-brand/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </span>
              </CardTitle>

              <CardDescription className="text-lg text-secondary leading-relaxed">
                AI-powered flashcards for your notes. Sign in or create an
                account to get started with intelligent learning.
              </CardDescription>

              {/* Feature highlights */}
              <div className="flex justify-center gap-6 mt-6 text-xs">
                <div className="flex items-center gap-2 text-muted group-hover:text-secondary transition-colors">
                  <Shield className="w-4 h-4 text-brand-primary" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2 text-muted group-hover:text-secondary transition-colors">
                  <Zap className="w-4 h-4 text-brand-secondary" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-2 text-muted group-hover:text-secondary transition-colors">
                  <Brain className="w-4 h-4 text-brand-accent" />
                  <span>Smart</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 relative z-10">
              <LoginForm />
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-8 flex justify-center items-center gap-8 text-muted text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
              <span>Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
