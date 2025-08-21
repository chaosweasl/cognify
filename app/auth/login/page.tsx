"use client";

import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  console.log("LoginPage: render");

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-base-content mb-3">
              Welcome to <span className="text-primary">Cognify</span>
            </h1>
            <p className="text-base-content/70 text-lg">
              AI-powered flashcards for your notes. Sign in or create an account
              to get started.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
