import { Github, Mail, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Row - Logo and Description */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Image
              src="/favicon.svg"
              alt="Cognify Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold">Cognify</span>
          </div>
          <p className="max-w-md text-muted-foreground text-sm md:text-right">
            Transform your study materials into intelligent flashcards with AI.
            Free, open-source, and designed for students who want to learn
            smarter.
          </p>
        </div>

        {/* Middle Row - Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify#readme"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify#readme"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/wiki"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                API Reference
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://github.com/chaosweasl/cognify/issues"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Report Issues
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/discussions"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Community
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/blob/main/LICENSE"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                License
              </Link>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Row - Copyright and Social Links */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2025 Cognify. Open source and made with{" "}
            <Heart className="inline h-4 w-4 text-red-500" /> for students
            everywhere.
          </p>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="ghost" size="icon">
              <Link href="https://github.com/chaosweasl/cognify">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link href="mailto:17daniel.dev@gmail.com">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
