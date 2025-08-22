"use client";

import React, { useState, useEffect } from "react";
import { useThemeStore } from "@/hooks/useTheme";
import {
  ArrowRight,
  Brain,
  FileText,
  Zap,
  Database,
  Github,
  Menu,
  X,
  Star,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

// Navigation Component
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  // Use Lucide icons for theme toggle to avoid hydration mismatch
  const ThemeIcon =
    theme === "dark" ? (
      <Sun className="w-5 h-5" />
    ) : (
      <Moon className="w-5 h-5" />
    );

  return (
    <nav className="surface-overlay backdrop-blur-xl border-b border-subtle sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Cognify</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-secondary hover:text-primary interactive-hover px-3 py-2 rounded-md transition-normal">
              <a href="#features">Features</a>
            </button>
            <button className="text-secondary hover:text-primary interactive-hover px-3 py-2 rounded-md transition-normal">
              <a href="https://github.com/chaosweasl/cognify#readme">
                How it Works
              </a>
            </button>
            <button className="text-secondary hover:text-primary interactive-hover px-3 py-2 rounded-md transition-normal">
              <a
                href="https://github.com/chaosweasl/cognify"
                className="flex items-center space-x-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </button>
            <button className="bg-gradient-brand hover:bg-gradient-brand-hover transform hover:scale-105 transition-normal shadow-brand px-4 py-2 rounded-md text-white font-medium">
              <a href="/auth/login">Get Started</a>
            </button>
            {/* Theme Toggle Button */}
            <button
              aria-label="Toggle theme"
              className="ml-2 p-2 rounded-md border border-subtle bg-surface-elevated hover:bg-surface-glass transition-normal"
              onClick={toggleTheme}
            >
              {ThemeIcon}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary hover:text-primary p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-subtle">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#features"
                className="block px-3 py-2 text-secondary hover:text-primary interactive-hover rounded-md transition-normal"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="https://github.com/chaosweasl/cognify#readme"
                className="block px-3 py-2 text-secondary hover:text-primary interactive-hover rounded-md transition-normal"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="https://github.com/chaosweasl/cognify"
                className="block px-3 py-2 text-secondary hover:text-primary interactive-hover rounded-md transition-normal"
                onClick={() => setIsMenuOpen(false)}
              >
                GitHub
              </a>
              {/* Theme Toggle Button (Mobile) */}
              <button
                aria-label="Toggle theme"
                className="mt-2 w-full flex items-center justify-center p-2 rounded-md border border-subtle bg-surface-elevated hover:bg-surface-glass transition-normal"
                onClick={toggleTheme}
              >
                {ThemeIcon}
                <span className="ml-2">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
              <div className="pt-2">
                <button className="w-full bg-gradient-brand hover:bg-gradient-brand-hover px-4 py-2 rounded-md text-white font-medium">
                  <a href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </a>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Demo Component
const DemoSection = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const demoCards = [
    {
      question: "What is photosynthesis?",
      answer:
        "The process by which plants convert sunlight into energy using chlorophyll",
      subject: "Biology",
    },
    {
      question: "What is the capital of France?",
      answer: "Paris is the capital and most populous city of France",
      subject: "Geography",
    },
    {
      question: "Who wrote Romeo and Juliet?",
      answer:
        "William Shakespeare wrote this famous tragedy in the early part of his career",
      subject: "Literature",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % demoCards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [demoCards.length]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="surface-elevated border border-primary backdrop-blur-sm hover:surface-glass transition-slow shadow-brand-lg rounded-lg overflow-hidden">
        <div className="surface-secondary border-b border-subtle px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-primary flex items-center space-x-2">
              <Sparkles className="w-5 h-5 brand-secondary animate-pulse" />
              <span className="text-lg sm:text-xl font-semibold">
                Live Demo
              </span>
            </div>
            <div className="bg-brand-primary/20 text-white border border-brand px-3 py-1 rounded-full text-sm self-start sm:self-center animate-pulse">
              AI Processing
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 brand-primary flex-shrink-0" />
                <span className="font-medium brand-primary text-sm sm:text-base">
                  Your Study Notes:
                </span>
              </div>
              <div className="surface-elevated border border-secondary hover:surface-glass transition-normal rounded-lg">
                <div className="p-3 sm:p-4">
                  <p className="text-secondary text-xs sm:text-sm leading-relaxed">
                    &quot;Photosynthesis is the process by which plants convert
                    sunlight into energy using chlorophyll. This fundamental
                    biological process occurs in the chloroplasts...&quot;
                  </p>
                </div>
              </div>

              {/* Processing Animation */}
              <div className="flex items-center justify-center py-3 lg:py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <span className="text-xs sm:text-sm text-muted ml-2">
                    AI Processing
                  </span>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="transform hover:scale-105 transition-normal">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-5 h-5 brand-secondary animate-pulse flex-shrink-0" />
                <span className="font-medium brand-secondary text-sm sm:text-base">
                  Generated Flashcard:
                </span>
              </div>
              <div
                key={currentCardIndex}
                className="bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 border border-brand hover:border-brand-hover transition-slow shadow-brand min-h-[200px] sm:min-h-[220px] rounded-lg"
                style={{
                  animation: "slideInRight 0.5s ease-out",
                }}
              >
                <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="text-xs sm:text-sm brand-primary mb-2 font-medium">
                        Question:
                      </div>
                      <p className="text-primary text-sm sm:text-base font-medium leading-relaxed">
                        {demoCards[currentCardIndex].question}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm brand-secondary mb-2 font-medium">
                        Answer:
                      </div>
                      <p className="text-secondary text-xs sm:text-sm leading-relaxed">
                        {demoCards[currentCardIndex].answer}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="bg-brand-primary/20 text-white border border-brand px-2 py-1 rounded text-xs">
                      {demoCards[currentCardIndex].subject}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Features Grid Component
const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description:
        "Automatically converts your notes into flashcards using advanced AI technology",
      color: "from-brand-primary/20 to-brand-secondary/20",
      iconColor: "brand-primary",
    },
    {
      icon: FileText,
      title: "Multiple Formats",
      description:
        "Upload PDFs, paste text, or type directly - we support all your study materials",
      color: "from-brand-tertiary/20 to-brand-primary/20",
      iconColor: "brand-tertiary",
    },
    {
      icon: Database,
      title: "Personal Database",
      description:
        "Your flashcards are stored securely and accessible from anywhere, anytime",
      color: "from-brand-secondary/20 to-brand-accent/20",
      iconColor: "brand-secondary",
    },
    {
      icon: Zap,
      title: "Spaced Repetition",
      description:
        "Smart scheduling algorithm optimizes your learning based on memory science",
      color: "from-brand-accent/20 to-brand-tertiary/20",
      iconColor: "brand-accent",
    },
  ];

  return (
    <section
      id="features"
      className="py-16 sm:py-20 px-4 surface-secondary backdrop-blur-sm relative"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-primary">
            Simple, Powerful Features
          </h2>
          <p className="text-base sm:text-lg text-secondary max-w-2xl mx-auto leading-relaxed px-4">
            Everything you need to transform your study materials into effective
            learning tools
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="surface-elevated border border-secondary hover:surface-glass hover:border-primary transition-slow group h-full shadow-brand hover:shadow-brand-lg rounded-lg">
                <div className="p-4 sm:p-6 text-center h-full flex flex-col">
                  <div className="flex justify-center items-center mb-4 sm:mb-6">
                    <span
                      className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl group-hover:scale-110 transition-normal`}
                    >
                      <feature.icon
                        className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.iconColor}`}
                      />
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-primary group-hover:brand-primary transition-normal">
                    {feature.title}
                  </h3>
                  <p className="text-muted text-xs sm:text-sm leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="py-16 sm:py-20 px-4 relative">
      <div className="max-w-6xl mx-auto text-center">
        <div className="animate-pulse mb-6 sm:mb-8">
          <div className="inline-flex items-center border border-brand bg-brand-primary/10 text-white hover:bg-brand-primary/20 transition-normal px-3 py-1 rounded-full">
            <Star
              className="w-4 h-4 mr-2 text-yellow-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            Free & Open Source
          </div>
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2"
          style={{
            animation: "slideInUp 0.8s ease-out",
          }}
        >
          Transform Your{" "}
          <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent animate-pulse">
            Notes
          </span>
          <br />
          Into Smart{" "}
          <span
            className="bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent animate-pulse"
            style={{ animationDelay: "0.2s" }}
          >
            Flashcards
          </span>
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl text-secondary mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4"
          style={{
            animation: "slideInUp 0.8s ease-out 0.2s both",
          }}
        >
          Cognify uses AI to automatically convert your study materials into
          interactive flashcards with spaced repetition. Study smarter, not
          harder.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16 px-4"
          style={{
            animation: "slideInUp 0.8s ease-out 0.4s both",
          }}
        >
          <button className="w-full sm:w-auto bg-gradient-brand hover:bg-gradient-brand-hover transform hover:scale-105 transition-normal shadow-brand-lg px-6 py-3 rounded-lg text-white font-medium">
            <a
              href="/auth/login"
              className="flex items-center justify-center space-x-2"
            >
              <span>Start Creating Flashcards</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-normal" />
            </a>
          </button>
          <button className="w-full sm:w-auto bg-white text-blue-700 border border-brand hover:bg-brand-primary hover:text-white font-semibold transform hover:scale-105 transition-normal interactive-focus px-6 py-3 rounded-lg">
            <a
              href="https://github.com/chaosweasl/cognify"
              className="flex items-center justify-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>View on GitHub</span>
            </a>
          </button>
        </div>

        {/* Demo */}
        <div
          style={{
            animation: "slideInUp 0.8s ease-out 0.6s both",
          }}
        >
          <DemoSection />
        </div>
      </div>
    </section>
  );
};

// CTA Section Component
const CTASection = () => {
  return (
    <section className="py-16 sm:py-20 px-4 text-center relative">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-primary">
          Ready to Study Smarter?
        </h2>
        <p className="text-base sm:text-lg text-secondary mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
          Start creating AI-powered flashcards from your study materials.
          It&apos;s free, open-source, and works with your own AI API.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12 px-4">
          <button className="w-full sm:w-auto bg-gradient-brand hover:bg-gradient-brand-hover transform hover:scale-105 transition-normal shadow-brand-lg px-6 py-3 rounded-lg text-white font-medium">
            <a
              href="/auth/login"
              className="flex items-center justify-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </button>
          <button className="w-full sm:w-auto border border-brand brand-primary hover:bg-brand-primary hover:text-white transform hover:scale-105 transition-normal px-6 py-3 rounded-lg bg-transparent">
            <a
              href="https://github.com/chaosweasl/cognify"
              className="flex items-center justify-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>Star on GitHub</span>
            </a>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto px-4">
          <div className="text-center p-3 sm:p-4 surface-elevated rounded-lg border border-secondary hover:surface-glass transition-normal">
            <div className="text-2xl sm:text-3xl font-bold brand-primary mb-1 sm:mb-2">
              100%
            </div>
            <div className="text-xs sm:text-sm text-muted">
              Free & Open Source
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 surface-elevated rounded-lg border border-secondary hover:surface-glass transition-normal">
            <div className="text-2xl sm:text-3xl font-bold brand-secondary mb-1 sm:mb-2">
              Your API
            </div>
            <div className="text-xs sm:text-sm text-muted">
              Bring Your Own Key
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 surface-elevated rounded-lg border border-secondary hover:surface-glass transition-normal">
            <div className="text-2xl sm:text-3xl font-bold brand-primary mb-1 sm:mb-2">
              Private
            </div>
            <div className="text-xs sm:text-sm text-muted">
              Your Data Stays Yours
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="border-t border-subtle surface-overlay backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-brand rounded flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-primary">Cognify</span>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-6 text-sm text-muted">
            <a
              href="https://github.com/chaosweasl/cognify"
              className="hover:text-primary transition-normal"
            >
              GitHub
            </a>
            <a
              href="https://github.com/chaosweasl/cognify/issues"
              className="hover:text-primary transition-normal"
            >
              Issues
            </a>
            <a
              href="https://github.com/chaosweasl/cognify#readme"
              className="hover:text-primary transition-normal"
            >
              Docs
            </a>
          </div>
        </div>

        <div className="border-t border-subtle mt-4 sm:mt-6 pt-4 sm:pt-6 text-center">
          <p className="text-muted text-xs sm:text-sm">
            Open source and made for students.
            <span className="text-red-400 mx-1 animate-pulse">♥</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

// Main Component
export default function CognifyLanding() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme } = useThemeStore();

  // Ensure dark class is always synced on <html> and <body>
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
      }
    }
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen surface-primary text-primary overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl"
          style={{
            left: mousePosition.x * 0.02,
            top: mousePosition.y * 0.02,
            transition: "all 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl"
          style={{
            right: mousePosition.x * -0.02,
            bottom: mousePosition.y * -0.02,
            transition: "all 0.5s ease-out",
          }}
        />
      </div>

      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
