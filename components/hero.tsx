import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="hero min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="hero-content text-center">
        <div className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content mb-6">
            Transform Your Notes Into
            <span className="text-primary block">Smart Flashcards</span>
          </h1>

          <p className="text-lg md:text-xl text-base-content/80 mb-8 max-w-3xl mx-auto">
            Cognify uses AI to automatically convert your classwork, notes, and
            PDFs into interactive flashcards. Study smarter, not harder with
            personalized learning tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/auth/login" className="btn btn-primary btn-lg">
              Start Creating Flashcards
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com/chaosweasl/cognify"
              className="btn btn-outline btn-lg"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </Link>
          </div>

          <div className="card bg-base-100 shadow-xl max-w-4xl mx-auto">
            <div className="card-body">
              <div className="badge badge-primary badge-outline mb-4">
                Demo Preview
              </div>
              <div className="mockup-window border border-base-300 bg-base-100">
                <div className="bg-base-200 p-6">
                  <div className="space-y-4">
                    <div className="text-left">
                      <div className="font-semibold mb-2 text-base-content">
                        📝 Your Notes:
                      </div>
                      <div className="bg-base-100 p-3 rounded-lg text-sm border">
                        &quot;Photosynthesis is the process by which plants
                        convert sunlight into energy...&quot;
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold mb-2 text-base-content">
                        🤖 AI Generated Flashcard:
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg text-sm border border-primary/20">
                        <strong>Q:</strong> What is photosynthesis?
                        <br />
                        <strong>A:</strong> The process by which plants convert
                        sunlight into energy
                      </div>
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
}
