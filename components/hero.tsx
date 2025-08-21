import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";

export function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="flex items-center justify-center min-h-screen text-center">
        <div className="max-w-5xl px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transform Your Notes Into
            <span className="text-primary block">Smart Flashcards</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Cognify uses AI to automatically convert your classwork, notes, and
            PDFs into interactive flashcards. Study smarter, not harder with
            personalized learning tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" asChild>
              <Link href="/auth/login">
                Start Creating Flashcards
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://github.com/chaosweasl/cognify">
                <Github className="mr-2 w-5 h-5" />
                View on GitHub
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-card text-card-foreground shadow-xl max-w-4xl mx-auto">
            <div className="p-6">
              <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-4">
                Demo Preview
              </div>
              <div className="border border-slate-200 dark:border-slate-800 bg-background rounded-lg">
                <div className="bg-muted p-6">
                  <div className="space-y-4">
                    <div className="text-left">
                      <div className="font-semibold mb-2">
                        📝 Your Notes:
                      </div>
                      <div className="bg-background p-3 rounded-lg text-sm border border-slate-200 dark:border-slate-800">
                        &quot;Photosynthesis is the process by which plants
                        convert sunlight into energy...&quot;
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold mb-2">
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
