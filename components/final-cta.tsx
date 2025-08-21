import { ArrowRight, Github, Star } from "lucide-react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="bg-base-300 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-base-content mb-4">
          Ready to Revolutionize Your Study Routine?
        </h2>
        <p className="text-xl text-base-content/80 mb-8 max-w-2xl mx-auto">
          Join students worldwide who are already using Cognify to create
          smarter study materials. It&apos;s free, open-source, and ready to use
          with your AI API token.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/auth/login" className="btn btn-primary btn-lg">
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="https://github.com/chaosweasl/cognify"
            className="btn btn-outline btn-lg"
          >
            <Github className="w-5 h-5" />
            Star on GitHub
            <Star className="w-4 h-4" />
          </Link>
        </div>

        <div className="stats stats-vertical sm:stats-horizontal shadow-lg bg-base-100">
          <div className="stat">
            <div className="stat-value text-primary">100%</div>
            <div className="stat-desc text-base-content/70">
              Free & Open Source
            </div>
          </div>
          <div className="stat">
            <div className="stat-value text-primary">∞</div>
            <div className="stat-desc text-base-content/70">
              Unlimited Flashcards
            </div>
          </div>
          <div className="stat">
            <div className="stat-value text-primary">🔒</div>
            <div className="stat-desc text-base-content/70">
              Your Data, Your Control
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
