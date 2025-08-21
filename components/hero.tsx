import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
      <div className="text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
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
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/login">
                Start Creating Flashcards
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="https://github.com/chaosweasl/cognify">
                <Github className="w-5 h-5" />
                View on GitHub
              </Link>
            </Button>
          </div>

          <Card className="max-w-4xl mx-auto shadow-xl">
            <CardContent className="pt-6">
              <Badge variant="outline" className="mb-4">
                Demo Preview
              </Badge>
              <div className="border rounded-lg bg-background overflow-hidden">
                <div className="bg-muted/30 border-b px-3 py-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-left">
                    <div className="font-semibold mb-2">
                      📝 Your Notes:
                    </div>
                    <div className="bg-background p-3 rounded-lg text-sm border">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
