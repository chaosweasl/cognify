"use client";

import { LoginForm } from "./components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function LoginPage() {
  console.log("LoginPage: render");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-primary overflow-hidden">
      {/* Animated background elements - matching home page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl animate-pulse" 
             style={{ left: '10%', top: '20%' }} />
        <div className="absolute w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl animate-pulse" 
             style={{ right: '10%', bottom: '20%', animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md surface-elevated glass-surface border border-subtle backdrop-blur-sm shadow-brand-lg">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-brand">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold mb-3 text-primary">
              Welcome to <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Cognify</span>
            </CardTitle>
            <CardDescription className="text-lg text-secondary">
              AI-powered flashcards for your notes. Sign in or create an account
              to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
