import { ArrowRight, Github, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="bg-muted py-20">
      <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Ready to Revolutionize Your Study Routine?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Join students worldwide who are already using Cognify to create
          smarter study materials. It&apos;s free, open-source, and ready to use
          with your AI API token.
        </p>

        <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth/login">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="https://github.com/chaosweasl/cognify">
              <Github className="mr-2 h-5 w-5" />
              Star on GitHub
              <Star className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-background p-6 shadow-lg">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">
              Free & Open Source
            </div>
          </div>
          <div className="rounded-lg bg-background p-6 shadow-lg">
            <div className="text-3xl font-bold text-primary">∞</div>
            <div className="text-sm text-muted-foreground">
              Unlimited Flashcards
            </div>
          </div>
          <div className="rounded-lg bg-background p-6 shadow-lg">
            <div className="text-3xl font-bold text-primary">🔒</div>
            <div className="text-sm text-muted-foreground">
              Your Data, Your Control
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
