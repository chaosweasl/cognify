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

// Enhanced Demo Component with better animations
const DemoSection = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const demoCards = [
    {
      question: "What is photosynthesis?",
      answer:
        "The process by which plants convert sunlight into energy using chlorophyll in their leaves",
      subject: "Biology",
      difficulty: "Easy",
      color: "from-green-500/20 to-emerald-500/20",
    },
    {
      question: "What is the capital of France?",
      answer:
        "Paris is the capital and most populous city of France, located on the Seine River",
      subject: "Geography",
      difficulty: "Easy",
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      question: "Who wrote Romeo and Juliet?",
      answer:
        "William Shakespeare wrote this famous tragedy in the early part of his career, around 1595",
      subject: "Literature",
      difficulty: "Medium",
      color: "from-purple-500/20 to-pink-500/20",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentCardIndex((prev) => (prev + 1) % demoCards.length);
        setIsFlipping(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [demoCards.length]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="surface-elevated border border-brand/30 backdrop-blur-sm hover:border-brand transition-all duration-500 shadow-brand-lg hover:shadow-brand rounded-2xl overflow-hidden relative group">
        {/* Enhanced header with gradient */}
        <div className="bg-gradient-to-r from-surface-secondary to-surface-elevated border-b border-subtle px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-primary flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Live AI Demo</h3>
                <p className="text-sm text-secondary">
                  Watch flashcards being generated in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 text-brand-primary border border-brand/30 px-3 py-1.5 rounded-full text-sm font-semibold animate-pulse backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping"></div>
                  AI Processing
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Enhanced Input Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-primary text-lg">
                  Your Study Material
                </span>
              </div>

              <div className="surface-elevated border border-secondary hover:border-brand transition-all duration-300 rounded-xl group/input">
                <div className="p-6">
                  <div className="text-xs text-brand-primary font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                    PDF Extract • Page 1 of 15
                  </div>
                  <p className="text-secondary text-sm leading-relaxed">
                    &quot;Photosynthesis is the process by which plants convert
                    sunlight into energy using chlorophyll. This fundamental
                    biological process occurs in the chloroplasts of plant
                    cells, where carbon dioxide and water are transformed into
                    glucose and oxygen through a series of complex chemical
                    reactions...&quot;
                  </p>
                </div>

                {/* Processing indicator */}
                <div className="border-t border-subtle bg-gradient-to-r from-surface-secondary to-surface-elevated px-6 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></div>
                      <span>Analyzing content structure...</span>
                    </div>
                    <span className="text-brand-primary font-medium">
                      92% complete
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Processing Animation */}
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-brand-accent rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <div className="text-sm text-brand-primary font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4 animate-pulse" />
                    AI Processing Magic
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Output Section */}
            <div className="transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white animate-pulse" />
                </div>
                <span className="font-semibold text-primary text-lg">
                  Generated Flashcard
                </span>
              </div>

              <div
                key={currentCardIndex}
                className={`relative min-h-[280px] rounded-2xl transition-all duration-500 ${
                  isFlipping ? "scale-95 opacity-50" : "scale-100 opacity-100"
                }`}
              >
                {/* Card background with gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${demoCards[currentCardIndex].color} rounded-2xl`}
                ></div>
                <div className="absolute inset-0 bg-gradient-brand/5 rounded-2xl"></div>

                {/* Card content */}
                <div className="relative border border-brand/40 hover:border-brand transition-all duration-300 shadow-brand-lg rounded-2xl p-6 h-full flex flex-col justify-between backdrop-blur-sm">
                  <div className="space-y-5">
                    {/* Question section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-xs font-bold brand-primary uppercase tracking-wider">
                          Question
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-brand-primary/30 to-transparent"></div>
                      </div>
                      <p className="text-primary text-lg font-semibold leading-relaxed">
                        {demoCards[currentCardIndex].question}
                      </p>
                    </div>

                    {/* Answer section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-xs font-bold brand-secondary uppercase tracking-wider">
                          Answer
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-brand-secondary/30 to-transparent"></div>
                      </div>
                      <p className="text-secondary text-base leading-relaxed">
                        {demoCards[currentCardIndex].answer}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced card footer */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-subtle">
                    <div className="flex items-center gap-3">
                      <span className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 text-brand-primary border border-brand/30 px-3 py-1 rounded-full text-xs font-medium">
                        {demoCards[currentCardIndex].subject}
                      </span>
                      <span className="text-xs text-muted">
                        {demoCards[currentCardIndex].difficulty}
                      </span>
                    </div>

                    {/* Card indicators */}
                    <div className="flex space-x-1">
                      {demoCards.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentCardIndex
                              ? "bg-brand-primary w-6"
                              : "bg-border-secondary"
                          }`}
                        ></div>
                      ))}
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

// Enhanced Features Grid Component
const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description:
        "Automatically converts your notes into flashcards using advanced AI technology with intelligent content parsing",
      color: "from-brand-primary/20 to-brand-secondary/20",
      iconColor: "brand-primary",
      hoverColor: "hover:from-brand-primary/30 hover:to-brand-secondary/30",
    },
    {
      icon: FileText,
      title: "Multiple Formats",
      description:
        "Upload PDFs, paste text, or type directly - we support all your study materials with seamless processing",
      color: "from-brand-tertiary/20 to-brand-primary/20",
      iconColor: "brand-tertiary",
      hoverColor: "hover:from-brand-tertiary/30 hover:to-brand-primary/30",
    },
    {
      icon: Database,
      title: "Personal Database",
      description:
        "Your flashcards are stored securely with end-to-end encryption and accessible from anywhere, anytime",
      color: "from-brand-secondary/20 to-brand-accent/20",
      iconColor: "brand-secondary",
      hoverColor: "hover:from-brand-secondary/30 hover:to-brand-accent/30",
    },
    {
      icon: Zap,
      title: "Spaced Repetition",
      description:
        "Smart scheduling algorithm optimizes your learning based on memory science and personal performance",
      color: "from-brand-accent/20 to-brand-tertiary/20",
      iconColor: "brand-accent",
      hoverColor: "hover:from-brand-accent/30 hover:to-brand-tertiary/30",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 sm:py-24 lg:py-32 px-4 surface-secondary/50 backdrop-blur-sm relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-glass rounded-full blur-3xl opacity-20 animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-brand-primary/10 to-brand-secondary/10 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "3s", animationDuration: "6s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced section header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 backdrop-blur-sm px-4 py-2 rounded-full border border-brand/20 mb-6">
            <Sparkles className="w-4 h-4 brand-primary" />
            <span className="text-sm font-semibold brand-primary">
              Powerful Features
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 text-primary leading-tight">
            Simple, Yet{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Powerful
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-secondary max-w-3xl mx-auto leading-relaxed px-4">
            Everything you need to transform your study materials into effective
            learning tools, powered by cutting-edge AI technology
          </p>
        </div>

        {/* Enhanced features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group"
              style={{
                animation: `slideInUp 0.8s ease-out ${index * 0.15}s both`,
              }}
            >
              <div
                className={`surface-elevated border border-secondary hover:border-brand transition-all duration-500 group-hover:shadow-brand-lg rounded-2xl h-full transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden`}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl"></div>

                {/* Card content */}
                <div className="p-6 lg:p-8 text-center h-full flex flex-col relative z-10">
                  {/* Enhanced icon container */}
                  <div className="flex justify-center items-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${feature.color} ${feature.hoverColor} rounded-2xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 relative`}
                    >
                      <feature.icon
                        className={`w-8 h-8 lg:w-10 lg:h-10 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}
                      />

                      {/* Icon glow effect */}
                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `radial-gradient(circle, var(--color-brand-primary, #3b82f6)/20 0%, transparent 70%)`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Enhanced text content */}
                  <h3 className="font-bold text-xl lg:text-2xl mb-4 text-primary group-hover:brand-primary transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-secondary text-sm lg:text-base leading-relaxed flex-1 group-hover:text-primary transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Decorative bottom accent */}
                  <div className="mt-6 h-1 w-12 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full mx-auto opacity-50 group-hover:opacity-100 group-hover:w-20 transition-all duration-500"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced feature highlights */}
        <div className="mt-16 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              number: "100%",
              label: "Free & Open Source",
              color: "brand-primary",
            },
            { number: "< 5min", label: "Setup Time", color: "brand-secondary" },
            { number: "∞", label: "Flashcards", color: "brand-accent" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 surface-elevated rounded-2xl border border-secondary hover:border-brand hover:surface-glass transition-all duration-300 group"
              style={{
                animation: `slideInUp 0.6s ease-out ${1 + index * 0.1}s both`,
              }}
            >
              <div
                className={`text-4xl lg:text-5xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}
              >
                {stat.number}
              </div>
              <div className="text-secondary text-sm lg:text-base group-hover:text-primary transition-colors duration-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Hero Section Component with Enhanced Animations
const HeroSection = () => {
  return (
    <section className="py-20 sm:py-24 lg:py-32 px-4 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-glass rounded-full blur-3xl opacity-30 animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-brand-secondary/20 to-brand-accent/20 rounded-full blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "4s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        {/* Enhanced badge with pulse animation */}
        <div className="animate-pulse mb-8 sm:mb-10">
          <div className="inline-flex items-center border border-brand bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 backdrop-blur-sm text-brand-primary dark:text-white hover:from-brand-primary/20 hover:to-brand-secondary/20 transition-all duration-500 px-4 py-2 rounded-full font-semibold shadow-brand text-sm sm:text-base group">
            <Star
              className="w-4 h-4 mr-2 text-yellow-400 group-hover:animate-spin"
              style={{ animationDuration: "2s" }}
            />
            <span>Free & Open Source</span>
            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Enhanced hero title with staggered animations */}
        <div className="mb-8 sm:mb-10">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            style={{
              animation: "slideInUp 1s ease-out",
            }}
          >
            <div className="mb-2">
              Transform Your{" "}
              <span
                className="relative inline-block"
                style={{ animation: "slideInLeft 1s ease-out 0.2s both" }}
              >
                <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  Notes
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 blur opacity-75 animate-pulse"></div>
              </span>
            </div>
            <div>
              Into Smart{" "}
              <span
                className="relative inline-block"
                style={{ animation: "slideInRight 1s ease-out 0.4s both" }}
              >
                <span className="bg-gradient-to-r from-brand-secondary to-brand-accent bg-clip-text text-transparent">
                  Flashcards
                </span>
                <div
                  className="absolute -inset-1 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 blur opacity-75 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </span>
            </div>
          </h1>
        </div>

        {/* Enhanced subtitle */}
        <p
          className="text-lg sm:text-xl lg:text-2xl text-secondary mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed px-4"
          style={{
            animation: "slideInUp 1s ease-out 0.6s both",
          }}
        >
          Cognify uses{" "}
          <span className="font-semibold text-primary">advanced AI</span> to
          automatically convert your study materials into interactive flashcards
          with{" "}
          <span className="font-semibold text-primary">spaced repetition</span>.
          Study smarter, not harder.
        </p>

        {/* Enhanced CTA buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16 sm:mb-20 px-4"
          style={{
            animation: "slideInUp 1s ease-out 0.8s both",
          }}
        >
          <button className="group w-full sm:w-auto bg-gradient-brand hover:bg-gradient-brand-hover transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-brand-lg hover:shadow-brand px-8 py-4 rounded-xl text-white font-semibold text-lg relative overflow-hidden">
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
            <a
              href="/auth/login"
              className="flex items-center justify-center space-x-3 relative z-10"
            >
              <span>Start Creating Flashcards</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </button>

          <button className="group w-full sm:w-auto bg-surface-elevated border-2 border-brand text-brand-primary hover:bg-gradient-brand hover:text-white hover:border-brand-hover font-semibold transform hover:scale-105 active:scale-95 transition-all duration-300 px-8 py-4 rounded-xl text-lg">
            <a
              href="https://github.com/chaosweasl/cognify"
              className="flex items-center justify-center space-x-3"
            >
              <Github className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>View on GitHub</span>
            </a>
          </button>
        </div>

        {/* Enhanced demo section */}
        <div
          style={{
            animation: "slideInUp 1s ease-out 1s both",
          }}
        >
          <DemoSection />
        </div>

        {/* Trust indicators */}
        <div
          className="mt-16 sm:mt-20 flex justify-center items-center gap-8 text-muted"
          style={{ animation: "slideInUp 1s ease-out 1.2s both" }}
        >
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Privacy First</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <span>Open Source</span>
          </div>
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
