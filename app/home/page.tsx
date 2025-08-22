"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Framer Motion components
const motion = {
  div: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <div {...props}>{children}</div>
  ),
  section: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <section {...props}>{children}</section>
  ),
  h1: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <h1 {...props}>{children}</h1>
  ),
  p: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <p {...props}>{children}</p>
  ),
};

export default function CognifyLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const demoCards = [
    {
      question: "What is photosynthesis?",
      answer:
        "The process by which plants convert sunlight into energy using chlorophyll",
      subject: "Biology",
    },
    {
      question: "What is the quadratic formula?",
      answer: "x = (-b ± √(b²-4ac)) / 2a",
      subject: "Math",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % demoCards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description:
        "Automatically converts your notes into flashcards using advanced AI technology",
      color: "from-blue-500/20 to-violet-500/20",
      iconColor: "text-blue-400",
    },
    {
      icon: FileText,
      title: "Multiple Formats",
      description:
        "Upload PDFs, paste text, or type directly - we support all your study materials",
      color: "from-green-500/20 to-blue-500/20",
      iconColor: "text-green-400",
    },
    {
      icon: Database,
      title: "Personal Database",
      description:
        "Your flashcards are stored securely and accessible from anywhere, anytime",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Zap,
      title: "Spaced Repetition",
      description:
        "Smart scheduling algorithm optimizes your learning based on memory science",
      color: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          style={{
            left: mousePosition.x * 0.02,
            top: mousePosition.y * 0.02,
            transition: "all 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"
          style={{
            right: mousePosition.x * -0.02,
            bottom: mousePosition.y * -0.02,
            transition: "all 0.5s ease-out",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="bg-slate-800/70 backdrop-blur-xl border-b border-slate-600/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center py-4">
            {/* Left - Mobile Menu */}
            <div className="flex justify-start">
              <div className="dropdown lg:hidden">
                <div tabIndex={0} role="button" className="btn btn-ghost">
                  <Menu className="h-6 w-6" />
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content bg-slate-800 rounded-box z-[1] mt-3 w-52 p-2 shadow border border-slate-700"
                >
                  <li>
                    <a
                      href="#features"
                      className="text-slate-200 hover:text-white"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/chaosweasl/cognify#readme"
                      className="text-slate-200 hover:text-white"
                    >
                      How it Works
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/chaosweasl/cognify"
                      className="text-slate-200 hover:text-white"
                    >
                      GitHub
                    </a>
                  </li>
                  <li className="mt-2">
                    <a
                      href="/auth/login"
                      className="bg-gradient-to-r from-blue-500 to-violet-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-violet-600 transition-all duration-200"
                    >
                      Get Started
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Cognify</span>
            </div>

            {/* Right - Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-end space-x-4">
              <Button
                variant="ghost"
                className="text-slate-200 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                asChild
              >
                <a href="#features">Features</a>
              </Button>
              <Button
                variant="ghost"
                className="text-slate-200 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                asChild
              >
                <a href="https://github.com/chaosweasl/cognify#readme">
                  How it Works
                </a>
              </Button>
              <Button
                variant="ghost"
                className="text-slate-200 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                asChild
              >
                <a
                  href="https://github.com/chaosweasl/cognify"
                  className="flex items-center space-x-2"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                asChild
              >
                <a href="/auth/login">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div className="animate-pulse">
            <Badge
              variant="outline"
              className="mb-8 border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 transition-all duration-300"
            >
              <Star
                className="w-4 h-4 mr-2 text-yellow-400 animate-spin"
                style={{ animationDuration: "3s" }}
              />
              Free & Open Source
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            style={{
              animation: "slideInUp 0.8s ease-out",
            }}
          >
            Transform Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent animate-pulse">
              Notes
            </span>
            <br />
            Into Smart{" "}
            <span
              className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent animate-pulse"
              style={{ animationDelay: "0.2s" }}
            >
              Flashcards
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-slate-200 mb-10 max-w-3xl mx-auto leading-relaxed"
            style={{
              animation: "slideInUp 0.8s ease-out 0.2s both",
            }}
          >
            Cognify uses AI to automatically convert your study materials into
            interactive flashcards with spaced repetition. Study smarter, not
            harder.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            style={{
              animation: "slideInUp 0.8s ease-out 0.4s both",
            }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-300 shadow-xl"
              asChild
            >
              <a href="/auth/login" className="flex items-center space-x-2">
                <span>Start Creating Flashcards</span>
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              size="lg"
              className="bg-white text-blue-700 border border-blue-400 hover:bg-blue-500 hover:text-white font-semibold transform hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              asChild
            >
              <a
                href="https://github.com/chaosweasl/cognify"
                className="flex items-center space-x-2"
              >
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </Button>
          </motion.div>

          {/* Demo */}
          <motion.div
            style={{
              animation: "slideInUp 0.8s ease-out 0.6s both",
            }}
          >
            <Card className="max-w-4xl mx-auto bg-slate-800/40 border-slate-600 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-500 shadow-2xl">
              <CardHeader className="bg-slate-700/30 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                    <span>Live Demo</span>
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-200 border-blue-500/30 animate-pulse"
                  >
                    AI Processing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-blue-300">
                        Your Study Notes:
                      </span>
                    </div>
                    <Card className="bg-slate-700/40 border-slate-600 hover:bg-slate-700/60 transition-all duration-300">
                      <CardContent className="p-4">
                        <p className="text-slate-200 text-sm leading-relaxed">
                          "Photosynthesis is the process by which plants convert
                          sunlight into energy using chlorophyll. This
                          fundamental biological process occurs in the
                          chloroplasts..."
                        </p>
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <span className="text-sm text-slate-300 ml-2">
                          AI Processing
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="w-5 h-5 text-violet-400 animate-pulse" />
                      <span className="font-medium text-violet-300">
                        Generated Flashcard:
                      </span>
                    </div>
                    <Card
                      key={currentCardIndex}
                      className="bg-gradient-to-br from-blue-500/15 to-violet-500/15 border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 shadow-lg"
                      style={{
                        animation: "slideInRight 0.5s ease-out",
                      }}
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm text-blue-300 mb-2 font-medium">
                              Question:
                            </div>
                            <p className="text-white mb-4 font-medium">
                              {demoCards[currentCardIndex].question}
                            </p>
                            <div className="text-sm text-violet-300 mb-2 font-medium">
                              Answer:
                            </div>
                            <p className="text-slate-100 leading-relaxed">
                              {demoCards[currentCardIndex].answer}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-blue-500/20 text-blue-200 text-xs ml-3 border-blue-500/30"
                          >
                            {demoCards[currentCardIndex].subject}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 bg-slate-800/30 backdrop-blur-sm relative"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Simple, Powerful Features
            </h2>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
              Everything you need to transform your study materials into
              effective learning tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                style={{
                  animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                <Card className="bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-500 group h-full shadow-lg hover:shadow-xl">
                  <CardContent className="p-6 text-center h-full flex flex-col">
                    <div className="flex justify-center items-center mb-6">
                      <span
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        <feature.icon
                          className={`w-8 h-8 ${feature.iconColor}`}
                        />
                      </span>
                    </div>
                    <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed flex-1">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Study Smarter?
          </h2>
          <p className="text-lg text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start creating AI-powered flashcards from your study materials. It's
            free, open-source, and works with your own AI API.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-300 shadow-xl"
              asChild
            >
              <a href="/auth/login" className="flex items-center space-x-2">
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-blue-400 text-blue-300 hover:bg-blue-500 hover:text-white transform hover:scale-105 transition-all duration-300"
              asChild
            >
              <a
                href="https://github.com/chaosweasl/cognify"
                className="flex items-center space-x-2"
              >
                <Github className="w-5 h-5" />
                <span>Star on GitHub</span>
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300">
              <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
              <div className="text-sm text-slate-300">Free & Open Source</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300">
              <div className="text-3xl font-bold text-violet-400 mb-2">
                Your API
              </div>
              <div className="text-sm text-slate-300">Bring Your Own Key</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                Private
              </div>
              <div className="text-sm text-slate-300">
                Your Data Stays Yours
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-600/50 bg-slate-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-500 rounded flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Cognify</span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-300">
              <a
                href="https://github.com/chaosweasl/cognify"
                className="hover:text-white transition-colors duration-200"
              >
                GitHub
              </a>
              <a
                href="https://github.com/chaosweasl/cognify/issues"
                className="hover:text-white transition-colors duration-200"
              >
                Issues
              </a>
              <a
                href="https://github.com/chaosweasl/cognify#readme"
                className="hover:text-white transition-colors duration-200"
              >
                Docs
              </a>
            </div>
          </div>

          <div className="border-t border-slate-600/50 mt-6 pt-6 text-center">
            <p className="text-slate-300 text-sm">
              Open source and made for students.
              <span className="text-red-400 mx-1 animate-pulse">♥</span>
            </p>
          </div>
        </div>
      </footer>

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
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
