import { ArrowRight, Github, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function FinalCTA() {
  return (
    <section className="bg-muted/50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Revolutionize Your Study Routine?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join students worldwide who are already using Cognify to create
          smarter study materials. It&apos;s free, open-source, and ready to use
          with your AI API token.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button asChild size="lg" className="gap-2">
            <Link href="/auth/login">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="https://github.com/chaosweasl/cognify">
              <Github className="w-5 h-5" />
              Star on GitHub
              <Star className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <Card className="shadow-lg bg-background max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">
                  Free & Open Source
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">
                  Unlimited Flashcards
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">🔒</div>
                <div className="text-sm text-muted-foreground">
                  Your Data, Your Control
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
