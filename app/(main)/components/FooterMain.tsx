"use client";

import React from "react";
import Link from "next/link";
import { Brain, Github, Heart, ExternalLink } from "lucide-react";

export function FooterMain() {
  return (
    <footer className="surface-secondary glass-surface border-t border-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center transform hover:scale-110 hover:rotate-3 transition-all transition-normal shadow-brand">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-primary">Cognify</span>
            </div>
            <p className="text-secondary leading-relaxed max-w-md mb-4">
              AI-powered flashcard learning platform. Secure, private, and
              designed to help you master any subject with spaced repetition and
              intelligent study sessions.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
              <span>for learners everywhere</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-primary mb-4">Platform</h3>
            <nav className="space-y-3">
              <Link
                href="/dashboard"
                className="block text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="block text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
              >
                Projects
              </Link>
              <Link
                href="/settings"
                className="block text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
              >
                Settings
              </Link>
              <Link
                href="/docs"
                className="block text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
              >
                Documentation
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-primary mb-4">Resources</h3>
            <nav className="space-y-3">
              <Link
                href="https://github.com/chaosweasl/cognify"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal group"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal group"
              >
                <span>Report Issues</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify#contributing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal group"
              >
                <span>Contributing</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/privacy"
                className="block text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-subtle mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-muted text-sm">
            © {new Date().getFullYear()} Cognify. Open source learning platform.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
            >
              Terms
            </Link>
            <Link
              href="/security"
              className="text-secondary hover:text-primary hover:brand-primary transition-colors transition-normal"
            >
              Security
            </Link>
            <div className="flex items-center gap-2 text-muted">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
