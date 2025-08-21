"use client";

import { LoginForm } from "./components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  console.log("LoginPage: render");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-4xl font-bold mb-3">
            Welcome to <span className="text-primary">Cognify</span>
          </CardTitle>
          <CardDescription className="text-lg">
            AI-powered flashcards for your notes. Sign in or create an account
            to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
